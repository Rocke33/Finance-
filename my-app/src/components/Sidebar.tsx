import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Lightbulb,
  CreditCard,
  X,
  Sparkles,
  Database,
  Radio,
  PlusCircle,
  Wallet,
  Target,
  LogOut,
} from 'lucide-react';
import { ActionModalType } from './FinanceActionModal';
import { UserProfile } from '../services/api';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  onOpenUpload: () => void;
  onOpenActionModal: (type: ActionModalType) => void;
  currentUser: UserProfile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
  isDemoMode,
  setIsDemoMode,
  onOpenUpload,
  onOpenActionModal,
  currentUser,
  onLogout,
}) => {
  const handleActionClick = (type: ActionModalType) => {
    onOpenActionModal(type);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">FinAI Assistant</span>
              <span className="text-[11px] font-medium text-indigo-600 block">Personal Finance</span>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
            onClick={() => setIsOpenMobile(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Action Button: Scan Receipt */}
        <div className="p-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenUpload();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Receipt className="h-4 w-4" />
            <span>Scan Receipt</span>
          </button>
        </div>

        {/* Navigation & Action Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => {
              setCurrentTab('dashboard');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 ${currentTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          {/* Action Modals Group */}
          <div className="pt-2 pb-1 space-y-1 border-t border-slate-100 my-1">
            <span className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Quick Actions
            </span>

            {/* 2. Add Expense */}
            <button
              type="button"
              onClick={() => handleActionClick('expense')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-rose-500" />
              <span>Add Expense</span>
            </button>

            {/* 3. Set Income */}
            <button
              type="button"
              onClick={() => handleActionClick('income')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span>Set Income</span>
            </button>

            {/* 4. Set Budget */}
            <button
              type="button"
              onClick={() => handleActionClick('budget')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <Target className="h-4 w-4 text-indigo-500" />
              <span>Set Budget</span>
            </button>
          </div>

          {/* Navigation Views Group */}
          <div className="pt-2 pb-1 space-y-1 border-t border-slate-100 my-1">
            <span className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Views
            </span>

            {/* 5. Transactions */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('transactions');
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'transactions'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className={`h-4 w-4 ${currentTab === 'transactions' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Transactions</span>
            </button>

            {/* 6. Budgets & Goals */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('budgets');
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'budgets'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <PieChart className={`h-4 w-4 ${currentTab === 'budgets' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Budgets & Goals</span>
            </button>

            {/* 7. AI Insights */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('insights');
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'insights'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Lightbulb className={`h-4 w-4 ${currentTab === 'insights' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>AI Insights</span>
            </button>
          </div>
        </nav>

        {/* Footer: Live vs Demo Mode Toggle */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                {isDemoMode ? (
                  <>
                    <Database className="h-3.5 w-3.5 text-amber-500" />
                    <span>Demo Mode</span>
                  </>
                ) : (
                  <>
                    <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-emerald-700">Live API</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded border transition-colors ${
                  isDemoMode
                    ? 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    : 'border-slate-300 text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Switch to {isDemoMode ? 'Live' : 'Demo'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isDemoMode
                ? 'Showing offline mock data. Switch to Live to use the FastAPI & database backend.'
                : 'Connected to local/Supabase backend API.'}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2.5 px-1">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
              {currentUser.name.trim().slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};