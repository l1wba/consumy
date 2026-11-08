import type { FinanceStore } from "./data/finance-store";
import { SupabaseFinanceStore } from "./data/supabase-store";
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

let store: FinanceStore | undefined;

function getStore(): FinanceStore {
  store ??= new SupabaseFinanceStore();
  return store;
}

export function listCategories(): Promise<Category[]> {
  return getStore().listCategories();
}

export function createCategory(category: Category): Promise<void> {
  return getStore().createCategory(category);
}

export function removeCategory(category: Category): Promise<void> {
  return getStore().removeCategory(category);
}

export function renameCategory(category: Category, newName: string): Promise<void> {
  return getStore().renameCategory(category, newName);
}

export function getThemePreference(): Promise<ThemePreference | null> {
  return getStore().getThemePreference();
}

export function saveThemePreference(theme: ThemePreference): Promise<void> {
  return getStore().saveThemePreference(theme);
}

export function listTransactions(month: string): Promise<Transaction[]> {
  return getStore().listTransactions(month);
}

export function createTransaction(transaction: NewTransaction): Promise<void> {
  return getStore().createTransaction(transaction);
}

export function removeTransaction(id: TransactionId): Promise<void> {
  return getStore().removeTransaction(id);
}

export function subscribeToFinanceChanges(
  onChange: () => void,
  onError: (error: Error) => void,
): () => void {
  return getStore().subscribeToChanges(onChange, onError);
}
