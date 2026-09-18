import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatLakhCrore, formatINR, formatDate } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Download, 
  Building2, 
  Receipt,
  FileCheck,
  X
} from 'lucide-react';

export const RABillingView = () => {
  const { token, activeProjectId } = useAuth();
  const [bills, setBills] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showNewBillModal, setShowNewBillModal] = useState(false);

  // New RA Bill Form
  const [periodStart, setPeriodStart] = useState('2026-08-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-15');
  const [retentionPercent, setRetentionPercent] = useState(5);
  const [tdsPercent, setTdsPercent] = useState(2);
  const [isInterstate, setIsInterstate] = useState(false);
  const [claimedPercentages, setClaimedPercentages] = useState({});

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/projects/${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`/api/ra-bills?projectId=${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ])
      .then(([projData, billsData]) => {
        setProject(projData);
        if (Array.isArray(billsData)) {
          setBills(billsData);
          if (billsData.length > 0 && !selectedBill) {
            setSelectedBill(billsData[0]);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadData();
  }, [token, activeProjectId]);

  const handlePercentageChange = (stageId, pct) => {
    setClaimedPercentages(prev => ({
      ...prev,
      [stageId]: Number(pct)
    }));
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    const items = (project?.stages || []).map(stage => {
      const pct = claimedPercentages[stage.id] || stage.progress || 0;
      const amount = Math.round(((stage.budget || 0) * pct) / 100);
      return {
        description: stage.name,
        totalScope: stage.budget,
        percentClaimed: pct,
        amount
      };
    }).filter(i => i.amount > 0);

    if (items.length === 0) {
      alert('Please enter progress completion for at least one stage.');
      return;
    }

    try {
      const res = await fetch('/api/ra-bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          periodStart,
          periodEnd,
          items,
          retentionPercent,
          tdsPercent,
          isInterstate
        })
      });

      if (res.ok) {
        setShowNewBillModal(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-400" />
            <span>GST Running Account (RA) Billing</span>
          </h1>
          <p className="text-xs text-slate-400">
            Stage completion progressive billing with GST, TDS, and Retention
          </p>
        </div>

        <div className="flex gap-2">
          {selectedBill && (
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Tax Invoice</span>
            </button>
          )}

          <button
            onClick={() => setShowNewBillModal(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create RA Bill</span>
          </button>
        </div>
      </div>

      {/* RA Bills List Horizontal Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {bills.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBill(b)}
            className={`p-3 rounded-2xl border text-left shrink-0 min-w-[200px] transition-all ${
              selectedBill?.id === b.id
                ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                {b.billNo}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                b.status === 'Paid' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {b.status}
              </span>
            </div>
            <span className="text-base font-black font-mono text-white block">
              {formatINR(b.netPayable)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Period: {formatDate(b.periodStart)} - {formatDate(b.periodEnd)}
            </span>
          </button>
        ))}
      </div>

      {/* Invoice Layout Card */}
      {selectedBill && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden font-sans">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black tracking-wider uppercase">
                  Running Account Bill
                </span>
                <span className="font-mono text-xs text-slate-400">GSTIN: 29AABCS8891P1Z5</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Sharma & Sons Infra Buildcon
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Builders, Civil Engineers & Turnkey Contractors • Bengaluru / Chennai
              </p>
            </div>

            <div className="text-right sm:self-center">
              <span className="text-xs text-slate-400 font-mono block">Invoice No: <strong className="text-amber-400">{selectedBill.billNo}</strong></span>
              <span className="text-xs text-slate-400 block">Date: {formatDate(selectedBill.date)}</span>
              <span className="text-xs text-slate-400 block">Period: {formatDate(selectedBill.periodStart)} to {formatDate(selectedBill.periodEnd)}</span>
            </div>
          </div>

          {/* Client & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Billed To (Client):</span>
              <h4 className="font-bold text-white text-sm">{selectedBill.clientName}</h4>
              <p className="text-slate-400 mt-0.5">{selectedBill.clientAddress || project?.address}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Project Site:</span>
              <h4 className="font-bold text-white text-sm">{selectedBill.projectName}</h4>
              <p className="text-slate-400 mt-0.5">{project?.address}</p>
            </div>
          </div>

          {/* Stage Progress Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Stage / Work Scope</th>
                  <th className="py-2.5 px-3 text-right">Agreed Scope (₹)</th>
                  <th className="py-2.5 px-3 text-right">Claimed %</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {selectedBill.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{item.description}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">{formatINR(item.totalScope)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-bold">{item.percentClaimed}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Deductions Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Payment Terms & Banking Information:</p>
              <p>Bank: HDFC Bank Ltd • Current A/c: 50200091823901</p>
              <p>IFSC: HDFC0001242 • Branch: Whitefield Bangalore</p>
              <p className="text-[11px] text-slate-500 pt-1">
                * Note: 5% Retention held will be released after Defect Liability Period (DLP).
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-400">
                <span>Gross Work Subtotal:</span>
                <span className="font-mono font-bold text-white">{formatINR(selectedBill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Less: {selectedBill.retentionPercent}% Retention Money:</span>
                <span className="font-mono font-bold">-{formatINR(selectedBill.retentionAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-slate-800">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatINR(selectedBill.taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Add: CGST @ 9%:</span>
                <span className="font-mono">{formatINR(selectedBill.cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Add: SGST @ 9%:</span>
                <span className="font-mono">{formatINR(selectedBill.sgstAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Less: TDS (Sec 194C @ {selectedBill.tdsPercent}%):</span>
                <span className="font-mono">-{formatINR(selectedBill.tdsAmount)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-amber-400 pt-2 border-t-2 border-slate-700">
                <span>Net Payable Amount:</span>
                <span className="font-mono">{formatINR(selectedBill.netPayable)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New RA Bill Modal */}
      {showNewBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col p-5 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Generate Stage-Based RA Bill
              </h3>
              <button onClick={() => setShowNewBillModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="overflow-y-auto flex-1 space-y-3.5 text-xs pr-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Specify % Progress Claimed for Each Stage:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {(project?.stages || []).map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block truncate">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Scope: {formatINR(s.budget)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={claimedPercentages[s.id] !== undefined ? claimedPercentages[s.id] : s.progress}
                          onChange={(e) => handlePercentageChange(s.id, e.target.value)}
                          className="w-14 bg-slate-950 border border-slate-700 rounded-lg p-1 text-center font-mono font-bold text-amber-400"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Retention Deduction (%)</label>
                  <input
                    type="number"
                    value={retentionPercent}
                    onChange={(e) => setRetentionPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">TDS Sec 194C (%)</label>
                  <input
                    type="number"
                    value={tdsPercent}
                    onChange={(e) => setTdsPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBillModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all"
                >
                  Generate Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
