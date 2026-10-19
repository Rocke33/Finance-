import React, { useState } from 'react';
import { Wallet, Smartphone, Building2, Plus, Edit2, X } from 'lucide-react';
import { WalletItem } from '../types/finance';

interface WalletsCarouselProps {
  totalBalance: number;
}

export const WalletsCarousel: React.FC<WalletsCarouselProps> = ({ totalBalance }) => {
  const [wallets, setWallets] = useState<WalletItem[]>([
    {
      id: 'w_cash',
      name: 'Cash',
      type: 'cash',
      balance: Math.round(totalBalance * 0.48 * 100) / 100,
      color: '#10B981',
    },
    {
      id: 'w_bkash',
      name: 'bKash MFS',
      type: 'mfs',
      balance: Math.round(totalBalance * 0.52 * 100) / 100,
      color: '#E11D48',
      fee: 1.85,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'cash' | 'mfs' | 'bank'>('bank');
  const [newWalletBal, setNewWalletBal] = useState('');

  const getWalletIcon = (type: WalletItem['type']) => {
    switch (type) {
      case 'mfs':
        return Smartphone;
      case 'bank':
        return Building2;
      case 'cash':
      default:
        return Wallet;
    }
  };

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    const newW: WalletItem = {
      id: `w_${Date.now()}`,
      name: newWalletName.trim(),
      type: newWalletType,
      balance: parseFloat(newWalletBal) || 0,
      color: newWalletType === 'bank' ? '#3B82F6' : '#10B981',
    };

    setWallets([...wallets, newW]);
    setNewWalletName('');
    setNewWalletBal('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">My Wallets</h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-semibold text-[#E5484D] hover:text-[#D63A3F] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Wallet</span>
        </button>
      </div>

      {/* Add Wallet Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddWallet} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">Add New Wallet</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="e.g. Brac Bank, Nagad"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-xs"
            />
            <select
              value={newWalletType}
              onChange={(e) => setNewWalletType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-xs font-medium"
            >
              <option value="cash">Cash</option>
              <option value="mfs">MFS (bKash/Nagad)</option>
              <option value="bank">Bank Account</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Opening Balance (৳)"
              value={newWalletBal}
              onChange={(e) => setNewWalletBal(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#E5484D] hover:bg-[#D63A3F] text-white font-bold rounded-lg shadow-xs"
            >
              Save Wallet
            </button>
          </div>
        </form>
      )}

      {/* Wallets Row */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {wallets.map((wallet) => {
          const Icon = getWalletIcon(wallet.type);
          return (
            <div
              key={wallet.id}
              className="min-w-[190px] sm:min-w-[210px] flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-sm transition-all flex items-center gap-3.5"
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${wallet.color || '#10B981'}15`, color: wallet.color || '#10B981' }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {wallet.name}
                  </span>
                  {wallet.fee && (
                    <span className="text-[10px] text-slate-400 font-medium ml-1">
                      {wallet.fee}%
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
                  Balance: <strong className="text-slate-800">৳{Number(wallet.balance).toLocaleString()}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
