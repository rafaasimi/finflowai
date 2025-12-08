export type TransactionType = "income" | "expense";

export type Category =
  | "Housing"
  | "Transport"
  | "Food"
  | "Entertainment"
  | "Health"
  | "Education"
  | "Pets"
  | "Clothing"
  | "Salary"
  | "Investment"
  | "Other";

export interface FixedExpense {
  id: string;
  user_id?: string;
  description: string;
  amount: number;
  category: Category;
  dayOfMonth: number;
}

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  date: string; // ISO String
  fixedExpenseId?: string; // Link to the definition if generated automatically
  installments?: {
    current: number;
    total: number;
    originalId: string;
  };
}

export interface Budget {
  id: string;
  user_id?: string;
  category: Category;
  limit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}
