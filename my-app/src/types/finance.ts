export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  receipt_url: string | null;
  payment_source?: 'cash' | 'online';
}

export type CategoryStatus = 'normal' | 'warning' | 'danger';

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  status: CategoryStatus;
}

export interface BudgetSummary {
  monthly_income: number;
  total_budget: number;
  total_spent: number;
  remaining: number;
  total_balance?: number;
  cash_balance?: number;
  online_balance?: number;
  categories: BudgetCategory[];
}

export type InsightType = 'alert' | 'warning' | 'suggestion';

export interface AIInsight {
  id: string;
  type: InsightType;
  message: string;
  action: string;
}

export interface ReceiptExtraction {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  receipt_url?: string | null;
  confidence?: number | null;
  is_fallback?: boolean;
  notes?: string | null;
  payment_source?: 'cash' | 'online';
}

export interface NewTransactionPayload {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  receipt_url?: string | null;
  payment_source?: 'cash' | 'online';
}

export type CategoryType = 'expense' | 'income' | 'savings';

export interface CategoryItem {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
}

export interface NewCategoryPayload {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

export interface WalletsState {
  cash_balance: number;
  online_balance: number;
  total_balance: number;
}

export interface WalletItem {
  id: string;
  name: string;
  type: 'cash' | 'online';
  balance: number;
  color?: string;
  fee?: number;
}