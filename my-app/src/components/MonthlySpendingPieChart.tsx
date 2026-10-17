import React, { useMemo } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { BudgetCategory } from '../types/finance';

interface MonthlySpendingPieChartProps {
  categories: BudgetCategory[];
}

const PALETTE = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const MonthlySpendingPieChart: React.FC<MonthlySpendingPieChartProps> = ({ categories }) => {
  // Filter categories that have actual spending
  const activeSlices = useMemo(() => {
    return categories
      .filter((cat) => Number(cat.spent) > 0)
      .map((cat, index) => ({
        name: cat.name,
        spent: Number(cat.spent),
        color: PALETTE[index % PALETTE.length],
      }));
  }, [categories]);

  const totalSpent = useMemo(() => {
    return activeSlices.reduce((acc, curr) => acc + curr.spent, 0);
  }, [activeSlices]);

  // SVG Donut calculation
  const radius = 70;
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Spending Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of expenditures by category</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">Total Spent</span>
          <span className="text-sm font-bold text-slate-900">৳{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      {totalSpent === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No expenses recorded for this month yet.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-around gap-6">
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
                  className="transition-all duration-500 ease-out"
                />
              ))}
            </svg>
            <div className="absolute text-center">
              <span className="text-[11px] text-slate-400 font-medium block">Total</span>
              <span className="text-xs font-bold text-slate-800">৳{totalSpent.toLocaleString()}</span>
            </div>
          </div>

          {/* Category Legends */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full max-w-sm">
            {slicesWithOffsets.map((slice) => (
              <div key={slice.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-600 truncate">{slice.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-semibold text-slate-900">{slice.percentage}%</span>
                  <span className="text-[10px] text-slate-400 block">৳{slice.spent.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};