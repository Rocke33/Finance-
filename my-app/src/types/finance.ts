export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  status: 'normal' | 'warning' | 'danger';
}

export interface BudgetSummary {
  monthly_income: number;
  total_budget: number;
  total_spent: number;
  remaining: number;
  categories: BudgetCategory[];
}