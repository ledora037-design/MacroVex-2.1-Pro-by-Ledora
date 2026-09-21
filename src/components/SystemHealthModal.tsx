import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Globe,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import { DataHealthItem } from '../types.js';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [healthData, setHealthData] = useState<{
    status: string;
    tradingMode: string;
    isAutonomousActive: boolean;
    agentState: string;
    services: DataHealthItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error('Failed to load health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e1422] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        <div className="p-4 bg-[#090d14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-base font-bold text-white tracking-wide">
                SYSTEM PIPELINES & API CONNECTIVITY
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                REAL-TIME DATA FEED DIAGNOSTICS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto font-mono text-xs">
          {/* Quick status cards */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400">CORE SERVER</span>
              <div className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> ONLINE (Port 3000)
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">TRADING MODE</span>
              <div className="text-cyan-300 font-bold mt-0.5">
                {healthData?.tradingMode || 'PAPER'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">AUTONOMOUS LOOP</span>
              <div className="text-amber-300 font-bold mt-0.5">
                {healthData?.agentState || 'SCANNING'}
              </div>
            </div>
          </div>

          {/* Service Pipelines List */}
          <div className="space-y-2.5">
            <h3 className="font-display text-xs font-bold text-white tracking-wider">
              EXTERNAL DATA ADAPTERS
            </h3>

            {healthData?.services.map((svc, idx) => {
              const isConnected = svc.status === 'CONNECTED';
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{svc.service}</span>
                      <span className="text-[10px] text-slate-400">({svc.provider})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {svc.latencyMs}ms
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{svc.message}</p>
                </div>
              );
            })}
          </div>

          {/* Environment Secrets Notice */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-slate-300 text-[11px] space-y-1">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              SERVER-SIDE SECURITY ENFORCEMENT
            </div>
            <p className="text-slate-400 leading-tight">
              All market API credentials (`BITGET_API_KEY`, `CMC_API_KEY`, `GEMINI_API_KEY`) are managed strictly on the backend container. No client-side browser exposure is permitted.
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#090d14] border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            CLOSE DIAGNOSTICS
          </button>
        </div>
      </div>
    </div>
  );
};
