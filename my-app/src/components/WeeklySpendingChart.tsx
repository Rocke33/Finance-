import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Transaction } from '../types/finance';

interface WeeklySpendingChartProps {
  transactions?: Transaction[];
}

interface WeekData {
  label: string;
  startDateStr: string;
  endDateStr: string;
  total: number;
}

export const WeeklySpendingChart: React.FC<WeeklySpendingChartProps> = ({ transactions = [] }) => {
  // Compute spending grouped by the last 4 rolling 7-day intervals
  const weeksData = useMemo(() => {
    const now = new Date();
    // Normalize to end of current day
    now.setHours(23, 59, 59, 999);

    const weeks: WeekData[] = [];
    const txList = transactions || [];

    for (let i = 3; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);

      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const label = i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i}w ago`;
      const dateRangeStr = `${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      // Calculate sum of transactions within this 7-day window
      const total = txList.reduce((sum, tx) => {
        const txDate = new Date(tx.date);
        if (txDate >= start && txDate <= end) {
          return sum + Number(tx.amount || 0);
        }
        return sum;
      }, 0);

      weeks.push({
        label,
        startDateStr: dateRangeStr,
        endDateStr: dateRangeStr,
        total: Math.round(total * 100) / 100,
      });
    }

    return weeks;
  }, [transactions]);

  const maxSpending = useMemo(() => {
    const highest = Math.max(...weeksData.map((w) => w.total), 0);
    return highest > 0 ? highest * 1.15 : 1000;
  }, [weeksData]);

  const totalLast4Weeks = useMemo(() => {
    return weeksData.reduce((acc, curr) => acc + curr.total, 0);
  }, [weeksData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Weekly Spending</h3>
            <p className="text-xs text-slate-500">Total expenditure over the last 4 weeks</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">4-Week Total</span>
          <span className="text-sm font-bold text-slate-900">৳{totalLast4Weeks.toLocaleString()}</span>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="grid grid-cols-4 gap-3 sm:gap-6 items-end h-48 pt-6 pb-2">
        {weeksData.map((week, idx) => {
          const heightPercent = maxSpending > 0 ? Math.min(100, (week.total / maxSpending) * 100) : 0;
          const isCurrentWeek = idx === weeksData.length - 1;

          return (
            <div key={week.label} className="flex flex-col items-center h-full justify-end group">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-center pointer-events-none">
                <span className="text-[11px] font-bold text-slate-800 block">৳{week.total.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 block">{week.startDateStr}</span>
              </div>

              {/* Bar */}
              <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg flex flex-col justify-end overflow-hidden h-32 relative">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                    isCurrentWeek ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-indigo-300 group-hover:bg-indigo-400'
                  }`}
                />
              </div>

              {/* X-axis Labels */}
              <div className="mt-2 text-center">
                <span
                  className={`text-xs block font-semibold truncate ${
                    isCurrentWeek ? 'text-indigo-600' : 'text-slate-600'
                  }`}
                >
                  {week.label}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">৳{week.total.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default WeeklySpendingChart;