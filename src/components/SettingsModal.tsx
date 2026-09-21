import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AppSettings } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetPortfolio: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetPortfolio,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset your paper portfolio to $100,000 cash balance? This will close all open positions.')) {
      setResetting(true);
      try {
        await onResetPortfolio();
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1422] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        <div className="p-4 bg-[#090d14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-base font-bold text-white tracking-wide">
              TRADING DESK SETTINGS & RISK LIMITS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto font-mono text-xs">
          {/* Trading Mode Selector */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              OPERATIONAL TRADING MODE
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, tradingMode: 'PAPER' })}
                className={`p-2.5 rounded-lg text-center border font-bold transition-all cursor-pointer ${
                  form.tradingMode === 'PAPER'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <div>PAPER MODE</div>
                <div className="text-[9px] opacity-80 mt-0.5">Simulated Executions</div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, tradingMode: 'DEMO' })}
                className={`p-2.5 rounded-lg text-center border font-bold transition-all cursor-pointer ${
                  form.tradingMode === 'DEMO'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <div>DEMO MODE</div>
                <div className="text-[9px] opacity-80 mt-0.5">Testnet Adapter</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (form.liveModeConfirmed) {
                    setForm({ ...form, tradingMode: 'LIVE' });
                  } else {
                    alert('LIVE mode requires confirmation checkbox below acknowledging capital risks.');
                  }
                }}
                className={`p-2.5 rounded-lg text-center border font-bold transition-all cursor-pointer ${
                  form.tradingMode === 'LIVE'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> LIVE MODE
                </div>
                <div className="text-[9px] mt-0.5">Real Exchange API</div>
              </button>
            </div>

            {/* Live Mode Safety Guard */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
              <input
                type="checkbox"
                id="check-live-confirm"
                checked={form.liveModeConfirmed}
                onChange={(e) => setForm({ ...form, liveModeConfirmed: e.target.checked })}
                className="mt-0.5 accent-rose-500"
              />
              <label htmlFor="check-live-confirm">
                I understand live trading uses real capital and involves financial risk. Keep unchecked for safe demo & paper operations.
              </label>
            </div>
          </div>

          {/* Deterministic Risk Limits Form */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              DETERMINISTIC RISK LIMITS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">MAX CONCURRENT OPEN POSITIONS (HARD CAP)</label>
                <div className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold flex items-center justify-between text-xs">
                  <span>5 POSITIONS</span>
                  <span className="text-[10px] text-emerald-400 font-normal">UNLIMITED DAILY TRADES</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400">MAX RISK PER TRADE ({form.maxRiskPerTradePercent}%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  value={form.maxRiskPerTradePercent}
                  onChange={(e) => setForm({ ...form, maxRiskPerTradePercent: parseFloat(e.target.value) || 2.0 })}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">DAILY LOSS LIMIT ({form.dailyLossLimitPercent}%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="8.0"
                  value={form.dailyLossLimitPercent}
                  onChange={(e) => setForm({ ...form, dailyLossLimitPercent: parseFloat(e.target.value) || 4.0 })}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">MAX DRAWDOWN LIMIT ({form.maxDrawdownLimitPercent}%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5.0"
                  max="15.0"
                  value={form.maxDrawdownLimitPercent}
                  onChange={(e) => setForm({ ...form, maxDrawdownLimitPercent: parseFloat(e.target.value) || 10.0 })}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">MINIMUM R:R ({form.minRiskReward}:1)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.2"
                  max="3.0"
                  value={form.minRiskReward}
                  onChange={(e) => setForm({ ...form, minRiskReward: parseFloat(e.target.value) || 1.5 })}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">CYCLE INTERVAL ({form.autonomousCycleSeconds}s)</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={form.autonomousCycleSeconds}
                  onChange={(e) => setForm({ ...form, autonomousCycleSeconds: parseInt(e.target.value, 10) || 20 })}
                  className="w-full mt-1 p-2 rounded bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Reset Paper Portfolio Section */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                RESET PAPER PORTFOLIO
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Restore clean $100,000 cash balance and clear all paper records
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
            >
              {resetting ? 'RESETTING...' : 'RESET TO $100K'}
            </button>
          </div>

          {/* Save Footer */}
          <div className="flex items-center justify-between pt-2">
            {saved ? (
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : (
              <span></span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> SAVE SETTINGS
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
