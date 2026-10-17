import React from 'react';
import { Wallet, Target, TrendingDown, PiggyBank } from 'lucide-react';
import { BudgetSummary } from '../types/finance';

interface SummaryCardsProps {
  summary: BudgetSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const { monthly_income, total_budget, total_spent, remaining } = summary;

  const budgetUsagePercent = total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0;
  const isOverBudget = remaining < 0;

  const formatCurrency = (val: number) => {
    return `৳${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      title: 'Monthly Income',
      amount: formatCurrency(monthly_income),
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      badge: 'Active Source',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Total Budget',
      amount: formatCurrency(total_budget),
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      badge: `${summary.categories.length} Categories`,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      title: 'Total Spent',
      amount: formatCurrency(total_spent),
      icon: TrendingDown,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      badge: `${budgetUsagePercent}% of budget`,
      badgeColor:
        budgetUsagePercent >= 100
          ? 'bg-rose-100 text-rose-800'
          : budgetUsagePercent >= 80
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700',
    },
    {
      title: 'Remaining Balance',
      amount: formatCurrency(remaining),
      icon: PiggyBank,
      color: isOverBudget ? 'text-rose-600' : 'text-emerald-600',
      bgColor: isOverBudget ? 'bg-rose-50' : 'bg-emerald-50',
      badge: isOverBudget ? 'Over Budget' : 'Safe Margin',
      badgeColor: isOverBudget ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className={`text-2xl font-bold tracking-tight text-slate-900`}>{card.amount}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
