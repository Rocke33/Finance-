import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
import { loginApi, registerApi, UserProfile } from '../services/api';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile, token: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [income, setIncome] = useState<number | string>('60000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerApi(name.trim(), email.trim(), password, Number(income) || 0);
        onAuthSuccess(res.user, res.access_token);
      } else {
        const res = await loginApi(email.trim(), password);
        onAuthSuccess(res.user, res.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 relative">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0F382C] to-[#1A5C4A] text-white shadow-md mb-3">
            <span className="text-3xl" role="img" aria-label="AIFinance">🐝</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
             AI<span className="text-[#E5484D]">Finance</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
            Expense & Budget
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {isRegister
              ? 'Create your private financial account with AI assistance'
              : 'Sign in to access your personal dashboard and spending insights'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
            <span className="shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Takbir A. Himu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C] text-sm text-slate-800 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C] text-sm text-slate-800 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C] text-sm text-slate-800 transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Initial Monthly Income (BDT / ৳)</label>
              <div className="relative">
                <Wallet className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="60000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F382C]/20 focus:border-[#0F382C] text-sm text-slate-800 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-[#E5484D] hover:bg-[#D63A3F] active:bg-[#B92F34] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer transition-colors"
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one"}
          </button>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Strict per-user data isolation & encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};