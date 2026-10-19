import React, { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { BudgetCategory } from '../types/finance';

interface MonthlySpendingPieChartProps {
  categories: BudgetCategory[];
}

const PALETTE = [
  '#E5484D', // Coral Red
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export const MonthlySpendingPieChart: React.FC<MonthlySpendingPieChartProps> = ({ categories }) => {
  const activeSlices = useMemo(() => {
    return categories
      .filter((cat) => Number(cat.spent) > 0)
      .map((cat, index) => ({
        name: cat.name,
        spent: Number(cat.spent),
        color: PALETTE[index % PALETTE.length],
      }))
      .sort((a, b) => b.spent - a.spent);
  }, [categories]);

  const totalSpent = useMemo(() => {
    return activeSlices.reduce((acc, curr) => acc + curr.spent, 0);
  }, [activeSlices]);

  // Donut Geometry
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slicesWithOffsets = activeSlices.map((slice) => {
    const percentage = totalSpent > 0 ? slice.spent / totalSpent : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += percentage * circumference;

    return {
      ...slice,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-50 text-[#E5484D]">
            <PieChartIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Category Breakdown</h3>
            <p className="text-[11px] text-slate-400">Spending distribution across categories</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Spent</span>
          <span className="text-sm font-extrabold text-slate-900 font-mono">৳{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      {totalSpent === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No expenses recorded for this month yet.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-1">
          {/* Donut Chart Visual */}
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="text-slate-100"
                strokeWidth="24"
                stroke="currentColor"
                fill="transparent"
              />
              {slicesWithOffsets.map((slice) => (
                <circle
                  key={slice.name}
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth="24"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              ))}
            </svg>
            <div className="absolute text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono block">
                ৳{totalSpent.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Category Ranked List (Matching Page 7 & 3 screenshots!) */}
          <div className="w-full sm:max-w-xs space-y-2.5">
            {slicesWithOffsets.map((slice) => (
              <div
                key={slice.name}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50/70 border border-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-semibold text-slate-800 truncate">{slice.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-900 font-mono">{slice.percentage}%</span>
                  <span className="text-xs font-bold text-slate-600 font-mono">৳{slice.spent.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};