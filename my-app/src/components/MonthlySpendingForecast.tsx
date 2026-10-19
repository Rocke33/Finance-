import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { BudgetSummary } from '../types/finance';

interface MonthlySpendingForecastProps {
  summary: BudgetSummary;
}

export const MonthlySpendingForecast: React.FC<MonthlySpendingForecastProps> = ({ summary }) => {
  const { total_spent, total_budget } = summary;

  // Calculate day of current month
  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Daily pace
  const dailyPace = Math.round((total_spent / currentDay) * 100) / 100;

  // Forecasted month-end spend
  const estimatedMonthEnd = Math.round(dailyPace * daysInMonth);

  // Effective limit: use total_budget if set, else monthly_income
  const effectiveLimit = total_budget > 0 ? total_budget : summary.monthly_income;
  const estimatedDeficit = Math.round(effectiveLimit - estimatedMonthEnd);
  const isExceeding = estimatedDeficit < 0;

  const progressPercent = effectiveLimit > 0
    ? Math.min(100, Math.round((total_spent / effectiveLimit) * 100))
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monthly Spending Forecast</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Est. month-end spend based on your daily pace
          </p>
        </div>
        <span className="text-xs font-bold text-slate-800">
          Day {currentDay} of {daysInMonth}
        </span>
      </div>

      {/* Actual Spend so far vs Limit */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">
          Actual Spend (So Far): <strong className="text-slate-900 font-bold">৳{total_spent.toLocaleString()}</strong>
        </span>
        <span className="text-slate-500 font-medium">
          Budget Limit: <strong className="text-slate-900 font-bold">৳{effectiveLimit.toLocaleString()}</strong>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progressPercent >= 100 ? 'bg-rose-500' : progressPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3 Metric Columns */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[10px] text-slate-400 block font-medium">Daily Pace</span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 block mt-0.5 font-mono">
            ৳{dailyPace.toLocaleString()} / day
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-50">
          <span className="text-[10px] text-slate-400 block font-medium">Est. Month End</span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 block mt-0.5 font-mono">
            ৳{estimatedMonthEnd.toLocaleString()}
          </span>
        </div>

        <div className={`p-2 rounded-xl ${isExceeding ? 'bg-rose-50' : 'bg-emerald-50'}`}>
          <span className="text-[10px] block font-medium text-slate-400">
            {isExceeding ? 'Est. Deficit' : 'Est. Surplus'}
          </span>
          <span className={`text-xs sm:text-sm font-extrabold block mt-0.5 font-mono ${
            isExceeding ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {isExceeding ? '-' : '+'} ৳{Math.abs(estimatedDeficit).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Warning or On-Track Banner */}
      {effectiveLimit > 0 && isExceeding ? (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>
            Warning: You are forecasted to exceed budget by ৳{Math.abs(estimatedDeficit).toLocaleString()} at this pace.
          </span>
        </div>
      ) : effectiveLimit > 0 ? (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            On Track: At this daily pace, your spending remains well within your monthly allocation.
          </span>
        </div>
      ) : null}
    </div>
  );
};
