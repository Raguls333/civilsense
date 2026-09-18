import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Scan, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  Clock, 
  AlertCircle,
  Zap,
  X
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const BiometricAttendanceScanner = ({ 
  isOpen, 
  onClose, 
  onVerified,
  contractorName = 'Direct Labour'
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceLocked, setFaceLocked] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [gpsStamp, setGpsStamp] = useState('12.9698° N, 77.7499° E (±2.1m)');

  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      setScanProgress(0);
      setFaceLocked(false);
      setVerificationDone(false);
      setTimestamp(new Date().toLocaleTimeString('en-IN', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100));

      playSound('scan');
      triggerHaptic('scan');

      // Laser scan simulation timeline
      const timer1 = setTimeout(() => {
        setFaceLocked(true);
        playSound('tap');
        triggerHaptic('medium');
      }, 900);

      const timer2 = setTimeout(() => {
        setScanning(false);
        setVerificationDone(true);
        playSound('success');
        triggerHaptic('success');
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    playSound('tap');
    triggerHaptic('tap');
    if (onVerified) {
      onVerified({
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=400&auto=format&fit=crop&q=80',
        verified: true,
        gps: gpsStamp,
        timestamp: new Date().toISOString()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="relative w-full max-w-sm bg-cyber-900 border border-cyber-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="bg-cyber-950 px-4 py-3 border-b border-cyber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyber-cyan animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white font-heading">AI Biometric Site Scanner</h3>
              <p className="text-[10px] text-slate-400 font-mono">FACIAL & GEOFENCE VERIFICATION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-cyber-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full h-72 bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Simulated Construction Site Camera Feed */}
          <img
            src="https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80"
            alt="Site Camera Feed"
            className="absolute inset-0 w-full h-full object-cover opacity-60 filter contrast-110"
          />

          {/* High-Tech Scanline Effect */}
          {scanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-laser-scan z-20" />
          )}

          {/* Grid Overlay */}
          <div className="absolute inset-0 cyber-grid-cyan opacity-40 pointer-events-none z-10" />

          {/* Viewfinder Target Reticle */}
          <div className={`relative w-48 h-48 border transition-all duration-500 rounded-2xl flex items-center justify-center z-20 ${
            faceLocked 
              ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-105' 
              : 'border-cyber-cyan/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          }`}>
            {/* Corner Brackets */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

            {/* Target Face Frame */}
            <div className={`w-32 h-40 border-2 rounded-xl transition-all duration-300 flex flex-col items-center justify-between p-2 ${
              faceLocked 
                ? 'border-emerald-400 bg-emerald-500/10' 
                : 'border-dashed border-cyan-400/50'
            }`}>
              <div className="text-[10px] font-mono text-cyan-300 bg-cyber-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                {faceLocked ? 'LOCK: 98.4%' : 'SCANNING...'}
              </div>
              
              {verificationDone && (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
              )}

              <div className="text-[9px] font-mono text-slate-300">
                {contractorName}
              </div>
            </div>
          </div>

          {/* HUD Live Geotag Stamp Over Camera */}
          <div className="absolute bottom-2 left-2 right-2 bg-cyber-950/85 backdrop-blur-sm border border-cyber-700/60 rounded-xl px-2.5 py-1 text-[10px] font-mono text-slate-300 flex items-center justify-between z-20">
            <div className="flex items-center gap-1 text-cyber-cyan truncate">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{gpsStamp}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="p-4 bg-cyber-950 space-y-3">
          {verificationDone ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/60">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Biometric & GPS Location Validated inside site geofence radius.</span>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold font-heading rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>ATTACH VERIFIED PUNCH-IN</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-cyber-cyan" />
                <span>Acquiring satellite lock & face vectors...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
