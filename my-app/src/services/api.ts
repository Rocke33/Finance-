import {
  BudgetSummary,
  Transaction,
  AIInsight,
  ReceiptExtraction,
  NewTransactionPayload,
  BudgetCategory,
} from '../types/finance';

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  income: number;
}

// অথেনটিকেশন হেডার পাওয়ার হেল্পার
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('finai_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// মক ড্যাশবোর্ড সামারি
const MOCK_SUMMARY: BudgetSummary = {
  monthly_income: 60000,
  total_budget: 53000,
  total_spent: 16452.11,
  remaining: 36547.89,
  categories: [
    { name: 'Food', allocated: 10000, spent: 3402.11, status: 'normal' },
    { name: 'Groceries', allocated: 15000, spent: 3200, status: 'normal' },
    { name: 'Transport', allocated: 5000, spent: 350, status: 'normal' },
    { name: 'Entertainment', allocated: 5000, spent: 1200, status: 'normal' },
    { name: 'Shopping', allocated: 10000, spent: 4500, status: 'normal' },
    { name: 'Utilities', allocated: 8000, spent: 3800, status: 'normal' },
  ],
};

let mockTransactions: Transaction[] = [
  { id: '1', merchant: "Sultan's Dine", category: 'Food', amount: 1450, date: '2026-10-14', receipt_url: null },
  { id: '2', merchant: 'Agora Superstore', category: 'Groceries', amount: 3200, date: '2026-10-12', receipt_url: null },
  { id: '3', merchant: 'Pathao Rides', category: 'Transport', amount: 350, date: '2026-10-13', receipt_url: null },
  { id: '4', merchant: 'Star Cineplex', category: 'Entertainment', amount: 1200, date: '2026-10-14', receipt_url: null },
  { id: '5', merchant: 'Aarong', category: 'Shopping', amount: 4500, date: '2026-10-14', receipt_url: null },
  { id: '6', merchant: 'Desco Electric Bill', category: 'Utilities', amount: 3800, date: '2026-10-10', receipt_url: null },
];

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'alert',
    message: 'Food expenses are pacing moderately this month.',
    action: 'Plan weekend dining out intentionally to maintain comfortable margins.',
  },
  {
    id: '2',
    type: 'suggestion',
    message: 'Your overall spending is within safe budget limits.',
    action: 'Consider transferring ৳10,000 to your savings account.',
  },
];

// --- AUTH APIS ---

export async function loginApi(
  email: string,
  password: string
): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please verify credentials.');
  }
  return await res.json();
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  income: number
): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, income }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed.');
  }
  return await res.json();
}

// --- CORE FINANCE APIS ---

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getDashboardSummary(useDemo = false): Promise<{ data: BudgetSummary }> {
  if (useDemo) return { data: MOCK_SUMMARY };
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    const data = await res.json();
    return { data };
  } catch {
    return { data: MOCK_SUMMARY };
  }
}

export async function getTransactions(category?: string, useDemo = false): Promise<{ data: Transaction[] }> {
  if (useDemo) return { data: mockTransactions };
  try {
    const url = new URL(`${API_BASE_URL}/api/transactions`);
    if (category) url.searchParams.append('category', category);
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    return { data };
  } catch {
    return { data: mockTransactions };
  }
}

export async function createTransaction(payload: NewTransactionPayload, useDemo = false): Promise<Transaction> {
  if (useDemo) {
    const created: Transaction = {
      id: `tx-${Date.now()}`,
      merchant: payload.merchant,
      category: payload.category,
      amount: payload.amount,
      date: payload.date,
      receipt_url: payload.receipt_url ?? null,
    };
    mockTransactions = [created, ...mockTransactions];
    return created;
  }

  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to save transaction to database');
  }
  return await res.json();
}

export async function updateUserIncome(income: number, useDemo = false): Promise<{ monthly_income: number }> {
  if (useDemo) {
    MOCK_SUMMARY.monthly_income = income;
    MOCK_SUMMARY.remaining = income - MOCK_SUMMARY.total_spent;
    return { monthly_income: income };
  }

  const res = await fetch(`${API_BASE_URL}/api/user/income`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ income }),
  });

  if (!res.ok) {
    throw new Error('Failed to update income');
  }
  return await res.json();
}

export async function setCategoryBudget(category: string, monthly_limit: number, useDemo = false): Promise<{ category: string; allocated: number }> {
  if (useDemo) {
    const cat = MOCK_SUMMARY.categories.find((c) => c.name.toLowerCase() === category.toLowerCase());
    if (cat) cat.allocated = monthly_limit;
    return { category, allocated: monthly_limit };
  }

  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, monthly_limit }),
  });

  if (!res.ok) {
    throw new Error('Failed to set budget');
  }
  return await res.json();
}

export async function getAIInsights(useDemo = false): Promise<{ data: AIInsight[] }> {
  if (useDemo) return { data: MOCK_INSIGHTS };
  try {
    const res = await fetch(`${API_BASE_URL}/api/insights`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    const data = await res.json();
    return { data: data.insights || [] };
  } catch {
    return { data: MOCK_INSIGHTS };
  }
}

export async function uploadReceiptImage(file: File): Promise<ReceiptExtraction> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('finai_token');
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}/api/upload-receipt`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze receipt.');
  }

  return await res.json();
}

export async function sendChatMessage(message: string, useDemo = false): Promise<string> {
  if (useDemo) {
    return 'Based on your current budget, keeping daily discretionary expenses under ৳500 will help preserve your savings goals this month!';
  }

  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to communicate with FinAI Chat.');
  }

  const data = await res.json();
  return data.reply;
}