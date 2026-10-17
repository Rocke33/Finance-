import React from 'react';
import { BudgetCategory } from '../types/finance';
import { BarChart3 } from 'lucide-react';

interface SpendingChartProps {
  categories: BudgetCategory[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ categories }) => {
  const maxVal = Math.max(
    ...categories.map((c) => Math.max(c.allocated, c.spent)),
    1000
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            Budget vs. Actual Spending
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Comparison by category</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-300"></span>
            <span className="text-slate-600 font-medium">Allocated Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
            <span className="text-slate-600 font-medium">Actual Spent</span>
          </div>
        </div>
      </div>

      {/* Chart Bars */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const allocWidth = Math.min(Math.round((cat.allocated / maxVal) * 100), 100);
          const spentWidth = Math.min(Math.round((cat.spent / maxVal) * 100), 100);
          const isOver = cat.spent > cat.allocated;

          return (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{cat.name}</span>
                <span className="text-slate-500">
                  <strong className={isOver ? 'text-rose-600 font-bold' : 'text-slate-900 font-medium'}>
                    ৳{cat.spent.toLocaleString()}
                  </strong>
                  {' '}of ৳{cat.allocated.toLocaleString()}
                </span>
              </div>

              {/* Dual Bar Representation */}
              <div className="relative h-4 bg-slate-100 rounded-sm overflow-hidden flex flex-col justify-center">
                {/* Allocated Bar Background */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-slate-200 rounded-xs"
                  style={{ width: `${allocWidth}%` }}
                />
                {/* Spent Bar Foreground */}
                <div
                  className={`absolute top-0.5 bottom-0.5 left-0 rounded-xs transition-all duration-500 ${
                    isOver ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${spentWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>0</span>
        <span>৳{(maxVal / 2).toLocaleString()}</span>
        <span>৳{maxVal.toLocaleString()}</span>
      </div>
    </div>
  );
};
