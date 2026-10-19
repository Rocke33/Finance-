import React from 'react';
import { LayoutDashboard, CreditCard, PieChart, Settings, Plus } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQuickAction: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenQuickAction,
}) => {
  return (
    <div className="fixed bottom-3 left-4 right-4 z-40 lg:hidden">
      <div className="bg-[#1A1F24] text-white rounded-full px-5 py-2.5 shadow-2xl border border-slate-700/50 flex items-center justify-between max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors cursor-pointer ${
            currentTab === 'dashboard' ? 'text-[#E5484D]' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Home"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>

        {/* 2. Transactions */}
        <button
          type="button"
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors cursor-pointer ${
            currentTab === 'transactions' ? 'text-[#E5484D]' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Transactions"
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-[9px] font-bold">History</span>
        </button>

        {/* 3. Floating '+' Action Button */}
        <button
          type="button"
          onClick={onOpenQuickAction}
          className="h-11 w-11 -my-2 rounded-full bg-[#E5484D] hover:bg-[#D63A3F] active:bg-[#B92F34] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
          aria-label="Add Transaction or Receipt"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>

        {/* 4. Stats */}
        <button
          type="button"
          onClick={() => setCurrentTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors cursor-pointer ${
            currentTab === 'analytics' ? 'text-[#E5484D]' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Stats"
        >
          <PieChart className="h-5 w-5" />
          <span className="text-[9px] font-bold">Stats</span>
        </button>

        {/* 5. Settings */}
        <button
          id="nav-settings-mobile"
          type="button"
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors cursor-pointer ${
            currentTab === 'settings' ? 'text-[#E5484D]' : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold">Settings</span>
        </button>
      </div>
    </div>
  );
};
