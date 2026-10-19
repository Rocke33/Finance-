import React from 'react';
import { ShieldCheck, Heart, TrendingUp, CheckCircle2 } from 'lucide-react';
import { BudgetSummary } from '../types/finance';

interface FinancialHealthCardProps {
  summary: BudgetSummary;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ summary }) => {
  const { monthly_income, total_spent, total_budget } = summary;

  // Calculate Savings Rate %
  const savingsRate = monthly_income > 0
    ? Math.max(0, Math.round(((monthly_income - total_spent) / monthly_income) * 100))
    : 0;

  // Calculate Budget Control %
  const budgetControl = total_budget > 0
    ? Math.max(0, Math.min(100, Math.round((1 - total_spent / total_budget) * 100)))
    : (monthly_income > 0 ? savingsRate : 0);

  // Overall Financial Health Score
  const healthScore = Math.min(100, Math.round((savingsRate * 0.5) + (budgetControl * 0.5)));

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#E5484D]" />
          Financial Health
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Live Score
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Left: Circular Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-100"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-emerald-500 transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-xl font-black text-slate-900 block leading-tight font-mono">
              {healthScore}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600 block">
              {healthScore >= 80 ? 'Great' : healthScore >= 50 ? 'Moderate' : 'Low'}
            </span>
          </div>
        </div>

        {/* Right: Metrics Column */}
        <div className="space-y-3 w-full sm:max-w-xs">
          {/* Savings Rate */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Savings Rate</span>
            <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
              +{savingsRate}% {savingsRate >= 70 ? 'High' : 'Moderate'}
            </span>
          </div>

          {/* Budget Control */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Budget Control</span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${
              budgetControl >= 50 ? 'text-emerald-700 bg-emerald-100/60' : 'text-rose-700 bg-rose-100/60'
            }`}>
              {budgetControl}% {budgetControl >= 50 ? 'Safe' : 'Tight'}
            </span>
          </div>

          {/* Financial Health */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Overall Status</span>
            <span className="font-bold text-slate-800">
              {healthScore >= 75 ? 'Excellent 🌟' : healthScore >= 50 ? 'Stable 👍' : 'Needs Attention ⚠️'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
