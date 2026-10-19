import React, { useState, useEffect } from 'react';
import { X, Wallet, Target, CreditCard } from 'lucide-react';
import { NewTransactionPayload } from '../types/finance';

export type ActionModalType = 'income' | 'budget' | 'expense' | null;

interface FinanceActionModalProps {
  type: ActionModalType;
  onClose: () => void;
  onSaveExpense: (tx: NewTransactionPayload) => void;
  onSaveIncome: (amount: number) => void;
  onSaveBudget: (category: string, limit: number) => void;
  availableCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Bills & Utilities',
  'Shopping',
  'Health',
  'Entertainment',
  'Groceries',
  'Others',
];

export const FinanceActionModal: React.FC<FinanceActionModalProps> = ({
  type,
  onClose,
  onSaveExpense,
  onSaveIncome,
  onSaveBudget,
  availableCategories,
}) => {
  const categories = availableCategories && availableCategories.length > 0
    ? availableCategories
    : DEFAULT_CATEGORIES;

  // Income State
  const [income, setIncome] = useState<number | string>('');

  // Budget State
  const [budgetCategory, setBudgetCategory] = useState<string>(categories[0] || 'Food');
  const [budgetLimit, setBudgetLimit] = useState<number | string>('');

  // Expense State
  const [merchant, setMerchant] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>(categories[0] || 'Food');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (categories.length > 0) {
      setBudgetCategory(categories[0]);
      setExpenseCategory(categories[0]);
    }
  }, [availableCategories]);

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'income') {
      const val = parseFloat(String(income));
      if (!isNaN(val) && val >= 0) {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-[#E5484D]">
              {type === 'income' && <Wallet className="h-5 w-5" />}
              {type === 'budget' && <Target className="h-5 w-5" />}
              {type === 'expense' && <CreditCard className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {type === 'income' && 'Set Monthly Income'}
                {type === 'budget' && 'Set Category Budget'}
                {type === 'expense' && 'Add Transaction'}
              </h3>
              <p className="text-xs text-slate-400">
                {type === 'income' && 'Update total monthly earnings (BDT)'}
                {type === 'budget' && 'Set spending limits to monitor overspending'}
                {type === 'expense' && 'Record an expense or payment'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {type === 'income' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Monthly Income (৳ BDT)</label>
              <input
                type="number"
                step="0.01"
                required
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 60000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-medium"
              />
            </div>
          )}

          {type === 'budget' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Select Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-semibold cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Monthly Limit (৳ BDT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-medium"
                />
              </div>
            </>
          )}

          {type === 'expense' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Merchant / Expense Title</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Kacchi Bhai, Fuel, Daraz"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-semibold cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Amount (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 850"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-medium"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#E5484D] hover:bg-[#D63A3F] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              Confirm & Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};