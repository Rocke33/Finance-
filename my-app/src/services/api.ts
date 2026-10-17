import {
  BudgetSummary,
  Transaction,
  AIInsight,
  ReceiptExtraction,
  NewTransactionPayload,
} from '../types/finance';

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  income: number;
}

export async function loginApi(email: string, password: string): Promise<{ access_token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed. Please check credentials.');
  }
  return await res.json();
}

export async function registerApi(name: string, email: string, password: string, income: number): Promise<{ access_token: string; user: UserProfile }> {
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

// মক ডেটা (ফলব্যাক হিসেবে)
const MOCK_SUMMARY: BudgetSummary = {
  monthly_income: 60000,
  total_budget: 45000,
  total_spent: 14500,
  remaining: 30500,
  categories: [
    { name: 'Food', allocated: 10000, spent: 8500, status: 'warning' },
    { name: 'Groceries', allocated: 15000, spent: 3200, status: 'normal' },
    { name: 'Transport', allocated: 5000, spent: 2100, status: 'normal' },
    { name: 'Entertainment', allocated: 5000, spent: 5100, status: 'danger' },
    { name: 'Utilities', allocated: 8000, spent: 4000, status: 'normal' },
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
    message: 'Entertainment budget exceeded by ৳100 (102% spent).',
    action: 'Freeze discretionary movie and outing spending for the rest of the month.',
  },
  {
    id: '2',
    type: 'warning',
    message: 'Food expenses have reached 85% of monthly allocation.',
    action: 'Cook at home during weekdays to keep restaurant dining within budget.',
  },
];

// ১. হেলথ চেক (main.py এর সাথে ম্যাচ করা)
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// ২. ড্যাশবোর্ড সামারি
export async function getDashboardSummary(useDemo = false): Promise<{ data: BudgetSummary }> {
  if (useDemo) return { data: MOCK_SUMMARY };
  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    const data = await res.json();
    return { data };
  } catch (err) {
    return { data: MOCK_SUMMARY };
  }
}

// ৩. ট্রানজ্যাকশন লিস্ট
export async function getTransactions(category?: string, useDemo = false): Promise<{ data: Transaction[] }> {
  if (useDemo) return { data: mockTransactions };
  try {
    const url = new URL(`${API_BASE_URL}/api/transactions`);
    if (category) url.searchParams.append('category', category);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    return { data };
  } catch (err) {
    return { data: mockTransactions };
  }
}

// ৪. নতুন ট্রানজ্যাকশন তৈরি
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to save transaction to database');
  }
  return await res.json();
}

export async function updateMonthlyIncome(income: number, useDemo = false): Promise<void> {
  if (useDemo) return;

  const res = await fetch(`${API_BASE_URL}/api/user/income`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ income }),
  });

  if (!res.ok) throw new Error('Failed to update monthly income');
}

export async function updateCategoryBudget(category: string, monthlyLimit: number, useDemo = false): Promise<void> {
  if (useDemo) return;

  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, monthly_limit: monthlyLimit }),
  });

  if (!res.ok) throw new Error('Failed to update category budget');
}

// ৫. এআই ইনসাইটস
export async function getAIInsights(useDemo = false): Promise<{ data: AIInsight[] }> {
  if (useDemo) return { data: MOCK_INSIGHTS };
  try {
    const res = await fetch(`${API_BASE_URL}/api/insights`);
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    const data = await res.json();
    return { data: data.insights || [] };
  } catch (err) {
    return { data: MOCK_INSIGHTS };
  }
}

// ৬. রসিদ আপলোড ও স্ক্যান
export async function uploadReceiptImage(file: File): Promise<ReceiptExtraction> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload-receipt`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze receipt.');
  }

  return await res.json();
}