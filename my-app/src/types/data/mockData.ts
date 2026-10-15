import { Transaction, BudgetSummary } from '../types/finance';

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    merchant: 'Agora Superstore',
    category: 'Groceries',
    amount: 3200,
    date: '2026-10-12',
  },
  {
    id: 'tx-2',
    merchant: 'Pathao Rides',
    category: 'Transport',
    amount: 350,
    date: '2026-10-13',
  },
  {
    id: 'tx-3',
    merchant: 'Star Cineplex',
    category: 'Entertainment',
    amount: 1200,
    date: '2026-10-14',
  },
  {
    id: 'tx-4',
    merchant: 'Aarong',
    category: 'Shopping',
    amount: 4500,
    date: '2026-10-14',
  },
];

export const mockBudgetSummary: BudgetSummary = {
  monthly_income: 60000,
  total_budget: 45000,
  total_spent: 31250,
  remaining: 13750,
  categories: [
    {
      name: 'Groceries',
      allocated: 15000,
      spent: 12000,
      status: 'normal',
    },
    {
      name: 'Transport',
      allocated: 5000,
      spent: 4200,
      status: 'warning',
    },
    {
      name: 'Entertainment',
      allocated: 5000,
      spent: 5100,
      status: 'danger',
    },
    {
      name: 'Shopping',
      allocated: 10000,
      spent: 7000,
      status: 'normal',
    },
  ],
};