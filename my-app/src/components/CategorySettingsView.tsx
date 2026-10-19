import React, { useState } from 'react';
import {
  Tag,
  Plus,
  X,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Briefcase,
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Film,
  ShoppingCart,
  TrendingUp,
  Laptop,
  PieChart,
  Wallet,
  Gift,
  PlusCircle,
  ShieldCheck,
  PiggyBank,
  Vault,
} from 'lucide-react';
import { CategoryItem, CategoryType } from '../types/finance';

interface CategorySettingsViewProps {
  categories: CategoryItem[];
  onAddCategory: (name: string, type: CategoryType, color: string, icon: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const COLOR_SWATCHES = [
  '#E5484D', // Coral Red (Primary BeHisabi)
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

const ICONS = ['Tag', 'Utensils', 'Car', 'Receipt', 'ShoppingBag', 'HeartPulse', 'Film', 'ShoppingCart', 'Briefcase', 'Wallet', 'PiggyBank'];

export const CategorySettingsView: React.FC<CategorySettingsViewProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setFeedback(null);
    try {
      await onAddCategory(name.trim(), type, selectedColor, selectedIcon);
      setName('');
      setFeedback(`Category "${name.trim()}" added successfully!`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await onDeleteCategory(cat.id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const savingsCategories = categories.filter((c) => c.type === 'savings');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Category Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Create, customize, and manage personal spending and income categories
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Create New Category Card (Matching Page 5 screenshot!) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-[#E5484D]" />
          Create New Category
        </h3>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Name & Type Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Grocery, Rent, Fitness, Course..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Category Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
                <option value="savings">Savings Category</option>
              </select>
            </div>
          </div>

          {/* Choose Category Color Swatches */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Choose Category Color</label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setSelectedColor(hex)}
                  style={{ backgroundColor: hex }}
                  className={`h-8 w-8 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                    selectedColor === hex ? 'scale-115 ring-3 ring-slate-800/20 shadow-xs' : 'hover:scale-105'
                  }`}
                  title={hex}
                >
                  {selectedColor === hex && <Check className="h-4 w-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#E5484D] hover:bg-[#D63A3F] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'Adding...' : '+ Add Category'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories Displays by Type */}
      <div className="space-y-5">
        {/* 1. Expense Categories */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Expense Categories ({expenseCategories.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-xs font-semibold text-slate-800 group"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="ml-1 text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                  title={`Delete ${cat.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Income Categories */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Income Categories ({incomeCategories.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {incomeCategories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-xs font-semibold text-slate-800 group"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="ml-1 text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                  title={`Delete ${cat.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Savings Categories */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Savings Categories ({savingsCategories.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {savingsCategories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-xs font-semibold text-slate-800 group"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="ml-1 text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                  title={`Delete ${cat.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
