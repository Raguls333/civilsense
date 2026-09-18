import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate, formatLakhCrore } from '../utils/formatters';
import { 
  BookOpen, 
  Plus, 
  Printer, 
  Share2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Building2, 
  Phone, 
  FileSpreadsheet, 
  CheckCircle2, 
  CreditCard, 
  X,
  Trash2,
  Edit2,
  AlertCircle,
  Copy,
  Check,
  ArrowUpDown,
  DollarSign,
  TrendingDown,
  TrendingUp,
  MapPin
} from 'lucide-react';

export const VendorLedgerView = ({ onOpenWhatsApp }) => {
  const { token, activeProjectId } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('All');
  
  // Ledger summary stats
  const [summary, setSummary] = useState({
    totalVendors: 0,
    vendorsWithDuesCount: 0,
    totalOutstanding: 0,
    totalPaymentsPaid: 0,
    totalInvoicesBilled: 0
  });

  // Table filtering & sorting
  const [entryFilter, setEntryFilter] = useState('All'); // 'All' | 'Payment' | 'Invoice'
  const [entrySearch, setEntrySearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) | 'asc' (oldest first)

  // Add / Edit Vendor Modal
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorModalMode, setVendorModalMode] = useState('create'); // 'create' | 'edit'
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorFormData, setVendorFormData] = useState({
    name: '',
    type: 'Material Supplier',
    category: 'Cement & Aggregates',
    contactPerson: '',
    phone: '',
    gstNumber: '',
    upiId: '',
    address: '',
    balance: ''
  });
  const [vendorSubmitting, setVendorSubmitting] = useState(false);

  // New Ledger Entry Modal
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState('Payment'); // 'Payment' (Debit) or 'Invoice' (Credit)
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank RTGS/NEFT');
  const [reference, setReference] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'vendor' | 'entry', id: string, label: string }
  const [deleting, setDeleting] = useState(false);

  // Copy indicator for UPI & GST
  const [copiedKey, setCopiedKey] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load Vendors list
  const loadVendors = async (keepSelectedId = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ledger/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVendors(data);
        if (keepSelectedId && data.some(v => v.id === keepSelectedId)) {
          setSelectedVendorId(keepSelectedId);
        } else if (data.length > 0 && (!selectedVendorId || !data.some(v => v.id === selectedVendorId))) {
          setSelectedVendorId(data[0].id);
        } else if (data.length === 0) {
          setSelectedVendorId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
      showToast('Error loading vendors list', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Summary
  const loadSummary = async () => {
    try {
      const res = await fetch(`/api/ledger/summary?projectId=${activeProjectId || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && !data.error) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load summary stats:', err);
    }
  };

  // Load Ledger Entries for the selected party
  const loadEntries = async (vId) => {
    if (!vId) {
      setEntries([]);
      return;
    }
    setEntriesLoading(true);
    try {
      let url = `/api/ledger/entries?partyId=${vId}`;
      if (entryFilter && entryFilter !== 'All') {
        url += `&type=${entryFilter}`;
      }
      if (entrySearch.trim()) {
        url += `&search=${encodeURIComponent(entrySearch.trim())}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntries(data);
      }
    } catch (err) {
      console.error('Failed to load ledger entries:', err);
      showToast('Failed to load transactions', 'error');
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadVendors();
      loadSummary();
    }
  }, [token, activeProjectId]);

  useEffect(() => {
    if (selectedVendorId) {
      loadEntries(selectedVendorId);
    } else {
      setEntries([]);
    }
  }, [selectedVendorId, entryFilter, entrySearch]);

  const selectedVendor = useMemo(() => {
    return vendors.find(v => v.id === selectedVendorId) || null;
  }, [vendors, selectedVendorId]);

  // Compute stats for current selected vendor
  const selectedVendorStats = useMemo(() => {
    if (!selectedVendor) {
      return { totalDebit: 0, totalCredit: 0, netBalance: 0 };
    }
    const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);
    return {
      totalDebit,
      totalCredit,
      netBalance: Number(selectedVendor.balance) || 0
    };
  }, [selectedVendor, entries]);

  // Sorted entries
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const cmp = (b.date || '').localeCompare(a.date || '');
      return sortOrder === 'desc' ? cmp : -cmp;
    });
  }, [entries, sortOrder]);

  // Filtered vendors list for carousel
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = (
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone?.includes(searchQuery) ||
        v.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (!matchSearch) return false;

      if (vendorTypeFilter === 'Dues') {
        return Number(v.balance) > 0;
      }
      if (vendorTypeFilter !== 'All') {
        return v.type === vendorTypeFilter;
      }
      return true;
    });
  }, [vendors, searchQuery, vendorTypeFilter]);

  // Open Add Vendor Modal
  const handleOpenAddVendor = () => {
    setVendorModalMode('create');
    setEditingVendorId(null);
    setVendorFormData({
      name: '',
      type: 'Material Supplier',
      category: 'Cement & Aggregates',
      contactPerson: '',
      phone: '',
      gstNumber: '',
      upiId: '',
      address: '',
      balance: ''
    });
    setShowVendorModal(true);
  };

  // Open Edit Vendor Modal
  const handleOpenEditVendor = (vendor) => {
    setVendorModalMode('edit');
    setEditingVendorId(vendor.id);
    setVendorFormData({
      name: vendor.name || '',
      type: vendor.type || 'Material Supplier',
      category: vendor.category || 'Cement & Aggregates',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      gstNumber: vendor.gstNumber || '',
      upiId: vendor.upiId || '',
      address: vendor.address || '',
      balance: vendor.balance || 0
    });
    setShowVendorModal(true);
  };

  // Save Vendor (Create or Update)
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!vendorFormData.name.trim()) {
      alert('Please enter vendor/contractor name.');
      return;
    }
    if (!vendorFormData.phone.trim()) {
      alert('Please enter a contact phone number.');
      return;
    }

    setVendorSubmitting(true);
    try {
      const url = vendorModalMode === 'create'
        ? '/api/ledger/vendors'
        : `/api/ledger/vendors/${editingVendorId}`;
      const method = vendorModalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...vendorFormData,
          projectId: activeProjectId,
          balance: Number(vendorFormData.balance) || 0
        })
      });

      if (res.ok) {
        const saved = await res.json();
        showToast(
          vendorModalMode === 'create' 
            ? `Added "${vendorFormData.name}" successfully!` 
            : `Updated "${vendorFormData.name}" successfully!`
        );
        setShowVendorModal(false);
        await loadVendors(saved.id || editingVendorId);
        loadSummary();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save vendor details.');
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
      showToast('Error communicating with server', 'error');
    } finally {
      setVendorSubmitting(false);
    }
  };

  // Delete Vendor
  const confirmDeleteVendor = (vendor) => {
    setDeleteConfirm({
      type: 'vendor',
      id: vendor.id,
      label: `Vendor "${vendor.name}" and all their ledger transactions`
    });
  };

  // Delete Entry
  const confirmDeleteEntry = (entry) => {
    setDeleteConfirm({
      type: 'entry',
      id: entry.id,
      label: `${entry.type} entry of ${formatINR(entry.debit > 0 ? entry.debit : entry.credit)} on ${formatDate(entry.date)}`
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'vendor') {
        const res = await fetch(`/api/ledger/vendors/${deleteConfirm.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Vendor removed successfully');
          setDeleteConfirm(null);
          await loadVendors();
          loadSummary();
        }
      } else if (deleteConfirm.type === 'entry') {
        const res = await fetch(`/api/ledger/entries/${deleteConfirm.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Transaction voided successfully');
          setDeleteConfirm(null);
          loadVendors(selectedVendorId);
          loadEntries(selectedVendorId);
          loadSummary();
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Failed to complete delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Add Manual Ledger Entry
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    if (!selectedVendor) {
      alert('Please select a vendor first.');
      return;
    }

    const isDebit = entryType === 'Payment';
    const numAmount = Number(amount);

    setEntrySubmitting(true);
    try {
      const res = await fetch('/api/ledger/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partyId: selectedVendor.id,
          projectId: activeProjectId,
          date: entryDate,
          description: description.trim(),
          debit: isDebit ? numAmount : 0,
          credit: !isDebit ? numAmount : 0,
          type: entryType,
          paymentMode,
          reference: reference.trim()
        })
      });

      if (res.ok) {
        showToast(
          isDebit 
            ? `Payment of ${formatINR(numAmount)} recorded` 
            : `Invoice of ${formatINR(numAmount)} added`
        );
        setShowEntryModal(false);
        setAmount('');
        setDescription('');
        setReference('');
        loadVendors(selectedVendor.id);
        loadEntries(selectedVendor.id);
        loadSummary();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to record entry.');
      }
    } catch (err) {
      console.error('Error adding ledger entry:', err);
      showToast('Error recording entry', 'error');
    } finally {
      setEntrySubmitting(false);
    }
  };

  // Quick Settle Action (Prefills payment with exact outstanding balance)
  const handleQuickSettle = () => {
    if (!selectedVendor) return;
    const due = Math.max(0, Number(selectedVendor.balance) || 0);
    setEntryType('Payment');
    setAmount(due > 0 ? due.toString() : '');
    setDescription(`Balance settlement payment to ${selectedVendor.name}`);
    setPaymentMode('Bank RTGS/NEFT');
    setReference('');
    setShowEntryModal(true);
  };

  // Quick Bill Action
  const handleQuickInvoice = () => {
    if (!selectedVendor) return;
    setEntryType('Invoice');
    setAmount('');
    setDescription(`Supply / Work invoice from ${selectedVendor.name}`);
    setPaymentMode('Credit / Invoice');
    setReference('');
    setShowEntryModal(true);
  };

  // Copy to clipboard helper
  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export Statement to CSV / Excel
  const handleExportCSV = () => {
    if (!selectedVendor) return;
    if (entries.length === 0) {
      alert('No ledger transactions to export for this party.');
      return;
    }

    const headers = ['Date', 'Particulars / Description', 'Reference No', 'Payment Mode', 'Paid (Debit INR)', 'Billed (Credit INR)', 'Balance After (INR)'];
    const rows = sortedEntries.map(item => [
      item.date || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.reference || '').replace(/"/g, '""')}"`,
      item.paymentMode || item.type || '',
      item.debit > 0 ? item.debit : 0,
      item.credit > 0 ? item.credit : 0,
      item.balanceAfter !== undefined ? item.balanceAfter : ''
    ]);

    // Add summary row at bottom
    rows.push([]);
    rows.push([
      'TOTALS / OUTSTANDING',
      `Statement for ${selectedVendor.name}`,
      '',
      '',
      selectedVendorStats.totalDebit,
      selectedVendorStats.totalCredit,
      selectedVendorStats.netBalance
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedName = selectedVendor.name.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `CivilSense_Ledger_${sanitizedName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ledger statement CSV downloaded');
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold transition-all animate-bounce ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Vendor & Contractor Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time Credit/Debit running balance, material invoices & payment settlements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={!selectedVendor || entries.length === 0}
            className="p-2 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Download CSV Statement"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Print Statement */}
          <button
            onClick={handlePrint}
            disabled={!selectedVendor}
            className="p-2 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Print / Save PDF Statement"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Print Statement</span>
          </button>

          {/* Add Vendor / Contractor */}
          <button
            onClick={handleOpenAddVendor}
            className="p-2 sm:px-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>+ Add Party</span>
          </button>

          {/* Add Entry */}
          <button
            onClick={() => {
              setEntryType('Payment');
              setAmount('');
              setDescription('');
              setReference('');
              setShowEntryModal(true);
            }}
            disabled={!selectedVendor}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black px-3 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Summary Stats) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 no-print">
        {/* Total Outstanding Project Dues */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Payables</span>
            <span className="p-1 rounded-md bg-rose-500/15 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-rose-400">
            {formatINR(summary.totalOutstanding)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Across {summary.vendorsWithDuesCount} / {summary.totalVendors} suppliers with dues
          </span>
        </div>

        {/* Selected Party Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
              {selectedVendor ? `${selectedVendor.name} Due` : 'Party Due'}
            </span>
            <span className="p-1 rounded-md bg-amber-500/15 text-amber-400">
              <CreditCard className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`text-lg sm:text-xl font-mono font-black ${
            selectedVendorStats.netBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatINR(selectedVendorStats.netBalance)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {selectedVendorStats.netBalance > 0 ? 'Pending payment balance' : 'Zero balance / Settled'}
          </span>
        </div>

        {/* Total Payments Paid to Current Party */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Paid (Debit)</span>
            <span className="p-1 rounded-md bg-emerald-500/15 text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
            {formatINR(selectedVendorStats.totalDebit)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Cleared cash/bank payouts
          </span>
        </div>

        {/* Total Invoiced by Current Party */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Invoiced</span>
            <span className="p-1 rounded-md bg-sky-500/15 text-sky-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-sky-400">
            {formatINR(selectedVendorStats.totalCredit)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Cumulative bills & supplies
          </span>
        </div>
      </div>

      {/* Horizontal Vendor Picker / Search & Filters */}
      <div className="space-y-2 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, supplier, contractor, phone or GST..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
            {['All', 'Material Supplier', 'Sub-Contractor', 'Dues'].map(tab => (
              <button
                key={tab}
                onClick={() => setVendorTypeFilter(tab)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                  vendorTypeFilter === tab
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'Dues' ? '⚠️ Has Dues' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor Chips Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {/* Add Vendor Quick Chip */}
          <button
            onClick={handleOpenAddVendor}
            className="p-3 rounded-xl border border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 shrink-0 min-w-[150px] flex flex-col items-center justify-center gap-1 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
            </div>
            <span className="text-xs font-bold">New Vendor</span>
          </button>

          {filteredVendors.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 flex items-center">
              No matching vendors found.
            </div>
          ) : (
            filteredVendors.map(v => {
              const isSelected = v.id === selectedVendorId;
              const hasDue = Number(v.balance) > 0;

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVendorId(v.id)}
                  className={`p-2.5 rounded-xl border text-left shrink-0 min-w-[185px] transition-all relative ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-950 text-slate-400 border border-slate-800 uppercase truncate max-w-[110px]">
                      {v.category || v.type}
                    </span>
                    {hasDue ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                        Due
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-white truncate max-w-[170px]">{v.name}</h4>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {v.contactPerson || v.phone}
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between border-t border-slate-800/80 pt-1">
                    <span className="text-[10px] text-slate-500">Balance:</span>
                    <span className={`text-xs font-mono font-bold ${hasDue ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatINR(v.balance)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Vendor Statement Card */}
      {selectedVendor ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Printable Formal Header - only visible when printing */}
          <div className="hidden print:block pb-4 border-b border-black">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase text-black">CIVILSENSE CONSTRUCTION OS</h1>
                <p className="text-xs text-gray-700">Project Management & Contractor Financial Accounts</p>
                <p className="text-xs text-gray-600 mt-1">Project Code: {activeProjectId || 'PROJ-1'}</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold uppercase">Statement of Account</h2>
                <p className="text-xs text-gray-700">Date Generated: {new Date().toLocaleDateString('en-IN')}</p>
                <p className="text-xs text-gray-700">Statement Period: All Live Transactions</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs grid grid-cols-2 gap-2 text-black">
              <div>
                <strong>Party / Vendor:</strong> {selectedVendor.name}<br />
                <strong>Contact Person:</strong> {selectedVendor.contactPerson}<br />
                <strong>Phone:</strong> {selectedVendor.phone}<br />
                {selectedVendor.address && <><strong>Address:</strong> {selectedVendor.address}<br /></>}
              </div>
              <div className="text-right">
                {selectedVendor.gstNumber && <><strong>GSTIN:</strong> {selectedVendor.gstNumber}<br /></>}
                {selectedVendor.upiId && <><strong>UPI / VPA:</strong> {selectedVendor.upiId}<br /></>}
                <strong>Category / Type:</strong> {selectedVendor.type} ({selectedVendor.category})<br />
                <strong>Net Closing Balance:</strong> <span className="font-bold">{formatINR(selectedVendor.balance)}</span>
              </div>
            </div>
          </div>

          {/* Screen Statement Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-white">{selectedVendor.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                  {selectedVendor.type}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 font-mono border border-slate-800">
                  {selectedVendor.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Contact: <strong className="text-slate-200">{selectedVendor.contactPerson || '—'}</strong></span>
                
                {/* Click to Call */}
                <a 
                  href={`tel:${selectedVendor.phone}`}
                  className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition-colors"
                  title="Click to Call"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <strong className="underline underline-offset-2">{selectedVendor.phone}</strong>
                </a>

                {/* GSTIN with copy */}
                {selectedVendor.gstNumber && (
                  <span className="flex items-center gap-1 font-mono">
                    GST: <strong className="text-slate-200">{selectedVendor.gstNumber}</strong>
                    <button
                      onClick={() => handleCopyText(selectedVendor.gstNumber, 'gst')}
                      className="p-0.5 text-slate-500 hover:text-white"
                      title="Copy GSTIN"
                    >
                      {copiedKey === 'gst' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </span>
                )}

                {/* UPI with copy */}
                {selectedVendor.upiId && (
                  <span className="flex items-center gap-1 font-mono">
                    UPI: <strong className="text-slate-200">{selectedVendor.upiId}</strong>
                    <button
                      onClick={() => handleCopyText(selectedVendor.upiId, 'upi')}
                      className="p-0.5 text-slate-500 hover:text-white"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </span>
                )}

                {selectedVendor.address && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{selectedVendor.address}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp Reminder Trigger */}
              <button
                onClick={() => onOpenWhatsApp && onOpenWhatsApp('vendor_payment_reminder', selectedVendor.id)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                title="Send Payment Reminder over WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Notice</span>
              </button>

              {/* Quick Settle Payment */}
              <button
                onClick={handleQuickSettle}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs border border-amber-500/40 transition-all active:scale-95"
                title="Log a payment towards balance"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Pay Due</span>
              </button>

              {/* Quick Invoice */}
              <button
                onClick={handleQuickInvoice}
                className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold px-3 py-1.5 rounded-xl text-xs border border-rose-500/30 transition-all active:scale-95"
                title="Log a supply invoice"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                <span>+ Bill</span>
              </button>

              {/* Edit Vendor Button */}
              <button
                onClick={() => handleOpenEditVendor(selectedVendor)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Edit Vendor Information"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete Vendor Button */}
              <button
                onClick={() => confirmDeleteVendor(selectedVendor)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                title="Delete Vendor & Records"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Due summary box */}
              <div className="text-right pl-3 border-l border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Outstanding Due</span>
                <span className={`text-lg font-mono font-black ${
                  Number(selectedVendor.balance) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(selectedVendor.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Table Filters & Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 no-print">
            {/* Entry Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setEntryFilter('All')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  entryFilter === 'All' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({entries.length})
              </button>
              <button
                onClick={() => setEntryFilter('Payment')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  entryFilter === 'Payment' ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                Payments (Debit)
              </button>
              <button
                onClick={() => setEntryFilter('Invoice')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  entryFilter === 'Invoice' ? 'bg-rose-600/30 border border-rose-500/50 text-rose-300 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-rose-400" />
                Bills (Credit)
              </button>
            </div>

            {/* Entry Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={entrySearch}
                  onChange={(e) => setEntrySearch(e.target.value)}
                  placeholder="Filter entries by ref or note..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1"
                title="Toggle Date Order"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
          </div>

          {/* Running Cr/Dr Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description / Particulars</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Paid (Debit)</th>
                  <th className="py-3 px-3 text-right text-rose-400">Billed (Credit)</th>
                  <th className="py-3 px-3 text-right text-amber-400">Running Balance</th>
                  <th className="py-3 px-3 text-center w-12 no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {entriesLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BookOpen className="w-8 h-8 text-slate-600" />
                        <p className="text-xs">No ledger transactions recorded yet for this party.</p>
                        <button
                          onClick={() => {
                            setEntryType('Payment');
                            setAmount('');
                            setDescription('');
                            setShowEntryModal(true);
                          }}
                          className="mt-1 text-xs font-bold text-amber-400 hover:underline"
                        >
                          + Record First Transaction
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map(item => (
                    <tr key={item.id} className="hover:bg-slate-850/50 transition-colors group">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-medium">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        <div className="font-semibold text-white">{item.description}</div>
                        {item.reference && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: <span className="text-slate-300">{item.reference}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono">
                          {item.paymentMode || item.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {item.debit > 0 ? formatINR(item.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        {item.credit > 0 ? formatINR(item.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                        {formatINR(item.balanceAfter)}
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <button
                          onClick={() => confirmDeleteEntry(item)}
                          className="opacity-60 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Void / Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Table Footer with Totals */}
              {sortedEntries.length > 0 && (
                <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-800 text-xs">
                  <tr>
                    <td colSpan="3" className="py-3 px-3 text-slate-400 uppercase tracking-wider text-[10px]">
                      Totals for filtered view:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {formatINR(sortedEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      {formatINR(sortedEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400">
                      {formatINR(selectedVendor.balance)}
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Printable Signature Section */}
          <div className="hidden print:block pt-16 text-xs text-black">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="border-t border-black pt-2 font-bold">Authorized Signatory (CivilSense / Builder)</div>
                <div className="text-[10px] text-gray-600">Site Engineer / Accounts Head</div>
              </div>
              <div>
                <div className="border-t border-black pt-2 font-bold">Party / Contractor Acceptance</div>
                <div className="text-[10px] text-gray-600">Authorized Signatory / Stamp</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Vendor Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Select a supplier or contractor above, or register a new one to manage statements and payments.
          </p>
          <button
            onClick={handleOpenAddVendor}
            className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
          >
            + Register First Vendor
          </button>
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  {vendorModalMode === 'create' ? 'Register New Vendor / Sub-Contractor' : `Edit ${vendorFormData.name}`}
                </h3>
              </div>
              <button
                onClick={() => setShowVendorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-4 space-y-3 overflow-y-auto text-xs">
              {/* Name */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Vendor / Contractor Company Name *
                </label>
                <input
                  type="text"
                  value={vendorFormData.name}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                  placeholder="e.g. Sri Venkateswara ReadyMix Concrete"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Type & Trade Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Party Type *</label>
                  <select
                    value={vendorFormData.type}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Material Supplier">Material Supplier</option>
                    <option value="Sub-Contractor">Labour Sub-Contractor</option>
                    <option value="Equipment Rental">Equipment Rental / Machinery</option>
                    <option value="Service / Specialist">Service / Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Trade Category</label>
                  <select
                    value={vendorFormData.category}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cement & Aggregates">Cement & Aggregates</option>
                    <option value="Steel & TMT Fe550D">Steel & TMT Fe550D</option>
                    <option value="ReadyMix Concrete (RMC)">ReadyMix Concrete (RMC)</option>
                    <option value="Bricks & AAC Blocks">Bricks & AAC Blocks</option>
                    <option value="Electrical / MEP">Electrical / MEP</option>
                    <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                    <option value="Bar Bending & Centering">Bar Bending & Centering</option>
                    <option value="Flooring & Tiles">Flooring & Tiles</option>
                    <option value="Painting & Waterproofing">Painting & Waterproofing</option>
                    <option value="Hardware & Tools">Hardware & Tools</option>
                    <option value="General Supplies">General Supplies</option>
                  </select>
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={vendorFormData.contactPerson}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, contactPerson: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile / WhatsApp No *</label>
                  <input
                    type="tel"
                    value={vendorFormData.phone}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                    placeholder="e.g. +91 98450 12345"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* GSTIN & UPI ID */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">GSTIN (15-digit)</label>
                  <input
                    type="text"
                    value={vendorFormData.gstNumber}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    maxLength={15}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={vendorFormData.upiId}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, upiId: e.target.value.toLowerCase() })}
                    placeholder="e.g. venkateswara@okhdfcbank"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Yard / Address */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Office / Yard Address</label>
                <input
                  type="text"
                  value={vendorFormData.address}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                  placeholder="e.g. Plot 42, Whitefield Industrial Area, Bengaluru"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Opening Balance (Only for new vendor creation) */}
              {vendorModalMode === 'create' && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Opening Due Balance (₹)
                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                      (Amount already owed from prior records)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={vendorFormData.balance}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, balance: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vendorSubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  {vendorSubmitting ? 'Saving...' : vendorModalMode === 'create' ? 'Create Party' : 'Update Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manual Ledger Entry Modal */}
      {showEntryModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">
                  Record Transaction
                </h3>
                <p className="text-[11px] text-slate-400">
                  Party: <strong className="text-amber-400">{selectedVendor.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowEntryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
              {/* Entry Type Toggle: Debit vs Credit */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('Payment');
                    if (!description || description.includes('invoice')) {
                      setDescription(`Payment to ${selectedVendor.name}`);
                    }
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    entryType === 'Payment'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Payment (Debit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('Invoice');
                    if (!description || description.includes('Payment')) {
                      setDescription(`Materials / Work bill from ${selectedVendor.name}`);
                    }
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    entryType === 'Invoice'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Invoice (Credit)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">
                    Amount (₹) *
                  </label>
                  {Number(selectedVendor.balance) > 0 && entryType === 'Payment' && (
                    <button
                      type="button"
                      onClick={() => setAmount(selectedVendor.balance.toString())}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      Fill Full Due ({formatINR(selectedVendor.balance)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  min="1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                {amount && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 text-right">
                    Preview: {formatINR(amount)}
                  </div>
                )}
              </div>

              {/* Description / Note */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Description / Particulars *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Advance RTGS transfer via HDFC Bank"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Date & Payment Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Bank RTGS/NEFT">Bank RTGS/NEFT</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit / Invoice">Credit / Invoice</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Reference / Cheque / UTR / Bill No.
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UTR-908129031 or CHQ-4091"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={entrySubmitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  {entrySubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete {deleteConfirm.label}?
              {deleteConfirm.type === 'entry' && ' The vendor balance will be automatically recalculated.'}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
