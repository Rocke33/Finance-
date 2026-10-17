import { Transaction, BudgetSummary, AIInsight } from '../types/finance';

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_101',
    merchant: "Sultan's Dine",
    category: 'Food',
    amount: 1450.00,
    date: '2026-10-14',
    receipt_url: null,
  },
  {
    id: 'tx_102',
    merchant: 'Agora Superstore',
    category: 'Groceries',
    amount: 3200.00,
    date: '2026-10-12',
    receipt_url: null,
  },
  {
    id: 'tx_103',
    merchant: 'Pathao Rides',
    category: 'Transport',
    amount: 350.00,
    date: '2026-10-13',
    receipt_url: null,
  },
  {
    id: 'tx_104',
    merchant: 'Star Cineplex',
    category: 'Entertainment',
    amount: 1200.00,
    date: '2026-10-14',
    receipt_url: null,
  },
  {
    id: 'tx_105',
    merchant: 'Aarong',
    category: 'Shopping',
    amount: 4500.00,
    date: '2026-10-14',
    receipt_url: null,
  },
  {
    id: 'tx_106',
    merchant: 'Desco Electric Bill',
    category: 'Utilities',
    amount: 3800.00,
    date: '2026-10-10',
    receipt_url: null,
  },
];

export const mockBudgetSummary: BudgetSummary = {
  monthly_income: 60000.00,
  total_budget: 45000.00,
  total_spent: 14500.00,
  remaining: 30500.00,
  categories: [
    {
      name: 'Food',
      allocated: 10000,
      spent: 8500,
      status: 'warning',
    },
    {
      name: 'Groceries',
      allocated: 15000,
      spent: 3200,
      status: 'normal',
    },
    {
      name: 'Transport',
      allocated: 5000,
      spent: 2100,
      status: 'normal',
    },
    {
      name: 'Entertainment',
      allocated: 5000,
      spent: 5100,
      status: 'danger',
    },
    {
      name: 'Utilities',
      allocated: 8000,
      spent: 4000,
      status: 'normal',
    },
  ],
};

export const mockInsights: AIInsight[] = [
  {
    id: 'ins_1',
    type: 'alert',
    message: 'Entertainment budget exceeded by ৳100 (102% spent).',
    action: 'Freeze discretionary movie and outing spending for the rest of the month.',
  },
  {
    id: 'ins_2',
    type: 'warning',
    message: 'Food expenses have reached 85% of monthly allocation.',
    action: 'Cook at home during weekdays to keep restaurant dining within budget.',
  },
  {
    id: 'ins_3',
    type: 'suggestion',
    message: 'Transport spending is currently 58% below planned pacing.',
    action: 'You could reallocate ৳1,500 from Transport into your Emergency Savings.',
  },
];
