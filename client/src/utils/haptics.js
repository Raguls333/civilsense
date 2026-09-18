/**
 * High-Tech Mobile Haptic Feedback Engine
 * Leverages the HTML5 Vibration API for tactile feedback on mobile devices
 */

let hapticsEnabled = true;

export const setHapticsEnabled = (enabled) => {
  hapticsEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('civilsense_haptics', enabled ? 'true' : 'false');
  }
};

export const isHapticsEnabled = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('civilsense_haptics');
    if (saved !== null) return saved === 'true';
  }
  return hapticsEnabled;
};

export const triggerHaptic = (type = 'tap') => {
  if (!isHapticsEnabled()) return;
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'tap':
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate([40, 30, 40]);
        break;
      case 'success':
        // Double pulse for confirmation
        navigator.vibrate([15, 60, 20]);
        break;
      case 'scan':
        // Laser sweep pulse
        navigator.vibrate([8, 30, 12, 30, 20]);
        break;
      case 'error':
      case 'warning':
        // Triple buzz alert
        navigator.vibrate([60, 40, 60, 40, 60]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (e) {
    // Non-blocking fallback
  }
};
