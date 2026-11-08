import type {
  Category,
  NewTransaction,
  NewRecurringItem,
  RecurringItem,
  RecurringPayment,
  ThemePreference,
  Transaction,
  TransactionId,
} from "./types";

export interface FinanceStore {
  listCategories(): Promise<Category[]>;
  createCategory(category: Category): Promise<void>;
  removeCategory(category: Category): Promise<void>;
  renameCategory(category: Category, newName: string): Promise<void>;
  getThemePreference(): Promise<ThemePreference | null>;
  saveThemePreference(theme: ThemePreference): Promise<void>;
  listTransactions(month: string): Promise<Transaction[]>;
  createTransaction(transaction: NewTransaction): Promise<void>;
  removeTransaction(id: TransactionId): Promise<void>;
  listRecurringItems(): Promise<RecurringItem[]>;
  createRecurringItem(item: NewRecurringItem): Promise<void>;
  cancelRecurringItem(id: string): Promise<void>;
  listRecurringPayments(month: string): Promise<RecurringPayment[]>;
  markRecurringItemPaid(id: string, dueDate: string, paidDate: string): Promise<void>;
  subscribeToChanges(onChange: () => void, onError: (error: Error) => void): () => void;
}
