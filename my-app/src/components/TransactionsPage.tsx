import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Receipt,
  Trash2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  Tag,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Transaction, BudgetSummary } from '../types/finance';

interface TransactionsPageProps {
  transactions: Transaction[];
  summary: BudgetSummary;
  onOpenUpload: () => void;
  onOpenAddExpense: () => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  summary,
  onOpenUpload,
  onOpenAddExpense,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Income categories to classify type
  const incomeCategoryNames = new Set([
    'salary',
    'business',
    'freelance',
    'investment',
    'allowance',
    'gift',
    'other income',
    'transfer',
  ]);

  const isIncomeTransaction = (tx: Transaction) => {
    return (
      incomeCategoryNames.has(tx.category.toLowerCase()) ||
      tx.merchant.toLowerCase().includes('salary') ||
      tx.merchant.toLowerCase().includes('deposit') ||
      tx.merchant.toLowerCase().includes('income')
    );
  };

  // Extract unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => set.add(tx.category));
    return ['All', ...Array.from(set)];
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((tx) => {
      // Type Filter
      const isInc = isIncomeTransaction(tx);
      if (selectedType === 'income' && !isInc) return false;
      if (selectedType === 'expense' && isInc) return false;

      // Category Filter
      if (selectedCategory !== 'All' && tx.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMerchant = tx.merchant.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        if (!matchesMerchant && !matchesCat) return false;
      }

      // Time Range Filter
      if (timeRange === 'week') {
        const txDate = new Date(tx.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (timeRange === 'month') {
        const txDate = new Date(tx.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      return true;
    });
  }, [transactions, selectedType, selectedCategory, searchQuery, timeRange]);

  // Financial Summary Strip calculations
  const totalIncomeCalculated = useMemo(() => {
    return summary.monthly_income;
  }, [summary.monthly_income]);

  const totalSpentCalculated = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      if (!isIncomeTransaction(tx)) {
        return acc + Number(tx.amount || 0);
      }
      return acc;
    }, 0);
  }, [filteredTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('cigar')) return { bg: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' };
    if (cat.includes('petrol') || cat.includes('transport') || cat.includes('fuel')) return { bg: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' };
    if (cat.includes('bill') || cat.includes('util')) return { bg: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' };
    if (cat.includes('shop')) return { bg: 'bg-pink-100 text-pink-600', dot: 'bg-pink-500' };
    if (cat.includes('salary') || cat.includes('transfer')) return { bg: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' };
    return { bg: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Time Filter Dropdown */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 cursor-pointer"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-slate-500" />
            <span>Scan Receipt</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E5484D] hover:bg-[#D63A3F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Type Filter Pills: [ All Types ] [ Income ] [ Expense ] */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200/80 w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === 'all'
              ? 'bg-[#E5484D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Types
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('income')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === 'income'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('expense')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === 'expense'
              ? 'bg-[#E5484D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Expense
        </button>
      </div>

      {/* Summary Banner Strip (Matching Page 4 screenshot!) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Income
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-600 block mt-0.5">
              ৳ {totalIncomeCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Spent
            </span>
            <span className="text-base sm:text-lg font-extrabold text-[#E5484D] block mt-0.5">
              ৳ {totalSpentCalculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#E5484D] flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search transactions by merchant, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C] transition-colors"
        />
      </div>

      {/* Transaction Records List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No transactions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || selectedCategory !== 'All'
              ? 'No records matched your search query or selected filters.'
              : 'You have not recorded any financial transactions yet.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenUpload}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs cursor-pointer transition-colors"
            >
              Scan Receipt
            </button>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-4 py-2 bg-[#E5484D] hover:bg-[#D63A3F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Add First Transaction
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isInc = isIncomeTransaction(tx);
            const style = getCategoryColor(tx.category);

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left: Category Icon + Merchant & Subtitle */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${style.bg}`}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate block">
                      {tx.merchant}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-medium truncate">{tx.category}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-extrabold font-mono block ${
                        isInc ? 'text-emerald-600' : 'text-[#E5484D]'
                      }`}
                    >
                      {isInc ? '+' : '-'} ৳{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {tx.receipt_url && (
                      <a
                        href={tx.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline flex items-center justify-end gap-0.5 mt-0.5"
                      >
                        Receipt <ArrowUpRight className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Delete Action Button */}
                  <button
                    type="button"
                    disabled={deletingId === tx.id}
                    onClick={() => handleDelete(tx.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete transaction"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
