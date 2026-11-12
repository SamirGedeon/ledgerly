export interface User {
  id: number;
  name: string;
  role: "owner" | "viewer";
  email: string;
  account_name: string;
  time_zone: string;
}
export interface Category {
  id: number;
  name: string;
  color: string;
}
export interface Entry {
  id: number;
  description: string;
  kind: "income" | "expense";
  amount_cents: number;
  occurred_on: string;
  voided_at: string | null;
  category_id: number;
  category_name: string;
  category_color: string;
}
export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  category_color: string;
  limit_cents: number;
  spent_cents: number;
}
export interface Report {
  income_cents: number;
  expense_cents: number;
  balance_cents: number;
  transaction_count: number;
  daily: { date: string; income_cents: number; expense_cents: number }[];
  by_category: { name: string; color: string; amount_cents: number }[];
}
