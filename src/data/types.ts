export type TransactionKind = "income" | "expense";
export type ThemePreference = "light" | "dark";
export type TransactionId = number | string;

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
