import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu,
  Receipt,
  RefreshCw,
  AlertCircle,
  Plus,
  ArrowLeft,
} from 'lucide-react';

import {
  BudgetSummary,
  Transaction,
  AIInsight,
  NewTransactionPayload,
  CategoryItem,
  CategoryType,
  WalletsState,
} from './types/finance';

import {
  getDashboardSummary,
  getTransactions,
  getAIInsights,
  createTransaction,
  deleteTransactionApi,
  checkBackendHealth,
  updateUserIncome,
  setCategoryBudget,
  getCategoriesApi,
  createCategoryApi,
  deleteCategoryApi,
  getWalletsApi,
  UserProfile,
} from './services/api';

import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { HeroBalanceCard } from './components/HeroBalanceCard';
import { WalletsCarousel } from './components/WalletsCarousel';
import { BeHisabiAISection } from './components/BeHisabiAISection';
import { DailySpendTrendChart } from './components/DailySpendTrendChart';
import { TransactionsPage } from './components/TransactionsPage';
import { CategorySettingsView } from './components/CategorySettingsView';
import { FinancialHealthCard } from './components/FinancialHealthCard';
import { MonthlySpendingForecast } from './components/MonthlySpendingForecast';
import { MonthlySpendingPieChart } from './components/MonthlySpendingPieChart';
import { SpendingChart } from './components/SpendingChart';
import { BudgetCategoryList } from './components/BudgetCategoryList';
import { AIInsightsCard } from './components/AIInsightsCard';
import { SettingsView } from './components/SettingsView';
import { ReceiptUploadModal } from './components/ReceiptUploadModal';
import { FinanceActionModal, ActionModalType } from './components/FinanceActionModal';
import { AuthScreen } from './components/AuthScreen';
import { ChatWidget } from './components/ChatWidget';
import { LoadingSkeleton } from './components/LoadingSkeleton';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('finai_user');
      return saved ? (JSON.parse(saved) as UserProfile) : null;
    } catch {
      localStorage.removeItem('finai_user');
      return null;
    }
  });

  // History & Route State
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const paramTab = new URLSearchParams(window.location.search).get('tab');
      return paramTab || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Scroll Restoration Management
  const scrollMapRef = useRef<Record<string, number>>({});
  const navigationTypeRef = useRef<'INITIAL' | 'PUSH' | 'POP' | 'IDLE'>('INITIAL');

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState<boolean>(false);

  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletsState | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Browser History & PopState Sync
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!window.history.state || typeof window.history.state.index !== 'number') {
      const initialTab = new URLSearchParams(window.location.search).get('tab') || 'dashboard';
      window.history.replaceState(
        { tab: initialTab, index: 0 },
        '',
        window.location.pathname + (initialTab !== 'dashboard' ? `?tab=${initialTab}` : '')
      );
      setHistoryIndex(0);
    } else {
      setHistoryIndex(window.history.state.index);
    }

    const handlePopState = (e: PopStateEvent) => {
      // Record current scroll position before tab switch
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      scrollMapRef.current[currentTab] = currentScrollY;

      const targetTab = e.state?.tab || new URLSearchParams(window.location.search).get('tab') || 'dashboard';
      const targetIndex = typeof e.state?.index === 'number' ? e.state.index : 0;
      setHistoryIndex(targetIndex);

      navigationTypeRef.current = 'POP';
      setCurrentTab(targetTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentTab]);

  // Tab navigation with PUSH history and instant top scroll
  const navigateToTab = useCallback((newTab: string) => {
    if (newTab === currentTab) return;

    // 1. Record departing tab vertical scroll position
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;
    scrollMapRef.current[currentTab] = currentScrollY;

    // 2. Push state to browser history
    const nextIndex = (window.history.state?.index ?? 0) + 1;
    window.history.pushState(
      { tab: newTab, index: nextIndex },
      '',
      window.location.pathname + (newTab !== 'dashboard' ? `?tab=${newTab}` : '')
    );
    setHistoryIndex(nextIndex);

    // 3. Mark navigation type as PUSH
    navigationTypeRef.current = 'PUSH';
    setCurrentTab(newTab);

    // 4. Instantly start new page at top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentTab]);

  // In-app Back button: returns to previous page, or dashboard fallback if opened directly
  const handleInAppBack = useCallback(() => {
    const currentIndex = window.history.state?.index ?? historyIndex;
    if (currentIndex > 0) {
      window.history.back();
    } else {
      navigateToTab('dashboard');
    }
  }, [historyIndex, navigateToTab]);

  // Scroll Restoration on POP when content finishes rendering
  useEffect(() => {
    if (navigationTypeRef.current === 'POP' && !isLoading) {
      const targetY = scrollMapRef.current[currentTab] ?? 0;
      const raf = requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
        navigationTypeRef.current = 'IDLE';
      });
      return () => cancelAnimationFrame(raf);
    } else if (navigationTypeRef.current === 'PUSH') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      navigationTypeRef.current = 'IDLE';
    }
  }, [currentTab, isLoading]);

  const handleAuthSuccess = (user: UserProfile, token: string) => {
    localStorage.setItem('finai_token', token);
    localStorage.setItem('finai_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('finai_token');
    localStorage.removeItem('finai_user');
    setCurrentUser(null);
    setSummary(null);
    setTransactions([]);
    setWallets(null);
    setCategories([]);
    setInsights([]);
  };

  // Primary data loader strictly scoped to authenticated user
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const online = await checkBackendHealth();
      setBackendOnline(online);

      const [summaryRes, txsRes, insightsRes, catRes, walletsRes] = await Promise.all([
        getDashboardSummary(),
        getTransactions(),
        getAIInsights(),
        getCategoriesApi().catch(() => []),
        getWalletsApi().catch(() => null),
      ]);

      setSummary(summaryRes.data);
      setTransactions(txsRes.data);
      setInsights(insightsRes.data);
      setCategories(catRes);
      if (walletsRes) {
        setWallets(walletsRes);
      }
    } catch (err: any) {
      console.error('Failed to load user financial data:', err);
      if (err.message && (err.message.includes('401') || err.message.includes('validate credentials'))) {
        handleLogout();
      } else {
        setErrorMessage(err.message || 'Could not load your financial records. Please check the backend connection.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Income update
  const handleSaveIncome = async (income: number) => {
    setSummary((prev) => (prev ? { ...prev, monthly_income: income } : prev));
    try {
      await updateUserIncome(income);
      await loadData(true);
    } catch (err: any) {
      console.error('Income update failed:', err);
      setErrorMessage(err.message || 'Failed to update income.');
    }
  };

  // Category budget update
  const handleSaveBudget = async (category: string, limit: number) => {
    try {
      await setCategoryBudget(category, limit);
      await loadData(true);
    } catch (err: any) {
      console.error('Budget update failed:', err);
      setErrorMessage(err.message || 'Failed to save category budget.');
    }
  };

  // Create new transaction
  const handleTransactionSaved = async (newTx: NewTransactionPayload) => {
    try {
      await createTransaction(newTx);
      await loadData(true);
    } catch (err: any) {
      console.error('Transaction creation failed:', err);
      setErrorMessage(err.message || 'Failed to save transaction.');
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (txId: string) => {
    try {
      await deleteTransactionApi(txId);
      setTransactions((prev) => prev.filter((t) => t.id !== txId));
      await loadData(true);
    } catch (err: any) {
      console.error('Transaction deletion failed:', err);
      setErrorMessage(err.message || 'Failed to delete transaction.');
    }
  };

  // Category management
  const handleAddCategory = async (name: string, type: CategoryType, color: string, icon: string) => {
    try {
      const created = await createCategoryApi({ name, type, color, icon });
      setCategories((prev) => [...prev, created]);
    } catch (err: any) {
      console.error('Category creation failed:', err);
      throw err;
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteCategoryApi(catId);
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    } catch (err: any) {
      console.error('Category deletion failed:', err);
      throw err;
    }
  };

  // If not authenticated, render light-mode AuthScreen
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const categoryNamesList = categories.map((c) => c.name);
  const effectiveTotalBalance = wallets
    ? wallets.total_balance
    : (summary?.total_balance ?? Math.max(0, (summary?.monthly_income ?? 0) - (summary?.total_spent ?? 0)));

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex text-slate-800 antialiased selection:bg-[#E5484D] selection:text-white">
      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        isOpenMobile={isSidebarOpenMobile}
        setIsOpenMobile={setIsSidebarOpenMobile}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenActionModal={(type) => setActiveModal(type)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 pb-20 lg:pb-8">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* In-App Back Button or Mobile Menu Button */}
            {currentTab !== 'dashboard' ? (
              <button
                type="button"
                onClick={handleInAppBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold border border-slate-200 bg-white shadow-2xs"
                title="Back to previous page"
                aria-label="Back to previous page"
              >
                <ArrowLeft className="h-4 w-4 text-[#E5484D]" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSidebarOpenMobile(true)}
                className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Logo on Mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <span className="text-xl" role="img" aria-label="AiFinance">🐝</span>
              <span className="font-black text-slate-900 text-base">
                AI<span className="text-[#E5484D]">Finance</span>
              </span>
            </div>

            <h1 className="hidden lg:block text-base sm:text-lg font-bold text-slate-900 capitalize">
              {currentTab === 'dashboard'
                ? 'Financial Dashboard'
                : currentTab === 'transactions'
                ? 'Transactions History'
                : currentTab === 'analytics'
                ? 'Spending Statistics & Trends'
                : currentTab === 'categories'
                ? 'Category Settings'
                : currentTab === 'budgets'
                ? 'Category Budgets'
                : 'Account Settings'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Synced</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh financial data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#E5484D]' : ''}`} />
            </button>

            {/* Scan Receipt Button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Receipt className="h-3.5 w-3.5 text-slate-500" />
              <span>Scan Receipt</span>
            </button>

            {/* Quick Add Expense Button */}
            <button
              type="button"
              onClick={() => setActiveModal('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5484D] hover:bg-[#D63A3F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => loadData(true)}
                className="font-bold underline hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : !summary ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <p className="text-sm font-semibold text-slate-600">Failed to load personal finance records.</p>
              <button
                type="button"
                onClick={() => loadData()}
                className="mt-3 px-5 py-2.5 bg-[#E5484D] hover:bg-[#D63A3F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Reload Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD (Home) */}
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Hero Balance Card */}
                  <HeroBalanceCard
                    summary={summary}
                    userName={currentUser.name}
                    onEditIncome={() => setActiveModal('income')}
                    totalBalance={effectiveTotalBalance}
                  />

                  {/* My Wallets (Exactly 2 Fixed Wallets: Cash & Online) */}
                  <WalletsCarousel
                    wallets={wallets}
                    onWalletsUpdated={() => loadData(true)}
                    totalBalance={effectiveTotalBalance}
                  />

                  {/* BeHisabi AI Section */}
                  <BeHisabiAISection
                    onOpenAdvisor={() => setIsAdvisorChatOpen(true)}
                    onOpenReceiptScan={() => setIsUploadModalOpen(true)}
                    onOpenSmartBudget={() => navigateToTab('budgets')}
                  />

                  {/* Daily Spend Trend Chart */}
                  <DailySpendTrendChart transactions={transactions} />

                  {/* AI Financial Insights Card & Financial Health */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AIInsightsCard
                      insights={insights}
                      onOpenAddExpense={() => setActiveModal('expense')}
                      onOpenSetBudget={() => setActiveModal('budget')}
                    />
                    <FinancialHealthCard summary={summary} />
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSACTIONS (Dedicated Page) */}
              {currentTab === 'transactions' && (
                <TransactionsPage
                  transactions={transactions}
                  summary={summary}
                  onOpenUpload={() => setIsUploadModalOpen(true)}
                  onOpenAddExpense={() => setActiveModal('expense')}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {/* TAB 3: STATS & ANALYTICS */}
              {currentTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FinancialHealthCard summary={summary} />
                    <MonthlySpendingForecast summary={summary} />
                  </div>
                  <MonthlySpendingPieChart categories={summary.categories} />
                  <DailySpendTrendChart transactions={transactions} />
                </div>
              )}

              {/* TAB 4: CATEGORY SETTINGS */}
              {currentTab === 'categories' && (
                <CategorySettingsView
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {/* TAB 5: CATEGORY BUDGETS */}
              {currentTab === 'budgets' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BudgetCategoryList
                      categories={summary.categories}
                      onOpenSetBudget={() => setActiveModal('budget')}
                    />
                    <SpendingChart categories={summary.categories} />
                  </div>
                  <MonthlySpendingForecast summary={summary} />
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {currentTab === 'settings' && (
                <SettingsView
                  currentUser={currentUser}
                  onNavigateTab={(tab) => navigateToTab(tab)}
                  onLogout={handleLogout}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar with Floating Red '+' Action Button */}
      <BottomNavBar
        currentTab={currentTab}
        setCurrentTab={navigateToTab}
        onOpenQuickAction={() => setActiveModal('expense')}
      />

      {/* Receipt Upload & Gemini Vision OCR Modal */}
      <ReceiptUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTransactionSaved={handleTransactionSaved}
        wallets={wallets}
      />

      {/* Finance Action Modal (Expense / Income / Budget) */}
      <FinanceActionModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onSaveExpense={handleTransactionSaved}
        onSaveIncome={handleSaveIncome}
        onSaveBudget={handleSaveBudget}
        availableCategories={categoryNamesList}
        wallets={wallets}
      />

      {/* BeHisabi AI Chat Advisor Widget (Draggable, English Default, Real Wallet Context) */}
      <ChatWidget
        isOpenExternal={isAdvisorChatOpen}
        onCloseExternal={() => setIsAdvisorChatOpen(false)}
      />
    </div>
  );
}