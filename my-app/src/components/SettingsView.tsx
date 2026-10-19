import React from 'react';
import {
  User,
  Shield,
  Layers,
  Target,
  Wallet,
  Bell,
  ChevronRight,
  LogOut,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { UserProfile } from '../services/api';

interface SettingsViewProps {
  currentUser: UserProfile | null;
  onNavigateTab: (tab: string) => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onNavigateTab,
  onLogout,
}) => {
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

  const menuItems = [
    {
      id: 'categories',
      title: 'Category Settings',
      desc: 'Manually create and manage custom categories',
      icon: Layers,
      color: 'bg-orange-50 text-orange-600',
      action: () => onNavigateTab('categories'),
    },
    {
      id: 'budgets',
      title: 'Category Budgets',
      desc: 'Set monthly spending limits & overspend alerts',
      icon: Target,
      color: 'bg-emerald-50 text-emerald-600',
      action: () => onNavigateTab('budgets'),
    },
    {
      id: 'wallets',
      title: 'Wallet & Fee Settings',
      desc: 'Add new wallets and manage default transaction fees',
      icon: Wallet,
      color: 'bg-rose-50 text-[#E5484D]',
      action: () => onNavigateTab('dashboard'),
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      desc: 'Daily reminders, budget alerts & test notifications',
      icon: Bell,
      color: 'bg-blue-50 text-blue-600',
      action: () => alert('Notification settings are active with real-time browser alerts.'),
    },
  ];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your profile, sync, and financial preferences</p>
      </div>

      {/* Profile Card (Matching Page 8 screenshot!) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#0F382C] to-[#1A5C4A] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {initials}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">{displayName}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Cloud className="h-3 w-3 text-emerald-500" />
              <span>{displayEmail}</span>
            </p>
          </div>
        </div>
      </div>

      {/* BeHisabi Pro Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl border border-emerald-200/80 p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-950">AIFinance Pro</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              Full AI receipt parsing, unlimited wallets & spending analytics enabled
            </p>
          </div>
        </div>
      </div>

      {/* Financial Setup Group */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Financial Setup
        </span>
        <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block group-hover:text-[#E5484D] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Account</span>
        </button>
      </div>
    </div>
  );
};
