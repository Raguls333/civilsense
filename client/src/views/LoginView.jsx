import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  HardHat, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  Briefcase, 
  Calculator, 
  Hammer, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';

export const LoginView = () => {
  const { requestOtp, verifyOtp, quickLogin, loading } = useAuth();

  // Auth flow states
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('9845012345');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('Owner');
  const [fullName, setFullName] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const demoAccounts = [
    {
      role: 'Owner',
      name: 'Rajesh Sharma',
      phone: '9845012345',
      company: 'Sharma & Sons Infra Buildcon',
      desc: 'Owner / Builder: Multi-project financials, supervisor assignments, live budget variance.',
      icon: Briefcase,
      color: 'from-amber-500 to-amber-600',
      badge: 'Full Owner Admin'
    },
    {
      role: 'Supervisor',
      name: 'Murugan Site Engg',
      phone: '9840156789',
      company: 'Site Engineer (Whitefield Site)',
      desc: 'Site Supervisor: 1-handed daily labour attendance, GPS photo check-ins, DPR logs.',
      icon: HardHat,
      color: 'from-blue-500 to-cyan-600',
      badge: 'Site Operations'
    },
    {
      role: 'Accountant',
      name: 'Priya Venkatesh',
      phone: '9900234567',
      company: 'Accounts & Compliance Dept',
      desc: 'Accountant: Vendor Cr/Dr ledgers, material stock, petty cash vouchers & GST RA billing.',
      icon: Calculator,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Finance & Ledgers'
    },
    {
      role: 'Contractor',
      name: 'Karthik Bar Bending',
      phone: '9789012345',
      company: 'Sri Karthik Steels & Fabrication',
      desc: 'Sub-Contractor: Daily trade labour rollups, site work verification, payment status.',
      icon: Hammer,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Sub-Contractor'
    }
  ];

  // Request OTP Handler
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setFeedback({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const fullPhone = cleanDigits.startsWith('91') ? `+${cleanDigits}` : `+91${cleanDigits}`;
      const res = await requestOtp(fullPhone);
      if (res.success) {
        setStep('otp');
        setFeedback({ 
          type: 'success', 
          text: `OTP sent successfully to ${fullPhone}! (Use demo code: 123456)` 
        });
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to send OTP. Please try again.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Connection error. Ensure backend server is running.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length < 4) {
      setFeedback({ type: 'error', text: 'Please enter the 6-digit OTP code (e.g. 123456).' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const cleanDigits = phone.replace(/\D/g, '');
      const fullPhone = cleanDigits.startsWith('91') ? `+${cleanDigits}` : `+91${cleanDigits}`;
      const res = await verifyOtp(fullPhone, otp, role, fullName);
      if (!res.success) {
        setFeedback({ type: 'error', text: res.error || 'Invalid OTP code. Try 123456.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Verification error. Please retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Tap Demo Switcher
  const handleQuickDemo = async (demo) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      await quickLogin(demo.role);
    } catch (err) {
      setFeedback({ type: 'error', text: 'Quick login failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/25 mb-1">
            <HardHat className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Civil<span className="text-amber-400">Sense</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Mobile-First Construction Management OS for Indian Contractors & Builders
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {step === 'phone' ? (
            /* Step 1: Phone Input */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Enter Mobile Number</span>
                  <span className="text-[10px] text-amber-400 font-mono">SMS Verification</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all">
                  <span className="px-3 py-2.5 bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center border-r border-slate-700">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98450 12345"
                    required
                    maxLength={10}
                    className="flex-1 bg-transparent px-3 py-2.5 text-white font-mono font-bold text-sm placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  We'll send a 6-digit OTP code to verify your site account.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                <span>{submitting ? 'Sending OTP...' : 'Get OTP & Continue'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Verifying Phone:</span>
                  <span className="font-mono font-bold text-white">+91 {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-amber-400 hover:underline text-[11px] font-bold"
                >
                  Change
                </button>
              </div>

              {/* Demo Helper Banner */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] flex items-center justify-between text-amber-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test OTP Code: <strong>123456</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]"
                >
                  Fill OTP
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center text-xl tracking-[0.4em] text-white font-mono font-black focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Role selection for new registrations */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Select Role (If Registering New User)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Owner">👑 Owner / Builder</option>
                  <option value="Supervisor">👷 Site Supervisor / Engineer</option>
                  <option value="Accountant">💼 Accountant / Billing</option>
                  <option value="Contractor">🔨 Labour Contractor</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Verifying...' : 'Verify & Enter'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Or 1-Tap Demo Access
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* 1-Tap Demo Role Cards */}
          <div className="space-y-2">
            {demoAccounts.map(acc => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  onClick={() => handleQuickDemo(acc)}
                  disabled={submitting}
                  className="w-full p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${acc.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                          {acc.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-900 text-amber-400 border border-slate-800">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {acc.company}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Trust JWT Auth
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Live Embedded Store
          </span>
        </div>
      </div>
    </div>
  );
};
