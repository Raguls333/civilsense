import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Share2, 
  X, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  MessageSquare,
  Building2,
  Users,
  CreditCard
} from 'lucide-react';

export const WhatsAppShareModal = ({ isOpen, onClose, defaultType = 'vendor_payment_reminder', defaultVendorId = null }) => {
  const { token, activeProjectId } = useAuth();
  const [type, setType] = useState(defaultType);
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState(defaultVendorId);
  const [payload, setPayload] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultType) setType(defaultType);
    if (defaultVendorId) setSelectedVendorId(defaultVendorId);
  }, [defaultType, defaultVendorId]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/ledger/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setVendors(data);
            if (!selectedVendorId && data.length > 0) {
              setSelectedVendorId(data[0].id);
            }
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  // Fetch formatted WhatsApp template
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/notifications/whatsapp-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type,
        vendorId: selectedVendorId,
        projectId: activeProjectId
      })
    })
      .then(res => res.json())
      .then(data => {
        setPayload(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, type, selectedVendorId, activeProjectId, token]);

  if (!isOpen) return null;

  const copyText = () => {
    if (payload?.messageText) {
      navigator.clipboard.writeText(payload.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">WhatsApp Notifications Hub</h3>
              <p className="text-xs text-slate-400">Native WhatsApp Cloud API & Click-to-Chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setType('vendor_payment_reminder')}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                type === 'vendor_payment_reminder'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Vendor Due</span>
            </button>
            <button
              onClick={() => setType('daily_attendance_summary')}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                type === 'daily_attendance_summary'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Labour Summary</span>
            </button>
            <button
              onClick={() => setType('client_progress_update')}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                type === 'client_progress_update'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Client Update</span>
            </button>
          </div>

          {/* Conditional Vendor picker */}
          {type === 'vendor_payment_reminder' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Select Vendor / Sub-Contractor:
              </label>
              <select
                value={selectedVendorId || ''}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} — Balance Due: ₹{(v.balance || 0).toLocaleString('en-IN')} ({v.phone})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Live WhatsApp Message Preview:
            </span>
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <Code2 className="w-3 h-3" />
              {showJson ? 'View Text Message' : 'View Cloud API JSON'}
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Generating formatted message...
            </div>
          ) : showJson ? (
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {JSON.stringify(payload?.cloudApiPayload, null, 2)}
            </pre>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-slate-200 text-xs whitespace-pre-wrap leading-relaxed relative font-sans shadow-inner">
              {payload?.messageText}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <button
            onClick={copyText}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Message
              </>
            )}
          </button>

          {payload?.waLink && (
            <a
              href={payload.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" /> Send via WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
