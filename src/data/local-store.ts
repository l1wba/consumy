import Database from "@tauri-apps/plugin-sql";
import type { FinanceStore } from "./finance-store";
import {
  DEFAULT_CATEGORIES,
  type Category,
  type NewTransaction,
  type ThemePreference,
  type Transaction,
  type TransactionId,
} from "./types";

export class LocalFinanceStore implements FinanceStore {
  private databasePromise: Promise<Database> | undefined;

  private async getDatabase(): Promise<Database> {
    if (!this.databasePromise) {
      this.databasePromise = Database.load("sqlite:financas.db").then(async (database) => {
        await database.execute(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount INTEGER NOT NULL CHECK (amount > 0),
            kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
            category TEXT NOT NULL,
            date TEXT NOT NULL
          )
        `);
        await database.execute(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);
        await database.execute(`
          CREATE TABLE IF NOT EXISTS categories (
            name TEXT NOT NULL,
            kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
            PRIMARY KEY (name, kind)
          )
        `);
        const categoryCount = await database.select<{ count: number }[]>(
          "SELECT COUNT(*) AS count FROM categories",
        );
        if ((categoryCount[0]?.count ?? 0) === 0) {
          for (const category of DEFAULT_CATEGORIES) {
            await database.execute(
              "INSERT OR IGNORE INTO categories (name, kind) VALUES ($1, $2)",
              [category.name, category.kind],
            );
          }
        }
        return database;
      }).catch((error: unknown) => {
        this.databasePromise = undefined;
        throw error;
      });
    }

    return this.databasePromise;
  }

  async listCategories(): Promise<Category[]> {
    const database = await this.getDatabase();
    return database.select<Category[]>(
      "SELECT name, kind FROM categories ORDER BY kind, name COLLATE NOCASE",
    );
  }

  async createCategory(category: Category): Promise<void> {
    const database = await this.getDatabase();
    await database.execute(
      "INSERT INTO categories (name, kind) VALUES ($1, $2)",
      [category.name, category.kind],
    );
  }

  async removeCategory(category: Category): Promise<void> {
    const database = await this.getDatabase();
    const remaining = await database.select<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM categories WHERE kind = $1",
      [category.kind],
    );
    if ((remaining[0]?.count ?? 0) <= 1) {
      throw new Error("Mantenha ao menos uma categoria para esse tipo de lançamento.");
    }
    await database.execute(
      "DELETE FROM categories WHERE name = $1 AND kind = $2",
      [category.name, category.kind],
    );
  }

  async renameCategory(category: Category, newName: string): Promise<void> {
    const database = await this.getDatabase();
    const existing = await database.select<{ name: string }[]>(
      `SELECT name FROM categories
       WHERE kind = $1 AND name = $2 COLLATE NOCASE`,
      [category.kind, newName],
    );
    if (existing.some((item) => item.name !== category.name)) {
      throw new Error("Já existe uma categoria com esse nome para esse tipo de lançamento.");
    }
    await database.execute(
      "UPDATE categories SET name = $1 WHERE name = $2 AND kind = $3",
      [newName, category.name, category.kind],
    );
  }

  async getThemePreference(): Promise<ThemePreference | null> {
    const database = await this.getDatabase();
    const rows = await database.select<{ value: string }[]>(
      "SELECT value FROM settings WHERE key = $1",
      ["theme"],
    );
    const preference = rows[0]?.value;
    return preference === "light" || preference === "dark" ? preference : null;
  }

  async saveThemePreference(theme: ThemePreference): Promise<void> {
    const database = await this.getDatabase();
    await database.execute(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ["theme", theme],
    );
  }

  async listTransactions(month: string): Promise<Transaction[]> {
    const database = await this.getDatabase();
    return database.select<Transaction[]>(
      `SELECT id, description, amount, kind, category, date
       FROM transactions
       WHERE date LIKE $1
       ORDER BY date DESC, id DESC`,
      [`${month}%`],
    );
  }

  async createTransaction(transaction: NewTransaction): Promise<void> {
    const database = await this.getDatabase();
    await database.execute(
      `INSERT INTO transactions (description, amount, kind, category, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        transaction.description,
        transaction.amount,
        transaction.kind,
        transaction.category,
        transaction.date,
      ],
    );
  }

  async removeTransaction(id: TransactionId): Promise<void> {
    if (typeof id !== "number") {
      throw new Error("O banco local aceita apenas identificadores numéricos.");
    }
    const database = await this.getDatabase();
    await database.execute("DELETE FROM transactions WHERE id = $1", [id]);
  }
}
