import type { FinanceStore } from "./data/finance-store";
import { LocalFinanceStore } from "./data/local-store";
import type {
  Category,
  NewTransaction,
  ThemePreference,
  Transaction,
  TransactionId,
} from "./data/types";

export {
  DEFAULT_CATEGORIES,
  type Category,
  type NewTransaction,
  type ThemePreference,
  type Transaction,
  type TransactionId,
  type TransactionKind,
} from "./data/types";
export type { FinanceStore } from "./data/finance-store";

const store: FinanceStore = new LocalFinanceStore();

export function listCategories(): Promise<Category[]> {
  return store.listCategories();
}

export function createCategory(category: Category): Promise<void> {
  return store.createCategory(category);
}

export function removeCategory(category: Category): Promise<void> {
  return store.removeCategory(category);
}

export function renameCategory(category: Category, newName: string): Promise<void> {
  return store.renameCategory(category, newName);
}

export function getThemePreference(): Promise<ThemePreference | null> {
  return store.getThemePreference();
}

export function saveThemePreference(theme: ThemePreference): Promise<void> {
  return store.saveThemePreference(theme);
}

export function listTransactions(month: string): Promise<Transaction[]> {
  return store.listTransactions(month);
}

export function createTransaction(transaction: NewTransaction): Promise<void> {
  return store.createTransaction(transaction);
}

export function removeTransaction(id: TransactionId): Promise<void> {
  return store.removeTransaction(id);
}
