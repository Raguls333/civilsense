import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    playSound('tap');
    triggerHaptic('medium');
    if (!deferredPrompt) {
      alert('To install CivilSense on iOS: Tap Share ➔ "Add to Home Screen"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setInstalled(true);
      playSound('success');
    }
    setDeferredPrompt(null);
  };

  if (!showBanner || installed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-amber-600/90 text-slate-950 px-3 py-2 flex items-center justify-between text-xs font-semibold shadow-lg">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-slate-950 shrink-0" />
        <span>Install CivilSense Mobile App for fast offline field operation</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="bg-slate-950 text-amber-300 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow"
        >
          <Download className="w-3 h-3" />
          <span>INSTALL</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 hover:bg-black/10 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
