/**
 * Haptic Feedback Engine for Align Trivia Arena
 * Powered by navigator.vibrate with sensible thresholds, debouncing, and pattern tuning.
 */

export type HapticPreset =
  | 'tap'        // 12ms ultra-light click for tabs, menu items, pills
  | 'selection'  // 24ms crisp tap for choosing category/difficulty/host
  | 'subtle'     // 8ms micro-tap for hover/focus transitions
  | 'success'    // [25, 35, 45] progressive affirmative pulse for correct answer / rank up
  | 'incorrect'  // [70, 40, 110] distinct, gentle double-thud for wrong answers without being jarring
  | 'warning'    // [45, 35, 45] countdown warning or lifeline alert
  | 'streak'     // [30, 25, 30, 25, 60] ascending rhythm for streaks & combo multipliers
  | 'jackpot'    // [40, 30, 50, 30, 70, 40, 100] celebration pulse for wheel / trophy unlocks
  | 'buzz';      // 80ms crisp vibration for time out or invalid actions

interface HapticsOptions {
  enabled?: boolean;
  minIntervalMs?: number;
}

// Global cooldown tracker to ensure haptics feel responsive without being overwhelming
let lastVibrateTime = 0;
const DEFAULT_COOLDOWN_MS = 60; // Max ~16 haptic pulses per second to prevent motor saturation

/**
 * Check if the current browser and hardware environment supports navigator.vibrate
 */
export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && typeof window.navigator.vibrate === 'function';
}

/**
 * Core utility to trigger tuned haptic feedback patterns
 */
export function triggerHaptic(preset: HapticPreset = 'tap', options?: HapticsOptions): boolean {
  if (!isHapticsSupported()) return false;

  // Respect user-level preference if provided
  if (options?.enabled === false) return false;

  const now = Date.now();
  const cooldown = options?.minIntervalMs ?? DEFAULT_COOLDOWN_MS;

  // Debounce rapid continuous inputs (e.g. fast scrolling or spamming buttons)
  if (now - lastVibrateTime < cooldown && preset === 'tap') {
    return false;
  }

  try {
    let pattern: number | number[];

    switch (preset) {
      case 'subtle':
        pattern = 8;
        break;
      case 'tap':
        pattern = 14;
        break;
      case 'selection':
        pattern = 24;
        break;
      case 'success':
        pattern = [25, 35, 45];
        break;
      case 'incorrect':
        // Tuned 2-stage buzz: first brief pulse + brief pause + resolving buzz
        pattern = [70, 45, 110];
        break;
      case 'warning':
        pattern = [45, 35, 45];
        break;
      case 'streak':
        pattern = [30, 25, 30, 25, 60];
        break;
      case 'jackpot':
        pattern = [40, 30, 50, 30, 70, 40, 100];
        break;
      case 'buzz':
        pattern = 80;
        break;
      default:
        pattern = 15;
    }

    const success = window.navigator.vibrate(pattern);
    if (success) {
      lastVibrateTime = now;
    }
    return success;
  } catch {
    return false;
  }
}

/**
 * Stop any active vibration immediately
 */
export function cancelHaptics(): void {
  if (isHapticsSupported()) {
    try {
      window.navigator.vibrate(0);
    } catch {}
  }
}
