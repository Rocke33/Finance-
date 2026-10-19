import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  Layers,
  Target,
  Settings,
  Receipt,
  PlusCircle,
  Wallet,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { ActionModalType } from './FinanceActionModal';
import { UserProfile } from '../services/api';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenUpload: () => void;
  onOpenActionModal: (type: ActionModalType) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenUpload,
  onOpenActionModal,
  currentUser,
  onLogout,
}) => {
  const handleActionClick = (type: ActionModalType) => {
    onOpenActionModal(type);
    setIsOpenMobile(false);
  };

  const displayName = currentUser?.name || 'User';
  const displayEmail = currentUser?.email || 'user@finance.app';
  const initials = displayName
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'BH';

  const mainNavLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'analytics', label: 'Stats & Trends', icon: PieChart },
    { id: 'categories', label: 'Category Settings', icon: Layers },
    { id: 'budgets', label: 'Category Budgets', icon: Target },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#0F382C] to-[#1A5C4A] text-white flex items-center justify-center shadow-xs">
              <span className="text-xl" role="img" aria-label="BeHisabi Bee">🐝</span>
            </div>
            <div>
              <span className="font-black text-slate-900 text-lg leading-tight block tracking-tight">
                AI<span className="text-[#E5484D]">Finance</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 block uppercase">
                Expense & Budget
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden cursor-pointer"
            onClick={() => setIsOpenMobile(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions (Prominent) */}
        <div className="p-4 pb-2 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenUpload();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#E5484D] hover:bg-[#D63A3F] active:bg-[#B92F34] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>Scan Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('expense')}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-[#E5484D]" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
              Menu
            </span>
            {mainNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;

              return (
                <button
                  key={link.id}
                  id={`nav-${link.id}-desktop`}
                  type="button"
                  onClick={() => {
                    setCurrentTab(link.id);
                    setIsOpenMobile(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-[#E5484D]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#E5484D]' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Area: Reserved empty space above Settings */}
          <div className="pt-4 border-t border-slate-100 mt-auto">
            <div id="ai-assistant-default-anchor-desktop" className="h-14 mb-2 pointer-events-none rounded-xl flex items-center justify-center" />
            <button
              id="nav-settings-desktop"
              type="button"
              onClick={() => {
                setCurrentTab('settings');
                setIsOpenMobile(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-rose-50 text-[#E5484D]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className={`h-4 w-4 ${currentTab === 'settings' ? 'text-[#E5484D]' : 'text-slate-400'}`} />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-[#0F382C] to-[#1A5C4A] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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