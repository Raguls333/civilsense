import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { playSound } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

export const BottomSheet = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      playSound('tap');
      triggerHaptic('light');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full sm:max-w-lg bg-cyber-900 border-t sm:border border-cyber-700/80 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-slideUp">
        {/* Pull Handle for touch devices */}
        <div className="pt-2.5 pb-1 flex items-center justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full cursor-pointer" onClick={onClose} />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-cyber-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white font-heading tracking-wide">
            {title}
          </h3>
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

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
