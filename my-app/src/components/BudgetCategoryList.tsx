import React from 'react';
import { BudgetCategory } from '../types/finance';
import { AlertCircle, AlertTriangle, CheckCircle2, Plus, Target } from 'lucide-react';

interface BudgetCategoryListProps {
  categories: BudgetCategory[];
  onOpenSetBudget?: () => void;
}

export const BudgetCategoryList: React.FC<BudgetCategoryListProps> = ({
  categories,
  onOpenSetBudget,
}) => {
  const getStatusBadge = (status: BudgetCategory['status']) => {
    switch (status) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" />
            Exceeded
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Near Limit
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#E5484D]" />
            Category Budgets
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Category limits and real-time pacing</p>
        </div>
        {onOpenSetBudget && (
          <button
            type="button"
            onClick={onOpenSetBudget}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-[#E5484D] border border-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Set Budget</span>
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No category budgets configured yet. Click "Set Limit" to define your first budget.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const percent = cat.allocated > 0 ? Math.min(Math.round((cat.spent / cat.allocated) * 100), 100) : 100;
            const isOver = cat.spent > cat.allocated;

            return (
              <div
                key={cat.name}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{cat.name}</span>
                    {getStatusBadge(cat.status)}
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-extrabold text-slate-900">
                      ৳{Number(cat.spent).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {' '}/ ৳{Number(cat.allocated).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(cat.status)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-1.5 flex justify-between items-center text-[11px] text-slate-500">
                  <span className="font-medium">{percent}% spent</span>
                  <span className="font-semibold">
                    {isOver
                      ? `Over by ৳${Math.abs(cat.spent - cat.allocated).toLocaleString()}`
                      : `Remaining: ৳${Math.max(0, cat.allocated - cat.spent).toLocaleString()}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
