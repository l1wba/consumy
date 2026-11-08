export type TransactionKind = "income" | "expense";
export type ThemePreference = "light" | "dark";
export type TransactionId = number | string;
export type RecurringItemType = "bill" | "subscription";
export type RecurrenceFrequency = "monthly" | "yearly";

export interface Transaction {
  id: TransactionId;
  description: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  date: string;
}

export interface NewTransaction {
  description: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  date: string;
}

export interface Category {
  name: string;
  kind: TransactionKind;
}

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  item_type: RecurringItemType;
  frequency: RecurrenceFrequency;
  due_day: number;
  due_month: number | null;
  start_date: string;
  end_date: string | null;
  cancelled_at: string | null;
}

export interface NewRecurringItem {
  name: string;
  amount: number;
  category: string;
  item_type: RecurringItemType;
  frequency: RecurrenceFrequency;
  due_day: number;
  due_month: number | null;
  start_date: string;
  end_date: string | null;
}

export interface RecurringPayment {
  recurring_item_id: string;
  due_date: string;
  transaction_id: string | null;
  paid_at: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Moradia", kind: "expense" },
  { name: "Alimentação", kind: "expense" },
  { name: "Transporte", kind: "expense" },
  { name: "Saúde", kind: "expense" },
  { name: "Lazer", kind: "expense" },
  { name: "Educação", kind: "expense" },
  { name: "Outros", kind: "expense" },
  { name: "Salário", kind: "income" },
  { name: "Freelance", kind: "income" },
  { name: "Investimentos", kind: "income" },
  { name: "Presente", kind: "income" },
  { name: "Outros", kind: "income" },
];
