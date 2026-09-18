import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  DollarSign, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Coffee, 
  Fuel, 
  Wrench, 
  X
} from 'lucide-react';

export const PettyCashView = () => {
  const { token, activeProjectId, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [type, setType] = useState('OUT'); // 'IN' or 'OUT'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Labour Welfare');
  const [note, setNote] = useState('');

  const loadPettyCash = () => {
    setLoading(true);
    fetch(`/api/petty-cash?projectId=${activeProjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.entries) setEntries(data.entries);
        if (data.summary) setSummary(data.summary);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadPettyCash();
  }, [token, activeProjectId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      const res = await fetch('/api/petty-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          type,
          amount: Number(amount),
          category,
          note
        })
      });

      if (res.ok) {
        setShowModal(false);
        setAmount('');
        setNote('');
        loadPettyCash();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            <span>Site Petty Cash Register</span>
          </h1>
          <p className="text-xs text-slate-400">
            Cash In/Out vouchers for tea, diesel, hardware, and minor site logistics
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Voucher</span>
        </button>
      </div>

      {/* Petty Cash Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Cash In</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
            {formatINR(summary.totalIn)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Cash Out</span>
          <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
            {formatINR(summary.totalOut)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">In-Hand Balance</span>
          <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
            {formatINR(summary.balance)}
          </span>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-amber-400" />
          Recent Cash Vouchers
        </h3>

        <div className="divide-y divide-slate-800/80">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              No cash transactions logged yet.
            </div>
          ) : (
            entries.map(item => {
              const isOut = item.type === 'OUT';

              return (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isOut ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {isOut ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.category}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-950 text-slate-400 border border-slate-800">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-snug">{item.note}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">By: {item.loggedBy}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm font-mono font-bold block ${isOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isOut ? `-${formatINR(item.amount)}` : `+${formatINR(item.amount)}`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Bal: {formatINR(item.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">New Petty Cash Voucher</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 font-bold">
                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`py-2 rounded-lg transition-all ${
                    type === 'OUT' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cash OUT (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`py-2 rounded-lg transition-all ${
                    type === 'IN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cash IN (Top-up)
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  <option value="Labour Welfare">Labour Welfare / Tea & Snacks</option>
                  <option value="Machinery Rental / Fuel">Diesel / Fuel / Vibrator</option>
                  <option value="Tools & Hardware">Minor Hardware & Binding Wire</option>
                  <option value="Transport / Auto">Site Auto / Truck Fare</option>
                  <option value="Cash Infusion">Owner Cash Infusion (Top-up)</option>
                  <option value="Miscellaneous">Miscellaneous Site Need</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Voucher Description / Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Tea & snacks for 25 workers + 2 mineral water cans"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all"
                >
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
