import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatLakhCrore, formatINR, formatPercent } from '../utils/formatters';
import { 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  DollarSign,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const CostSummaryView = () => {
  const { token, activeProjectId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cost/summary/${activeProjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token, activeProjectId]);

  if (loading) {
    return (
      <div className="space-y-4 pb-20 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-900 border border-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-900 border border-slate-800" />
      </div>
    );
  }

  const totals = data?.totals || {};
  const project = data?.project || {};
  const matrix = data?.matrix || [];

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <PieChart className="w-6 h-6 text-amber-400" />
          <span>Cost Summary & Budget Rollup</span>
        </h1>
        <p className="text-xs text-slate-400">
          Auto-rollup 2D matrix: Categories × (Material, Labor, Others, Total) with Lakh/Crore tracking
        </p>
      </div>

      {/* Top High-Level Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Budget</span>
          <span className="text-lg sm:text-xl font-black text-white font-mono">
            {formatLakhCrore(totals.budget)}
          </span>
          <span className="text-[10px] text-slate-500 block">({formatINR(totals.budget)})</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Live Spent</span>
          <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
            {formatLakhCrore(totals.totalSpent)}
          </span>
          <span className="text-[10px] text-amber-400/80 font-mono block font-semibold">
            {totals.overallBurnRate}% consumed
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Balance</span>
          <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {formatLakhCrore(totals.remainingBudget)}
          </span>
          <span className="text-[10px] text-slate-500 block">Available buffer</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Site Progress</span>
          <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono">
            {project.completionPercentage}%
          </span>
          <span className="text-[10px] text-slate-400 block font-semibold">Stage verified</span>
        </div>
      </div>

      {/* Cost Split Visual Bars (Material vs Labor vs Others) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-xl">
        <span className="text-xs font-bold text-white uppercase tracking-wider block">
          Cost Split Breakdown
        </span>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex">
          <div 
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${totals.totalSpent > 0 ? (totals.material / totals.totalSpent) * 100 : 0}%` }}
            title="Material Cost"
          />
          <div 
            className="bg-cyan-500 h-full transition-all"
            style={{ width: `${totals.totalSpent > 0 ? (totals.labor / totals.totalSpent) * 100 : 0}%` }}
            title="Labor Wages"
          />
          <div 
            className="bg-purple-500 h-full transition-all"
            style={{ width: `${totals.totalSpent > 0 ? (totals.others / totals.totalSpent) * 100 : 0}%` }}
            title="Site Expenses / Others"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Material</span>
              <span className="font-mono font-bold text-white">{formatINR(totals.material)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Labor (Attendance)</span>
              <span className="font-mono font-bold text-white">{formatINR(totals.labor)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Others / Expenses</span>
              <span className="font-mono font-bold text-white">{formatINR(totals.others)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* The 2D Rollup Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            2D Category Cost Rollup Matrix
          </h3>
          <span className="text-[11px] text-slate-400">
            Category × Material / Labor / Others / Budget Variance
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3">Trade / Work Category</th>
                <th className="py-3 px-3 text-right">Material</th>
                <th className="py-3 px-3 text-right">Labor</th>
                <th className="py-3 px-3 text-right">Others</th>
                <th className="py-3 px-3 text-right text-amber-400">Total Spent</th>
                <th className="py-3 px-3 text-right">Budget Allotted</th>
                <th className="py-3 px-3 text-right">Variance %</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {matrix.map((row, idx) => {
                const isOver = row.total > row.budget;

                return (
                  <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {row.material > 0 ? formatINR(row.material) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {row.labor > 0 ? formatINR(row.labor) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {row.others > 0 ? formatINR(row.others) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      {formatINR(row.total)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {formatLakhCrore(row.budget)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={isOver ? 'text-rose-400' : 'text-emerald-400'}>
                        {row.variancePercent > 0 ? `+${row.variancePercent}%` : `${row.variancePercent}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        row.status === 'Over Budget'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : row.status === 'Watch'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Grand Totals Footer */}
            <tfoot className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
              <tr>
                <td className="py-3 px-3 uppercase tracking-wider">Grand Total Rollup</td>
                <td className="py-3 px-3 text-right font-mono text-amber-400">{formatINR(totals.material)}</td>
                <td className="py-3 px-3 text-right font-mono text-cyan-400">{formatINR(totals.labor)}</td>
                <td className="py-3 px-3 text-right font-mono text-purple-400">{formatINR(totals.others)}</td>
                <td className="py-3 px-3 text-right font-mono text-amber-400 text-sm font-black">{formatINR(totals.totalSpent)}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-300 text-sm">{formatLakhCrore(totals.budget)}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400">{totals.overallBurnRate}%</td>
                <td className="py-3 px-3 text-right text-emerald-400">Active</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
