export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  receipt_url: string | null;
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
}

export interface NewTransactionPayload {
  merchant: string;
  category: string;
  amount: number;
  date: string;
  receipt_url?: string | null;
}