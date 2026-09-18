import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  X, 
  Smartphone, 
  ShieldCheck, 
  Briefcase, 
  HardHat, 
  Calculator, 
  Hammer,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const RoleSwitcherModal = ({ isOpen, onClose }) => {
  const { user, quickLogin, requestOtp, verifyOtp, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' or 'otp'
  
  // OTP Form state
  const [phone, setPhone] = useState('+91 98450 12345');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Supervisor');
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const demoRoles = [
    {
      role: 'Owner',
      name: 'Rajesh Sharma',
      phone: '+91 98450 12345',
      company: 'Sharma & Sons Infra Buildcon',
      desc: 'Full multi-project dashboard, budget vs live cost, financial rollups, WhatsApp summaries.',
      icon: Briefcase,
      color: 'from-amber-500 to-amber-600',
      badge: 'All Projects Access'
    },
    {
      role: 'Supervisor',
      name: 'Murugan Site Engg',
      phone: '+91 98401 56789',
      company: 'Site Engineer (Whitefield)',
      desc: 'Mobile-heavy one-handed daily labour attendance, GPS check-in, DPR photo log, issue reporting.',
      icon: HardHat,
      color: 'from-blue-500 to-cyan-600',
      badge: 'Single Project Mobile Focus'
    },
    {
      role: 'Accountant',
      name: 'Priya Venkatesh',
      phone: '+91 99002 34567',
      company: 'Finance & Compliance Head',
      desc: 'Vendor & contractor ledgers, running Cr/Dr, material costs, petty cash, and GST RA Billing.',
      icon: Calculator,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Financial & Ledger Control'
    },
    {
      role: 'Contractor',
      name: 'Karthik Bar Bending',
      phone: '+91 97890 12345',
      company: 'Sri Karthik Steels & Fabrication',
      desc: 'Sub-contractor view: daily worker counts verified on site, running payment balance.',
      icon: Hammer,
      color: 'from-purple-500 to-indigo-600',
      badge: 'Vendor / Sub-Contractor View'
    }
  ];

  const handleQuickSwitch = async (role) => {
    await quickLogin(role);
    onClose();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    const cleanPhone = phone.replace(/\s+/g, '');
    const res = await requestOtp(cleanPhone);
    if (res.success) {
      setOtpSent(true);
      setMessage(`OTP sent to ${cleanPhone}. Demo code: 123456`);
    } else {
      setMessage(res.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s+/g, '');
    const res = await verifyOtp(cleanPhone, otp, selectedRole, userName);
    if (res.success) {
      onClose();
    } else {
      setMessage(res.error || 'Invalid OTP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select User Role & Identity</h3>
              <p className="text-xs text-slate-400">Test multi-role access control or sign in via OTP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: 1-Click Switcher vs Phone OTP */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'demo'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 1-Click Role Switcher (Instant Demo)
          </button>
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'otp'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📱 Phone OTP Login (India-First)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'demo' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400 mb-2">
                Click any role profile below to immediately switch context and experience CivilSense from that user's perspective:
              </p>

              {demoRoles.map(item => {
                const Icon = item.icon;
                const isCurrent = user?.role === item.role;

                return (
                  <button
                    key={item.role}
                    onClick={() => handleQuickSwitch(item.role)}
                    disabled={loading}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-slate-900 text-amber-400 border border-slate-700">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-300">{item.company}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/40">
                        <span className="text-[10px] text-amber-400/90 font-medium">
                          {item.badge}
                        </span>
                        {isCurrent ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[11px] text-slate-400 group-hover:text-white transition-colors">
                            Switch <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Log in or sign up with an Indian mobile number. A 6-digit OTP will be validated.
              </p>

              {message && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  {message}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mobile Number (India)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
                  >
                    Send OTP SMS
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    (Test simulated OTP will automatically be set to 123456)
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full tracking-widest text-center font-mono font-bold text-lg bg-slate-950 border border-slate-700 rounded-xl py-2.5 text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name (if new user)
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Ramesh Site Supervisor"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Supervisor">Site Supervisor</option>
                      <option value="Owner">Builder / Owner</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Contractor">Sub-Contractor</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all"
                    >
                      Verify & Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
