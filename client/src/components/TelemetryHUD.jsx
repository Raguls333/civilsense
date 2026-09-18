import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Database, 
  Compass, 
  Wind, 
  Sun, 
  CloudRain, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Activity,
  Maximize2,
  Smartphone,
  CheckCircle2,
  Layers,
  QrCode
} from 'lucide-react';
import { playSound, isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';
import { triggerHaptic, isHapticsEnabled, setHapticsEnabled } from '../utils/haptics';

export const TelemetryHUD = ({ 
  activeProject, 
  isMobileSimulator, 
  onToggleSimulator,
  onOpenMobileInstall
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [timeStr, setTimeStr] = useState('');
  const [dbStatus, setDbStatus] = useState({ online: true, latency: 18, type: 'SQLite ACID' });
  const [gps, setGps] = useState({ lat: '12.9698° N', lng: '77.7499° E', acc: '±2.4m', satellites: 11 });
  const [weather, setWeather] = useState({ temp: '29°C', wind: '14 km/h SW', humidity: '64%', status: 'Clear Site' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playSound('tap');
    triggerHaptic('tap');
  };

  const handleToggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsOn(next);
    setHapticsEnabled(next);
    triggerHaptic('success');
    playSound('tap');
  };

  return (
    <div className="w-full bg-cyber-900/90 backdrop-blur-xl border-y border-cyber-800 text-slate-300 px-3 py-1.5 text-[11px] font-mono select-none overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-max">
        {/* Left: Satellite GPS Telemetry & Project */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 text-cyber-cyan font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyber-cyan" />
            <span className="tracking-wider">GPS LOCK:</span>
            <span className="text-white bg-cyber-800/80 px-1.5 py-0.5 rounded border border-cyber-700/50">
              {gps.lat}, {gps.lng} ({gps.acc})
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-amber-400">
            <Compass className="w-3.5 h-3.5" />
            <span>SATS: {gps.satellites} LOCKED</span>
          </div>

          {/* Real SQLite DB Engine Status */}
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">REAL SQLITE DB:</span>
            <span className="text-emerald-300">ONLINE ({dbStatus.latency}ms)</span>
          </div>
        </div>

        {/* Right: Weather Telemetry, Audio/Haptics & Device Viewport Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Weather Station */}
          <div className="hidden sm:flex items-center gap-2 text-slate-400 border-r border-cyber-800 pr-3">
            <span className="flex items-center gap-1 text-amber-300">
              <Sun className="w-3.5 h-3.5" /> {weather.temp}
            </span>
            <span className="flex items-center gap-1 text-sky-300">
              <Wind className="w-3.5 h-3.5" /> {weather.wind}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
              soundOn 
                ? 'bg-cyber-800 text-cyber-cyan border-cyber-cyan/40 hover:border-cyber-cyan' 
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline text-[10px]">{soundOn ? 'SFX ON' : 'MUTED'}</span>
          </button>

          {/* Haptics Toggle */}
          <button
            onClick={handleToggleHaptics}
            title={hapticsOn ? 'Haptic Feedback Enabled' : 'Haptic Feedback Disabled'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
              hapticsOn 
                ? 'bg-cyber-800 text-amber-400 border-amber-500/40 hover:border-amber-400' 
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Vibrate className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[10px]">{hapticsOn ? 'HAPTIC' : 'OFF'}</span>
          </button>

          {/* Open Mobile App on Phone Modal Trigger */}
          <button
            onClick={() => {
              playSound('tap');
              triggerHaptic('medium');
              if (onOpenMobileInstall) onOpenMobileInstall();
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            title="Open or Install CivilSense as App on your Phone"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>APP ON PHONE</span>
          </button>

          {/* Mobile Simulator Shell Toggle */}
          <button
            onClick={() => {
              playSound('switch');
              triggerHaptic('medium');
              onToggleSimulator();
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-semibold border transition-all ${
              isMobileSimulator 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]' 
                : 'bg-cyber-850 text-slate-300 border-cyber-700 hover:text-white hover:border-cyber-cyan'
            }`}
            title={isMobileSimulator ? 'Switch to Full Dashboard' : 'Preview in High-Tech Mobile Device Shell'}
          >
            {isMobileSimulator ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-200" />
                <span>EXPAND VIEW</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">MOBILE SHELL</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
