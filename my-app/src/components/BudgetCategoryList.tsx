import React from 'react';
import { BudgetCategory } from '../types/finance';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetCategoryListProps {
  categories: BudgetCategory[];
}

export const BudgetCategoryList: React.FC<BudgetCategoryListProps> = ({ categories }) => {
  const getStatusBadge = (status: BudgetCategory['status']) => {
    switch (status) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" />
            Exceeded
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Near Limit
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            On Track
          </span>
        );
    }
  };

  const getProgressBarColor = (status: BudgetCategory['status']) => {
    switch (status) {
      case 'danger':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      case 'normal':
      default:
        return 'bg-indigo-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Budget Allocations</h3>
          <p className="text-xs text-slate-500 mt-0.5">Category spending limits & pacing</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {categories.length} Categories
        </span>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const percent = cat.allocated > 0 ? Math.min(Math.round((cat.spent / cat.allocated) * 100), 100) : 100;
          const isOver = cat.spent > cat.allocated;

          return (
            <div key={cat.name} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">{cat.name}</span>
                  {getStatusBadge(cat.status)}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">
                    ৳{cat.spent.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    {' '}/ ৳{cat.allocated.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(cat.status)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-1.5 flex justify-between items-center text-[11px] text-slate-500">
                <span>{percent}% spent</span>
                <span>
                  {isOver
                    ? `Over by ৳${(cat.spent - cat.allocated).toLocaleString()}`
                    : `Remaining: ৳${(cat.allocated - cat.spent).toLocaleString()}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
