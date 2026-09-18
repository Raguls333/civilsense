import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { getTranslation } from '../utils/i18n';
import { 
  HardHat, 
  Building2, 
  Globe, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  ChevronDown,
  Bell,
  Share2,
  LogOut,
  Database,
  Smartphone
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const Header = ({ 
  onOpenRoleSwitcher, 
  onOpenWhatsApp, 
  onOpenPublicPortal
}) => {
  const { user, activeProjectId, setActiveProjectId, lang, setLang, logout } = useAuth();
  const { isOnline, pendingCount, syncAll, isSyncing } = useOfflineSync();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('civilsense_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleLangChange = (newLang) => {
    playSound('switch');
    triggerHaptic('tap');
    setLang(newLang);
  };

  return (
    <header className="sticky top-0 z-30 bg-cyber-950/95 backdrop-blur-xl border-b border-cyber-800 text-slate-100 px-3 py-2 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Active Project Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-cyber-amber shrink-0">
            <HardHat className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg font-heading">
                Civil<span className="text-amber-400">Sense</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hidden xs:inline-block">
                MOBILE OS
              </span>
            </div>

            {/* Quick Project Dropdown */}
            {projects.length > 0 && (
              <div className="relative flex items-center">
                <select
                  value={activeProjectId}
                  onChange={(e) => {
                    playSound('tap');
                    triggerHaptic('light');
                    setActiveProjectId(e.target.value);
                  }}
                  className="bg-transparent text-xs text-slate-300 font-medium truncate pr-4 focus:outline-none focus:text-amber-300 cursor-pointer max-w-[160px] sm:max-w-[240px]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-cyber-900 text-slate-100">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-3" />
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Offline Sync Status & Manual Flush */}
          <div className="flex items-center">
            {pendingCount > 0 ? (
              <button
                onClick={() => {
                  playSound('tap');
                  triggerHaptic('medium');
                  syncAll();
                }}
                disabled={isSyncing || !isOnline}
                title="Pending offline entries waiting to sync"
                className="flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 px-2 py-1 rounded-full font-medium transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="font-mono">{pendingCount} queued</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-cyber-900 border border-cyber-800">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-mono text-[10px]">LIVE SYNC</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span className="text-rose-300 font-mono text-[10px]">OFFLINE</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Language Toggle (EN / हिंदी / தமிழ்) */}
          <div className="flex items-center bg-cyber-900 rounded-lg p-0.5 border border-cyber-800 text-xs">
            <button
              onClick={() => handleLangChange('en')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${lang === 'en' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => handleLangChange('hi')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${lang === 'hi' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              हिं
            </button>
            <button
              onClick={() => handleLangChange('ta')}
              className={`px-1.5 py-0.5 rounded font-medium transition-all ${lang === 'ta' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              தமி
            </button>
          </div>

          {/* Quick WhatsApp Simulator Button */}
          <button
            onClick={() => {
              playSound('tap');
              triggerHaptic('light');
              onOpenWhatsApp();
            }}
            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center"
            title="WhatsApp Notifications Hub"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Role Badge & Switcher Button */}
          <button
            onClick={() => {
              playSound('tap');
              triggerHaptic('medium');
              onOpenRoleSwitcher();
            }}
            className="flex items-center gap-1.5 text-xs bg-cyber-900 hover:bg-cyber-800 text-slate-200 border border-cyber-700/80 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all"
            title="Switch User Role"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-medium hidden sm:inline">{user?.name || 'Switch Role'}</span>
            <span className="text-[10px] uppercase font-bold text-amber-400 px-1 rounded bg-amber-400/10 font-mono">
              {user?.role || 'Guest'}
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              playSound('switch');
              triggerHaptic('medium');
              logout();
            }}
            className="p-1.5 rounded-lg bg-cyber-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-cyber-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
