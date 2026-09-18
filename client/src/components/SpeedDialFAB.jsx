import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Users, 
  ClipboardList, 
  DollarSign, 
  Package, 
  Zap 
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const SpeedDialFAB = ({ onSelectAction }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    playSound(open ? 'switch' : 'tap');
    triggerHaptic('medium');
    setOpen(!open);
  };

  const actions = [
    { id: 'attendance', label: 'Punch In', icon: Users, color: 'from-amber-500 to-amber-600', text: 'text-amber-300' },
    { id: 'dpr', label: 'Site DPR', icon: ClipboardList, color: 'from-cyan-500 to-blue-600', text: 'text-cyan-300' },
    { id: 'petty-cash', label: 'Petty Cash', icon: DollarSign, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-300' },
    { id: 'materials', label: 'Stock Inward', icon: Package, color: 'from-purple-500 to-indigo-600', text: 'text-purple-300' }
  ];

  const handleAction = (id) => {
    playSound('tap');
    triggerHaptic('tap');
    setOpen(false);
    if (onSelectAction) onSelectAction(id);
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-8 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Action Buttons */}
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2.5 animate-fadeIn">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => handleAction(act.id)}
                className="group flex items-center gap-2.5 bg-cyber-900/95 backdrop-blur-md border border-cyber-700/80 hover:border-cyber-cyan px-3.5 py-2 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <span className={`text-xs font-bold font-heading ${act.text} tracking-wide`}>
                  {act.label}
                </span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center text-slate-950 shadow-md`}>
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={toggle}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300 ${
          open 
            ? 'bg-rose-600 text-white rotate-45 scale-95 shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
            : 'bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 hover:scale-105 active:scale-95'
        }`}
        title="Quick Site Actions"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>
    </div>
  );
};
