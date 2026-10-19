import React from 'react';
import { Wallet, ArrowUpRight, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { BudgetSummary } from '../types/finance';

interface HeroBalanceCardProps {
  summary: BudgetSummary;
  userName?: string;
  onEditIncome?: () => void;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  summary,
  userName = 'User',
  onEditIncome,
}) => {
  const { monthly_income, total_spent } = summary;
  const currentBalance = Math.max(0, monthly_income - total_spent);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon ⛅';
    return 'Good Evening 🌙';
  };

  const formatBDT = (val: number) => {
    return `৳ ${Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07241C] via-[#0E382C] to-[#09261E] text-white p-6 sm:p-7 shadow-lg border border-emerald-950/40">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between relative z-10 mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/70 block">
            Total Balance
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-medium text-emerald-200/80 block">
            {getGreeting()}
          </span>
          <span className="text-sm font-bold text-white block capitalize">
            {userName}
          </span>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 my-3 flex items-baseline justify-between">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          {formatBDT(currentBalance)}
        </h2>

        {onEditIncome && (
          <button
            type="button"
            onClick={onEditIncome}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            title="Update income"
          >
            <Edit3 className="h-3 w-3" />
            <span>Set Income</span>
          </button>
        )}
      </div>

      {/* Income & Expense Sub-Pills */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
        {/* Income Sub-pill */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/10">
          <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-300/80 font-medium block">
              Income
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate block">
              {formatBDT(monthly_income)}
            </span>
          </div>
        </div>

        {/* Expense Sub-pill */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/25 backdrop-blur-xs border border-white/10">
          <div className="h-7 w-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-rose-300/80 font-medium block">
              Expense
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate block">
              {formatBDT(total_spent)}
            </span>
          </div>
        </div>
      </div>

      {/* Carousel dots indicator */}
      <div className="mt-5 flex justify-center items-center gap-1.5 relative z-10">
        <span className="h-1.5 w-4 rounded-full bg-white transition-all" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
    </div>
  );
};
