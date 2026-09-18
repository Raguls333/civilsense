import React from 'react';
import { 
  Building2, 
  Users, 
  ClipboardList, 
  BookOpen, 
  PieChart, 
  Layers
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const BottomNav = ({ activeTab, setActiveTab }) => {
  const { lang } = useAuth();

  const tabs = [
    { id: 'projects', label: getTranslation(lang, 'projects'), icon: Building2 },
    { id: 'attendance', label: getTranslation(lang, 'attendance'), icon: Users, highlight: true },
    { id: 'dpr', label: getTranslation(lang, 'dpr'), icon: ClipboardList },
    { id: 'ledger', label: getTranslation(lang, 'ledger'), icon: BookOpen },
    { id: 'cost', label: getTranslation(lang, 'costSummary'), icon: PieChart },
    { id: 'more', label: 'More', icon: Layers }
  ];

  const handleTabClick = (tabId) => {
    playSound('tap');
    triggerHaptic('tap');
    setActiveTab(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-cyber-950/95 backdrop-blur-xl border-t border-cyber-800 text-slate-400 no-print safe-area-pb shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto sm:max-w-xl flex items-center justify-around px-1 py-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[54px] min-h-[46px] rounded-xl transition-all ${
                isActive 
                  ? 'text-amber-400 font-bold scale-105 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5] scale-110 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'stroke-[1.8]'}`} />
                {tab.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-cyber-950 animate-pulse"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight truncate max-w-[62px] font-sans">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
