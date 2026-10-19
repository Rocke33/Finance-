import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  ArrowLeftRight,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Banknote,
  Globe,
} from 'lucide-react';
import { WalletsState } from '../types/finance';
import { setWalletBalanceApi, transferWalletFundsApi } from '../services/api';

interface WalletsCarouselProps {
  wallets: WalletsState | null;
  onWalletsUpdated: (newWallets?: WalletsState) => void;
  totalBalance?: number;
}

export const WalletsCarousel: React.FC<WalletsCarouselProps> = ({
  wallets,
  onWalletsUpdated,
}) => {
  // Modal states
  const [editingWallet, setEditingWallet] = useState<'cash' | 'online' | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [isSavingBalance, setIsSavingBalance] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [transferSource, setTransferSource] = useState<'cash' | 'online'>('cash');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const cashBal = wallets ? wallets.cash_balance : 0;
  const onlineBal = wallets ? wallets.online_balance : 0;
  const totalBal = wallets ? wallets.total_balance : cashBal + onlineBal;

  const formatBDT = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Open Set Balance Modal
  const handleOpenEdit = (type: 'cash' | 'online') => {
    setEditingWallet(type);
    setBalanceInput(String(type === 'cash' ? cashBal : onlineBal));
    setBalanceError(null);
  };

  const handleCloseEdit = () => {
    if (isSavingBalance) return;
    setEditingWallet(null);
    setBalanceInput('');
    setBalanceError(null);
  };

  // Save Balance
  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;

    const val = parseFloat(balanceInput);
    if (isNaN(val) || val < 0) {
      setBalanceError('Please enter a valid amount (৳ 0.00 or higher). Negative balances are not allowed.');
      return;
    }

    setIsSavingBalance(true);
    setBalanceError(null);

    try {
      const updated = await setWalletBalanceApi(editingWallet, val);
      onWalletsUpdated(updated);
      handleCloseEdit();
    } catch (err: any) {
      setBalanceError(err.message || 'Failed to update wallet balance. Please try again.');
    } finally {
      setIsSavingBalance(false);
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (defaultSource: 'cash' | 'online' = 'cash') => {
    setTransferSource(defaultSource);
    setTransferAmount('');
    setTransferError(null);
    setIsTransferOpen(true);
  };

  const handleCloseTransfer = () => {
    if (isTransferring) return;
    setIsTransferOpen(false);
    setTransferAmount('');
    setTransferError(null);
  };

  // Submit Transfer
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const destination = transferSource === 'cash' ? 'online' : 'cash';
    const amountVal = parseFloat(transferAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      setTransferError('Please enter a transfer amount greater than ৳ 0.00.');
      return;
    }

    const available = transferSource === 'cash' ? cashBal : onlineBal;
    if (amountVal > available) {
      setTransferError(
        `Insufficient funds in ${transferSource.toUpperCase()} wallet. Available: ${formatBDT(available)}, required: ${formatBDT(amountVal)}.`
      );
      return;
    }

    setIsTransferring(true);
    setTransferError(null);

    try {
      const updated = await transferWalletFundsApi(transferSource, destination, amountVal);
      onWalletsUpdated(updated);
      handleCloseTransfer();
    } catch (err: any) {
      setTransferError(err.message || 'Failed to complete transfer.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>My Wallets</span>
            <span className="text-[11px] font-semibold text-slate-400">
              (Total: {formatBDT(totalBal)})
            </span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Fixed Cash and Digital Payment accounts
          </p>
        </div>

        {/* Transfer Funds Trigger Button */}
        <button
          type="button"
          onClick={() => handleOpenTransfer('cash')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          title="Transfer between Cash and Online wallets"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-slate-600" />
          <span>Transfer Funds</span>
        </button>
      </div>

      {/* Exactly Two Fixed Wallet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. CASH WALLET CARD */}
        <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200/60">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Cash</span>
                <span className="text-[10px] font-medium text-slate-400 block">
                  Physical Cash in Hand
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenEdit('cash')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 rounded-lg transition-colors cursor-pointer"
              title="Set Cash Balance"
            >
              <Edit3 className="h-3 w-3" />
              <span>Set Cash Balance</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Available Balance</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
              {formatBDT(cashBal)}
            </span>
          </div>
        </div>

        {/* 2. ONLINE WALLET CARD */}
        <div className="bg-white rounded-3xl border border-indigo-100 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-200/60">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Online</span>
                <span className="text-[10px] font-medium text-slate-400 block">
                  bKash, Nagad & Digital Bank
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenEdit('online')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-lg transition-colors cursor-pointer"
              title="Set Online Balance"
            >
              <Edit3 className="h-3 w-3" />
              <span>Set Online Balance</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Available Balance</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-indigo-700">
              {formatBDT(onlineBal)}
            </span>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: SET WALLET BALANCE MODAL --- */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2.5 rounded-2xl ${
                    editingWallet === 'cash'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {editingWallet === 'cash' ? (
                    <Banknote className="h-5 w-5" />
                  ) : (
                    <Smartphone className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Set {editingWallet === 'cash' ? 'Cash' : 'Online'} Balance
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Enter the current money held in this wallet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSavingBalance}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="mt-4 space-y-4 text-xs">
              {balanceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{balanceError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Amount in {editingWallet === 'cash' ? 'Cash' : 'Online'} (৳ BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Legitimate zero balance (৳0) is allowed. Negative amounts are rejected.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSavingBalance}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBalance}
                  className="px-5 py-2 bg-[#E5484D] hover:bg-[#D63A3F] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingBalance && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: TRANSFER BETWEEN CASH AND ONLINE --- */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Wallet Fund Transfer</h3>
                  <p className="text-[11px] text-slate-400">
                    Move funds instantly between Cash and Online without altering expenses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTransfer}
                disabled={isTransferring}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="mt-4 space-y-4 text-xs">
              {transferError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Direction Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Transfer Direction</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTransferSource('cash')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      transferSource === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs">Cash → Online</span>
                      <Banknote className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Deposit Cash into bKash/Bank
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 mt-1 block">
                      Avail: {formatBDT(cashBal)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferSource('online')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      transferSource === 'online'
                        ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-xs">Online → Cash</span>
                      <Smartphone className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Withdraw bKash/Bank to Cash
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 mt-1 block">
                      Avail: {formatBDT(onlineBal)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Amount (৳ BDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>Max Available:</span>
                  <button
                    type="button"
                    onClick={() => setTransferAmount(String(transferSource === 'cash' ? cashBal : onlineBal))}
                    className="font-bold text-[#E5484D] hover:underline cursor-pointer"
                  >
                    Use Full {transferSource.toUpperCase()} Balance ({formatBDT(transferSource === 'cash' ? cashBal : onlineBal)})
                  </button>
                </div>
              </div>

              {/* Notice that transfers don't affect expenses */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Accounting Note:</span> Wallet transfers only redistribute your existing funds between Cash and Online accounts. Total Balance ({formatBDT(totalBal)}) remains conserved and does not count as a new expense or income.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseTransfer}
                  disabled={isTransferring}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 bg-[#E5484D] hover:bg-[#D63A3F] disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isTransferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
