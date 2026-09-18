import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Wifi, 
  Apple, 
  Play
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const MobileInstallModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Local network URL for mobile connection
  const hostIp = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? window.location.hostname 
    : '192.168.31.210';
  const mobileUrl = `http://${hostIp}:5173/`;

  // QR Code URL via public SVG QR generator API for 1-second camera scan
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(mobileUrl)}&bgcolor=0b1325&color=06b6d4&margin=10`;

  if (!isOpen) return null;

  const handleCopy = () => {
    playSound('tap');
    triggerHaptic('success');
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-cyber-900 border border-cyber-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="bg-cyber-950 px-5 py-3.5 border-b border-cyber-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Smartphone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                Install CivilSense on Mobile
              </h3>
              <p className="text-[10px] text-cyber-cyan font-mono">
                PROGRESSIVE WEB APP & NATIVE ANDROID
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              playSound('tap');
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-cyber-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh] no-scrollbar">
          
          {/* Method 1: Instant QR Code Camera Scan */}
          <div className="bg-cyber-950/80 border border-cyber-700/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 shadow-inner">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>Instant Scan (Camera / Google Lens)</span>
            </span>

            {/* QR Code Container */}
            <div className="p-2.5 bg-cyber-850 rounded-2xl border-2 border-cyber-cyan/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <img 
                src={qrCodeUrl} 
                alt="Scan to Open CivilSense on Mobile"
                className="w-40 h-40 rounded-xl"
              />
            </div>

            <p className="text-xs text-slate-300 max-w-xs">
              Point your phone's camera at this QR code to open the mobile application instantly over Wi-Fi.
            </p>

            {/* Mobile Network Link with Copy Button */}
            <div className="w-full flex items-center justify-between gap-2 bg-cyber-900 border border-cyber-700 rounded-xl px-3 py-2 text-xs font-mono">
              <span className="text-cyber-cyan truncate">{mobileUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] bg-cyber-800 hover:bg-cyber-700 text-slate-200 px-2.5 py-1 rounded-lg border border-cyber-600 shrink-0 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* 1-Tap Installation Instructions */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white font-heading flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>How to Install on Your Phone's Home Screen</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Android Instructions */}
              <div className="bg-cyber-950 p-3 rounded-xl border border-cyber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span>🤖 Android (Chrome)</span>
                </div>
                <ol className="text-[11px] text-slate-300 list-decimal list-inside space-y-1">
                  <li>Open the link in Chrome</li>
                  <li>Tap the banner <strong>"Install CivilSense"</strong></li>
                  <li>Or tap ⋮ menu ➔ <strong>"Add to Home Screen"</strong></li>
                </ol>
              </div>

              {/* iOS Instructions */}
              <div className="bg-cyber-950 p-3 rounded-xl border border-cyber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                  <span>🍏 iPhone (Safari)</span>
                </div>
                <ol className="text-[11px] text-slate-300 list-decimal list-inside space-y-1">
                  <li>Open the link in Safari</li>
                  <li>Tap the <strong>Share</strong> button (box with arrow)</li>
                  <li>Scroll down & tap <strong>"Add to Home Screen"</strong></li>
                </ol>
              </div>
            </div>
          </div>

          {/* Native Android APK Project Status */}
          <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/50 rounded-2xl p-3.5 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Capacitor Native Android Project Ready</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Full native Android Studio project generated in <code className="text-amber-300 font-mono">client/android</code>. You can run <code className="text-cyan-300 font-mono">npx cap open android</code> in the client folder to build a production APK anytime!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-cyber-950 px-5 py-3 border-t border-cyber-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Ensure phone is on same Wi-Fi</span>
          </div>
          <button
            onClick={() => {
              playSound('tap');
              onClose();
            }}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl font-heading"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
