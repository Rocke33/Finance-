import React from 'react';
import { AIInsight } from '../types/finance';
import { AlertCircle, AlertTriangle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface AIInsightsCardProps {
  insights: AIInsight[];
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights }) => {
  const getInsightTheme = (type: AIInsight['type']) => {
    switch (type) {
      case 'alert':
        return {
          icon: AlertCircle,
          borderColor: 'border-rose-200',
          bgColor: 'bg-rose-50/60',
          badgeBg: 'bg-rose-100 text-rose-800',
          badgeLabel: 'Urgent Alert',
          actionColor: 'text-rose-900 bg-rose-100/70 border-rose-200',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50/60',
          badgeBg: 'bg-amber-100 text-amber-800',
          badgeLabel: 'Spending Warning',
          actionColor: 'text-amber-900 bg-amber-100/70 border-amber-200',
        };
      case 'suggestion':
      default:
        return {
          icon: Sparkles,
          borderColor: 'border-indigo-200',
          bgColor: 'bg-indigo-50/60',
          badgeBg: 'bg-indigo-100 text-indigo-800',
          badgeLabel: 'Saving Tip',
          actionColor: 'text-indigo-900 bg-indigo-100/70 border-indigo-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Financial Insights</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated spending analysis & recommendations</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="h-3 w-3" />
          Live Model
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const theme = getInsightTheme(insight.type);
          const Icon = theme.icon;

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border ${theme.borderColor} ${theme.bgColor} transition-all`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
                  {theme.badgeLabel}
                </span>
                <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              </div>

              <p className="text-xs font-semibold text-slate-900 mb-2 leading-relaxed">
                {insight.message}
              </p>

              {/* Action Box */}
              <div className={`mt-2 flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-relaxed ${theme.actionColor}`}>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-80" />
                <span>
                  <strong className="font-semibold">Recommended Action:</strong> {insight.action}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
