import React, { useEffect, useState } from "react";
import { BarChart3, X, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { AggregateStats } from "../types";
import { fetchAggregateStats, subscribeAggregateStats } from "../lib/firestoreService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminStatsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    // Initial fetch and subscribe to real-time updates
    const unsubscribe = subscribeAggregateStats(
      (updatedStats) => {
        setStats(updatedStats);
        setLoading(false);
      },
      (err) => {
        console.error("Admin stats subscription rejected:", err);
        setError("Unable to load aggregate statistics. Verify admin role permission in Firebase Auth.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAggregateStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch aggregate stats:", err);
      setError(err.message || "Failed to load aggregate statistics.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Admin Aggregate Statistics
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full">
                  RBAC Enforced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Global Platform Usage &amp; High-Stress Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Privacy & Scope Notice */}
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block mb-0.5">
                Privacy-Preserving Aggregate Only (Directive 12)
              </span>
              <p className="leading-relaxed">
                This panel displays non-identifiable counter values from{" "}
                <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[11px]">
                  /stats/aggregate
                </code>
                . No individual journal text, user identity, or per-user breakdown is ever stored or accessible here.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Total Reflections
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">
                  {loading && !stats ? "—" : stats?.totalEntries ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">entries</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                All platform classifications
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-medium text-amber-800 block mb-1">
                High-Stress Flags
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-amber-900 tracking-tight">
                  {loading && !stats ? "—" : stats?.totalHighStress ?? 0}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">events</span>
              </div>
              <p className="text-[11px] text-amber-600/80 mt-2">
                Alert trigger classifications
              </p>
            </div>
          </div>

          {/* Timestamp Info */}
          {stats?.lastUpdated && (
            <p className="text-[11px] text-slate-400 text-right">
              Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
