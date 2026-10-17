import React, { useState } from 'react';
import { X, Wallet, Target, CreditCard } from 'lucide-react';
import { NewTransactionPayload } from '../types/finance';

export type ActionModalType = 'income' | 'budget' | 'expense' | null;

interface FinanceActionModalProps {
  type: ActionModalType;
  onClose: () => void;
  onSaveExpense: (tx: NewTransactionPayload) => void;
  onSaveIncome: (amount: number) => void;
  onSaveBudget: (category: string, limit: number) => void;
}

const CATEGORIES = ['Food', 'Groceries', 'Transport', 'Utilities', 'Entertainment', 'Shopping'];

export const FinanceActionModal: React.FC<FinanceActionModalProps> = ({
  type,
  onClose,
  onSaveExpense,
  onSaveIncome,
  onSaveBudget,
}) => {
  // Income State
  const [income, setIncome] = useState<number | string>('');

  // Budget State
  const [budgetCategory, setBudgetCategory] = useState<string>(CATEGORIES[0]);
  const [budgetLimit, setBudgetLimit] = useState<number | string>('');

  // Expense State
  const [merchant, setMerchant] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>(CATEGORIES[0]);
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'income') {
      const val = parseFloat(String(income));
      if (!isNaN(val) && val > 0) {
        onSaveIncome(val);
        onClose();
      }
    } else if (type === 'budget') {
      const val = parseFloat(String(budgetLimit));
      if (!isNaN(val) && val >= 0) {
        onSaveBudget(budgetCategory, val);
        onClose();
      }
    } else if (type === 'expense') {
      const val = parseFloat(String(amount));
      if (!merchant.trim() || isNaN(val) || val <= 0) return;
      onSaveExpense({
        merchant: merchant.trim(),
        category: expenseCategory,
        amount: val,
        date: date,
        receipt_url: null,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              {type === 'income' && <Wallet className="h-5 w-5" />}
              {type === 'budget' && <Target className="h-5 w-5" />}
              {type === 'expense' && <CreditCard className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {type === 'income' && 'Set Monthly Income'}
                {type === 'budget' && 'Set Category Budget'}
                {type === 'expense' && 'Add New Expense'}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'income' && 'Update total monthly earnings'}
                {type === 'budget' && 'Allocate limit across 6 core categories'}
                {type === 'expense' && 'Manual transaction record entry'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {type === 'income' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Income (BDT)</label>
              <input
                type="number"
                step="0.01"
                required
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 60000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          )}

          {type === 'budget' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Limit (BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            </>
          )}

          {type === 'expense' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Merchant / Title</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Kacchi Bhai, Daraz, Pathao"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 850"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};