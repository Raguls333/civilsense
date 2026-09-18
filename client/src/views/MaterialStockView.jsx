import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  TrendingDown, 
  Calendar, 
  ShoppingCart, 
  Truck, 
  CheckCircle2,
  X
} from 'lucide-react';

export const MaterialStockView = () => {
  const { token, activeProjectId } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // New Purchase Form
  const [materialId, setMaterialId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/materials?projectId=${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`/api/materials/purchases?projectId=${activeProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch('/api/ledger/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    ])
      .then(([matData, purData, venData]) => {
        if (Array.isArray(matData)) {
          setMaterials(matData);
          if (matData.length > 0 && !materialId) {
            setMaterialId(matData[0].id);
            setUnitPrice(matData[0].unitCost || '');
          }
        }
        if (Array.isArray(purData)) setPurchases(purData);
        if (Array.isArray(venData)) {
          setVendors(venData);
          if (venData.length > 0 && !vendorId) setVendorId(venData[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadData();
  }, [token, activeProjectId]);

  const handleMaterialSelect = (mId) => {
    setMaterialId(mId);
    const m = materials.find(x => x.id === mId);
    if (m) setUnitPrice(m.unitCost || '');
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    const selMat = materials.find(m => m.id === materialId);
    if (!selMat || !qty || Number(qty) <= 0) {
      alert('Please select material and enter valid quantity');
      return;
    }

    try {
      const res = await fetch('/api/materials/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          materialId,
          materialName: selMat.name,
          vendorId,
          qty: Number(qty),
          unit: selMat.unit,
          unitPrice: Number(unitPrice),
          invoiceNo,
          date,
          category: selMat.category,
          paymentStatus
        })
      });

      if (res.ok) {
        setShowPurchaseModal(false);
        setQty('');
        setInvoiceNo('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lowStockCount = materials.filter(m => m.isLowStock).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Materials & Stock Register</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time stock balance, low-stock alerts & vendor purchase entries
          </p>
        </div>

        <button
          onClick={() => setShowPurchaseModal(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record Inward</span>
        </button>
      </div>

      {/* Low Stock Warning Banner if any items low */}
      {lowStockCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-rose-300">
              Low Stock Alert ({lowStockCount} items below site threshold)
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Cement or steel levels have fallen below safety limits. Issue purchase orders immediately.
            </p>
          </div>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {materials.map(m => {
          const isLow = m.isLowStock;

          return (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-md ${
                isLow 
                  ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20' 
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                    {m.category}
                  </span>
                  {isLow ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Sufficient
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white leading-snug">{m.name}</h3>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">In-Stock</span>
                  <span className={`text-2xl font-black font-mono tracking-tight ${isLow ? 'text-rose-400' : 'text-white'}`}>
                    {m.stockQty} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                  </span>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <span className="block">Min: {m.lowStockThreshold} {m.unit}</span>
                  <span className="font-mono text-amber-400 font-semibold">₹{m.unitCost}/{m.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Material Purchases History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-400" />
          Recent Material Purchases & Inward Deliveries
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Material & Qty</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3 text-right">Total Cost</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No material purchases logged yet.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-medium">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      <div>{p.materialName}</div>
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {p.qty} {p.unit} @ ₹{p.unitPrice}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {p.vendorName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {p.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatINR(p.totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.paymentStatus === 'Paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                Record Material Inward / Purchase
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Material</label>
                <select
                  value={materialId}
                  onChange={(e) => handleMaterialSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category}) — Current: {m.stockQty} {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Vendor / Supplier</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-medium"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Balance: ₹{(v.balance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="e.g. 100"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="e.g. 395"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Invoice / Challan #</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. UTC/9921"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Live Cost Calculation Preview */}
              {qty && unitPrice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Total Invoice Cost:</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {formatINR(Number(qty) * Number(unitPrice))}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all"
                >
                  Save Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
