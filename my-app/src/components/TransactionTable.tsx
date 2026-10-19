import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { Search, Filter, Receipt, Calendar, Tag, ArrowUpRight, PlusCircle, Inbox } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onOpenUpload: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onOpenUpload,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Food', 'Groceries', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Others'];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCat = selectedCategory === 'All' || tx.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'groceries':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'transport':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'utilities':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'entertainment':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'shopping':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header with Title and Search/Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredTransactions.length} of {transactions.length} total entries shown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Upload Button */}
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Receipt</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No transactions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedCategory !== 'All'
              ? 'No transactions matched your current search or category filter.'
              : 'You have not recorded any expenses yet. Scan a receipt or add your first transaction.'}
          </p>
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Scan Your First Receipt</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Paid From</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-medium">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {tx.merchant}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeColor(tx.category)}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {tx.payment_source ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.payment_source === 'cash'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {tx.payment_source === 'cash' ? '💵 Cash' : '💳 Online'}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ৳{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {tx.receipt_url ? (
                        <a
                          href={tx.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-medium"
                        >
                          View <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Visible only on mobile < 640px) */}
          <div className="sm:hidden space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-slate-900">{tx.merchant}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {tx.date}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryBadgeColor(tx.category)}`}>
                      {tx.category}
                    </span>
                    {tx.payment_source && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          tx.payment_source === 'cash'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {tx.payment_source === 'cash' ? '💵 Cash' : '💳 Online'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">
                    ৳{Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {tx.receipt_url && (
                    <div className="mt-0.5">
                      <a
                        href={tx.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 hover:underline"
                      >
                        Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
