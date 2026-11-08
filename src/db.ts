import type { FinanceStore } from "./data/finance-store";
import { SupabaseFinanceStore } from "./data/supabase-store";
import type {
  Category,
  NewTransaction,
  NewRecurringItem,
  RecurringItem,
  RecurringPayment,
  ThemePreference,
  Transaction,
  TransactionId,
} from "./data/types";

export {
  DEFAULT_CATEGORIES,
  type Category,
  type NewTransaction,
  type NewRecurringItem,
  type RecurringItem,
  type RecurringPayment,
  type ThemePreference,
  type Transaction,
  type TransactionId,
  type TransactionKind,
  type RecurringItemType,
  type RecurrenceFrequency,
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

export function listRecurringItems(): Promise<RecurringItem[]> {
  return getStore().listRecurringItems();
}

export function createRecurringItem(item: NewRecurringItem): Promise<void> {
  return getStore().createRecurringItem(item);
}

export function cancelRecurringItem(id: string): Promise<void> {
  return getStore().cancelRecurringItem(id);
}

export function listRecurringPayments(month: string): Promise<RecurringPayment[]> {
  return getStore().listRecurringPayments(month);
}

export function markRecurringItemPaid(id: string, dueDate: string, paidDate: string): Promise<void> {
  return getStore().markRecurringItemPaid(id, dueDate, paidDate);
}

export function subscribeToFinanceChanges(
  onChange: () => void,
  onError: (error: Error) => void,
): () => void {
  return getStore().subscribeToChanges(onChange, onError);
}
