import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { Transaction } from '../types/finance';

interface DailySpendTrendChartProps {
  transactions: Transaction[];
}

export const DailySpendTrendChart: React.FC<DailySpendTrendChartProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Compute daily spending for the past 7 days (or 30 days)
  const chartData = useMemo(() => {
    const daysCount = viewMode === 'week' ? 7 : 30;
    const now = new Date();
    const result = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const sum = transactions.reduce((acc, tx) => {
        if (tx.date === dateStr) {
          return acc + Number(tx.amount || 0);
        }
        return acc;
      }, 0);

      result.push({
        dateStr,
        dayName,
        displayLabel: viewMode === 'week' ? dayName : d.getDate().toString(),
        amount: Math.round(sum * 100) / 100,
      });
    }

    return result;
  }, [transactions, viewMode]);

  const totalSpent = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.amount), 0);
    return max > 0 ? max * 1.15 : 1000;
  }, [chartData]);

  // Find Peak and Low
  const peakDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.amount - a.amount)[0];
  }, [chartData]);

  const lowDay = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => a.amount - b.amount)[0];
  }, [chartData]);

  // Generate SVG Path coordinates (width 400, height 120)
  const width = 400;
  const height = 120;
  const paddingX = 20;
  const paddingY = 15;

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(1, chartData.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (d.amount / maxVal) * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  const linePath = points.length > 0
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        // Simple cubic bezier smoothing
        const prev = points[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
      }, '')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Daily Spend Trend</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total: <strong className="text-slate-900 font-bold">৳{totalSpent.toLocaleString()}</strong>
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Empty State */}
      {totalSpent === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <Calendar className="h-6 w-6 mx-auto mb-2 text-slate-300" />
          No transactions recorded in this period.
        </div>
      ) : (
        <>
          {/* SVG Area & Curve Chart */}
          <div className="relative w-full h-36 mt-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5484D" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E5484D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area */}
              <path d={areaPath} fill="url(#spendGradient)" />

              {/* Curve Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#E5484D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className="fill-white stroke-[#E5484D] stroke-2 hover:r-5 transition-all cursor-pointer"
                >
                  <title>{`${p.dayName} (${p.dateStr}): ৳${p.amount}`}</title>
                </circle>
              ))}
            </svg>
          </div>

          {/* X-axis Day Labels */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 mt-2">
            {chartData.map((d, i) => (
              <span key={i} className="text-center font-medium">
                {d.displayLabel}
              </span>
            ))}
          </div>

          {/* Peak & Low Stats Underneath */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            {peakDay && (
              <div className="flex items-center gap-1.5 text-rose-600">
                <ArrowUp className="h-3.5 w-3.5" />
                <span>
                  Peak: {peakDay.dayName} (৳{peakDay.amount.toLocaleString()})
                </span>
              </div>
            )}
            {lowDay && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <ArrowDown className="h-3.5 w-3.5" />
                <span>
                  Low: {lowDay.dayName} (৳{lowDay.amount.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
