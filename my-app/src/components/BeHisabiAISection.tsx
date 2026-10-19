import React from 'react';
import { Bot, FileText, Target, Sparkles, ChevronRight } from 'lucide-react';

interface BeHisabiAISectionProps {
  onOpenAdvisor: () => void;
  onOpenReceiptScan: () => void;
  onOpenSmartBudget: () => void;
}

export const BeHisabiAISection: React.FC<BeHisabiAISectionProps> = ({
  onOpenAdvisor,
  onOpenReceiptScan,
  onOpenSmartBudget,
}) => {
  const aiFeatures = [
    {
      id: 'advisor',
      title: 'Advisor',
      desc: 'AI Financial Chat',
      icon: Bot,
      color: 'bg-rose-50 text-[#E5484D] border-rose-100',
      action: onOpenAdvisor,
    },
    {
      id: 'receipt',
      title: 'SMS & Memo',
      desc: 'Scan Receipts with AI',
      icon: FileText,
      color: 'bg-orange-50 text-orange-600 border-orange-100',
      action: onOpenReceiptScan,
    },
    {
      id: 'budget',
      title: 'Smart Budget',
      desc: 'AI Pacing & Limits',
      icon: Target,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      action: onOpenSmartBudget,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Finance AI</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5484D]/10 text-[#E5484D]">
            <Sparkles className="h-3 w-3" />
            Active
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Powered by Gemini AI
        </span>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {aiFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <button
              key={feat.id}
              type="button"
              onClick={feat.action}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 text-center flex flex-col items-center justify-center hover:shadow-md hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-2.5 border shadow-xs transition-transform group-hover:scale-110 ${feat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                {feat.title}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 block">
                {feat.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
