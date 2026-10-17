import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Receipt,
  RefreshCw,
  AlertCircle,
  Database,
  Radio,
} from 'lucide-react';
import { BudgetSummary, BudgetCategory, Transaction, AIInsight, NewTransactionPayload } from './types/finance';
import {
  getDashboardSummary,
  getTransactions,
  getAIInsights,
  createTransaction,
  checkBackendHealth,
  updateMonthlyIncome,
  updateCategoryBudget,
  UserProfile,
} from './services/api';

import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { SpendingChart } from './components/SpendingChart';
import { BudgetCategoryList } from './components/BudgetCategoryList';
import { TransactionTable } from './components/TransactionTable';
import { AIInsightsCard } from './components/AIInsightsCard';
import { ReceiptUploadModal } from './components/ReceiptUploadModal';
import { FinanceActionModal, ActionModalType } from './components/FinanceActionModal';
import { AuthScreen } from './components/AuthScreen';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('finai_user');
      return saved ? JSON.parse(saved) as UserProfile : null;
    } catch {
      localStorage.removeItem('finai_user');
      return null;
    }
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  
  // ইউজার ইচ্ছাকৃতভাবে মক মোড ব্যবহার করতে চাইছে কি না
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuthSuccess = (user: UserProfile, token: string) => {
    localStorage.setItem('finai_token', token);
    localStorage.setItem('finai_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('finai_token');
    localStorage.removeItem('finai_user');
    setCurrentUser(null);
  };

  // Load all data
  const loadData = useCallback(async (isRefresh = false, forceDemoMode?: boolean) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    const activeDemoSetting = forceDemoMode !== undefined ? forceDemoMode : isDemoMode;

    try {
      let isOnline = false;
      try {
        isOnline = await checkBackendHealth();
      } catch (e) {
        isOnline = false;
      }
      setBackendOnline(isOnline);

      // ইউজার ডেমো চাইলে ডেমো, অথবা ব্যাকএন্ড অফলাইন হলে অটো-ফলব্যাক
      const useDemo = activeDemoSetting || !isOnline;

      const [summaryRes, txsRes, insightsRes] = await Promise.all([
        getDashboardSummary(useDemo),
        getTransactions(undefined, useDemo),
        getAIInsights(useDemo),
      ]);

      setSummary(summaryRes.data);
      setTransactions(txsRes.data);
      setInsights(insightsRes.data);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      setErrorMessage(err.message || 'Could not load finance records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser, loadData]);

  // টগল মোড হ্যান্ডলার
  const handleToggleDemoMode = (demo: boolean) => {
    setIsDemoMode(demo);
    loadData(true, demo);
  };

  const handleSaveIncome = async (income: number) => {
    setSummary((prev) => prev ? { ...prev, monthly_income: income } : prev);
    try {
      await updateMonthlyIncome(income, isDemoMode || !backendOnline);
      if (backendOnline && !isDemoMode) await loadData(true);
    } catch (err: any) {
      console.warn('Income persistence error:', err);
    }
  };

  const handleSaveBudget = async (category: string, limit: number) => {
    setSummary((prev) => {
      if (!prev) return prev;

      const hasCategory = prev.categories.some((cat) => cat.name.toLowerCase() === category.toLowerCase());
      const updatedCategories: BudgetCategory[] = hasCategory
        ? prev.categories.map((cat) => {
            if (cat.name.toLowerCase() !== category.toLowerCase()) return cat;
            const status = cat.spent >= limit ? 'danger' : cat.spent >= limit * 0.8 ? 'warning' : 'normal';
            return { ...cat, allocated: limit, status };
          })
        : [...prev.categories, { name: category, allocated: limit, spent: 0, status: 'normal' }];
      const totalBudget = updatedCategories.reduce((total, cat) => total + cat.allocated, 0);

      return {
        ...prev,
        total_budget: totalBudget,
        remaining: totalBudget - prev.total_spent,
        categories: updatedCategories,
      };
    });

    try {
      await updateCategoryBudget(category, limit, isDemoMode || !backendOnline);
      if (backendOnline && !isDemoMode) await loadData(true);
    } catch (err: any) {
      console.warn('Budget persistence error:', err);
    }
  };

  // রসিদ কনফার্ম করার পর হ্যান্ডলার
  const handleTransactionSaved = async (newTx: NewTransactionPayload) => {
    const expenseAmount = Number(newTx.amount);

    const newEntry: Transaction = {
      id: `tx-${Date.now()}`,
      merchant: newTx.merchant,
      category: newTx.category,
      amount: expenseAmount,
      date: newTx.date,
      receipt_url: newTx.receipt_url ?? null,
    };

    setTransactions((prev) => [newEntry, ...prev]);

    setSummary((prev) => {
      if (!prev) return prev;

      const updatedSpent = Number(prev.total_spent || 0) + expenseAmount;
      const updatedRemaining = Number(prev.monthly_income || 0) - updatedSpent;

      const updatedCategories: BudgetCategory[] = prev.categories.map((cat) => {
        if (cat.name.toLowerCase() === newTx.category.toLowerCase()) {
          const newSpent = Number(cat.spent || 0) + expenseAmount;
          let newStatus: 'normal' | 'warning' | 'danger' = 'normal';

          if (newSpent >= cat.allocated) {
            newStatus = 'danger';
          } else if (newSpent >= cat.allocated * 0.8) {
            newStatus = 'warning';
          }

          return {
            ...cat,
            spent: newSpent,
            status: newStatus,
          };
        }
        return cat;
      });

      return {
        ...prev,
        total_spent: updatedSpent,
        remaining: updatedRemaining,
        categories: updatedCategories,
      };
    });

    // ৩. ব্যাকএন্ডের ডাটাবেসে পারসিস্ট করা
    try {
      await createTransaction(newTx, isDemoMode || !backendOnline);
      // ব্যাকএন্ড লাইভ থাকলে ডাটাবেজ থেকে ফ্রেশ সামারি রি-লোড করা
      if (backendOnline && !isDemoMode) {
        await loadData(true);
      }
    } catch (err: any) {
      console.warn('Backend persistence error:', err);
    }
  };

  const isActuallyLive = backendOnline && !isDemoMode;

  if (!currentUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={() =>
          setCurrentUser({
            id: 'user-demo',
            name: 'Demo User',
            email: 'demo@finance.app',
            income: 60000,
          })
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isSidebarOpenMobile}
        setIsOpenMobile={setIsSidebarOpenMobile}
        isDemoMode={!isActuallyLive}
        setIsDemoMode={handleToggleDemoMode}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenActionModal={(type) => setActiveModal(type)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpenMobile(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 capitalize">
              {currentTab === 'dashboard' ? 'Overview' : currentTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Backend Status Pill */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isActuallyLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isActuallyLive ? (
                <>
                  <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>Live Backend</span>
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 text-amber-500" />
                  <span>{isDemoMode ? 'Demo Mode' : 'Offline Mock'}</span>
                </>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Scan Receipt Button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scan Receipt</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => loadData(true)}
                className="font-semibold underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : !summary ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">Failed to load budget records.</p>
              <button
                type="button"
                onClick={() => loadData()}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg"
              >
                Reload Dashboard
              </button>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  <SummaryCards summary={summary} />

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <SpendingChart categories={summary.categories} />
                    </div>
                    <div>
                      <BudgetCategoryList categories={summary.categories} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <TransactionTable
                        transactions={transactions}
                        onOpenUpload={() => setIsUploadModalOpen(true)}
                      />
                    </div>
                    <div>
                      <AIInsightsCard insights={insights} />
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'transactions' && (
                <div className="space-y-6">
                  <TransactionTable
                    transactions={transactions}
                    onOpenUpload={() => setIsUploadModalOpen(true)}
                  />
                </div>
              )}

              {currentTab === 'budgets' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SpendingChart categories={summary.categories} />
                    <BudgetCategoryList categories={summary.categories} />
                  </div>
                </div>
              )}

              {currentTab === 'insights' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <AIInsightsCard insights={insights} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ReceiptUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTransactionSaved={handleTransactionSaved}
      />
      <FinanceActionModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onSaveExpense={handleTransactionSaved}
        onSaveIncome={handleSaveIncome}
        onSaveBudget={handleSaveBudget}
      />
    </div>
  );
}