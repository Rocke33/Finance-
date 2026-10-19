import {
  BudgetSummary,
  Transaction,
  AIInsight,
  ReceiptExtraction,
  NewTransactionPayload,
  CategoryItem,
  NewCategoryPayload,
} from '../types/finance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  income: number;
}

// Authentication headers helper
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('finai_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

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

export async function getDashboardSummary(): Promise<{ data: BudgetSummary }> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch dashboard summary');
  }
  const data = await res.json();
  return { data };
}

export async function getTransactions(category?: string): Promise<{ data: Transaction[] }> {
  const url = new URL(`${API_BASE_URL}/api/transactions`);
  if (category && category !== 'All') url.searchParams.append('category', category);
  
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch transactions');
  }
  const data = await res.json();
  return { data };
}

export async function createTransaction(payload: NewTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save transaction to database');
  }
  return await res.json();
}

export async function deleteTransactionApi(transactionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete transaction');
  }
}

export async function updateUserIncome(income: number): Promise<{ monthly_income: number }> {
  const res = await fetch(`${API_BASE_URL}/api/user/income`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ income }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update income');
  }
  return await res.json();
}

export async function setCategoryBudget(category: string, monthly_limit: number): Promise<{ category: string; allocated: number }> {
  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, monthly_limit }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to set budget');
  }
  return await res.json();
}

// --- CATEGORY MANAGEMENT APIS ---

export async function getCategoriesApi(): Promise<CategoryItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch categories');
  }
  return await res.json();
}

export async function createCategoryApi(payload: NewCategoryPayload): Promise<CategoryItem> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create category');
  }
  return await res.json();
}

export async function deleteCategoryApi(categoryId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete category');
  }
}

// --- AI INSIGHTS & RECEIPT APIS ---

export async function getAIInsights(): Promise<{ data: AIInsight[] }> {
  const res = await fetch(`${API_BASE_URL}/api/insights`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch AI insights');
  }
  const data = await res.json();
  return { data: data.insights || [] };
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

export async function sendChatMessage(message: string): Promise<string> {
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