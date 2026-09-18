import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  BatteryMedium, 
  Signal, 
  Smartphone, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const MobileShellSimulator = ({ 
  children, 
  active, 
  onToggle 
}) => {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(88);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // If mobile shell is not active, render directly
  if (!active) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03060d] via-[#070d1a] to-[#040711] py-4 sm:py-8 px-2 flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Background Ambience Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-cyber-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Control Bar for Simulator */}
      <div className="z-20 mb-3 flex items-center gap-2 bg-cyber-900/90 backdrop-blur-xl border border-cyber-700/60 rounded-full px-4 py-1.5 shadow-xl text-xs font-mono">
        <div className="flex items-center gap-2 text-cyber-cyan">
          <Smartphone className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span className="font-bold text-white tracking-wide">TITANIUM MOBILE SHELL</span>
        </div>
        <div className="w-px h-4 bg-cyber-700 mx-1"></div>
        <button
          onClick={() => {
            playSound('tap');
            triggerHaptic('tap');
            onToggle();
          }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          title="Switch to full screen layout"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Exit Shell</span>
        </button>
      </div>

      {/* Photorealistic Smartphone Frame */}
      <div className="relative w-full max-w-[412px] h-[852px] bg-slate-950 titanium-frame flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(6,182,212,0.18)] z-10 select-none">
        
        {/* Antenna Band Lines on Bezel */}
        <div className="absolute -left-[10px] top-24 w-1 h-3 bg-slate-600 rounded-l"></div>
        <div className="absolute -right-[10px] top-24 w-1 h-3 bg-slate-600 rounded-r"></div>

        {/* Mobile Status Bar with Dynamic Island */}
        <div className="relative bg-cyber-950 text-white px-6 pt-3 pb-2 flex items-center justify-between z-30 shrink-0 select-none">
          {/* Status Clock */}
          <span className="text-xs font-bold font-mono tracking-tight pl-1">{time || '09:41'}</span>

          {/* High-Tech Dynamic Island Pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-black border border-slate-800/80 rounded-full h-7 w-28 flex items-center justify-between px-3 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60"></div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[9px] font-mono text-emerald-300">OS</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-950/80 border border-blue-600/40 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
            </div>
          </div>

          {/* Cellular, WiFi & Battery Indicators */}
          <div className="flex items-center gap-1.5 text-slate-300 pr-1">
            <Signal className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
            <span className="text-[10px] font-mono font-bold text-cyber-cyan">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono">{batteryLevel}%</span>
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="h-full bg-emerald-400 rounded-2xs" style={{ width: `${batteryLevel}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Inner Scrollable Screen Content */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-cyber-950 no-scrollbar flex flex-col">
          {children}
        </div>

        {/* Bottom Home Gesture Indicator */}
        <div className="bg-cyber-950 py-1.5 flex items-center justify-center z-30 shrink-0">
          <div className="w-32 h-1 bg-slate-500/80 rounded-full hover:bg-white transition-colors cursor-pointer" />
        </div>
      </div>
    </div>
  );
};
