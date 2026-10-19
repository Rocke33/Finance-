import React from 'react';
import { AIInsight } from '../types/finance';
import { AlertCircle, AlertTriangle, Sparkles, ArrowRight, ShieldCheck, Plus } from 'lucide-react';

interface AIInsightsCardProps {
  insights: AIInsight[];
  onOpenAddExpense?: () => void;
  onOpenSetBudget?: () => void;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  insights,
  onOpenAddExpense,
  onOpenSetBudget,
}) => {
  const getInsightTheme = (type: AIInsight['type']) => {
    switch (type) {
      case 'alert':
        return {
          icon: AlertCircle,
          borderColor: 'border-rose-200',
          bgColor: 'bg-rose-50/70',
          badgeBg: 'bg-rose-100 text-rose-800',
          badgeLabel: 'Urgent Alert',
          actionColor: 'text-rose-900 bg-rose-100/80 border-rose-200',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50/70',
          badgeBg: 'bg-amber-100 text-amber-800',
          badgeLabel: 'Pacing Warning',
          actionColor: 'text-amber-900 bg-amber-100/80 border-amber-200',
        };
      case 'suggestion':
      default:
        return {
          icon: Sparkles,
          borderColor: 'border-emerald-200',
          bgColor: 'bg-emerald-50/60',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          badgeLabel: 'Smart Recommendation',
          actionColor: 'text-emerald-900 bg-emerald-100/70 border-emerald-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#E5484D]/10 text-[#E5484D]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">AI Financial Insights</h3>
            <p className="text-[11px] text-slate-400">Automated spending analysis & recommendations</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          Active Model
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const theme = getInsightTheme(insight.type);
          const Icon = theme.icon;

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-2xl border ${theme.borderColor} ${theme.bgColor} transition-all`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                  {theme.badgeLabel}
                </span>
                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              </div>

              <p className="text-xs font-semibold text-slate-900 mb-2 leading-relaxed">
                {insight.message}
              </p>

              {/* Action Box */}
              <div className={`mt-2 flex items-start gap-2 p-2.5 rounded-xl border text-xs leading-relaxed ${theme.actionColor}`}>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-80" />
                <span>
                  <strong className="font-semibold">Action:</strong> {insight.action}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
