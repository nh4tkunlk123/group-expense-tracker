export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export const triggerHaptic = (type: HapticType = 'light') => {
  if (!navigator || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([10, 30, 20]);
        break;
      case 'error':
        navigator.vibrate([20, 40, 20, 40, 30]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch (e) {
    // Ignore if vibration fails or is unsupported
  }
};
