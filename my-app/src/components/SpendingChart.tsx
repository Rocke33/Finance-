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
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#E5484D]" />
            Budget vs. Actual Spending
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Allocated limit vs. current expense pacing</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-500">Allocated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" />
            <span className="text-slate-800 font-bold">Spent</span>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No budget categories configured yet.
        </div>
      ) : (
        /* Chart Bars */
        <div className="space-y-3.5 pt-1">
          {categories.map((cat) => {
            const allocWidth = Math.min(Math.round((cat.allocated / maxVal) * 100), 100);
            const spentWidth = Math.min(Math.round((cat.spent / maxVal) * 100), 100);
            const isOver = cat.spent > cat.allocated;

            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{cat.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    <strong className={isOver ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
                      ৳{cat.spent.toLocaleString()}
                    </strong>
                    {' '}of ৳{cat.allocated.toLocaleString()}
                  </span>
                </div>

                {/* Dual Bar Representation */}
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden flex flex-col justify-center">
                  {/* Allocated Bar Background */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-slate-200 rounded-full"
                    style={{ width: `${allocWidth}%` }}
                  />
                  {/* Spent Bar Foreground */}
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : 'bg-[#E5484D]'
                    }`}
                    style={{ width: `${spentWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>৳0</span>
        <span>৳{Math.round(maxVal / 2).toLocaleString()}</span>
        <span>৳{maxVal.toLocaleString()}</span>
      </div>
    </div>
  );
};
