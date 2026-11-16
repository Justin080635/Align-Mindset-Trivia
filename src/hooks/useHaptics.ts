import { useCallback, useMemo } from 'react';
import { triggerHaptic, isHapticsSupported, cancelHaptics, HapticPreset } from '../utils/haptics';

interface UseHapticsOptions {
  enabled?: boolean;
}

/**
 * Custom React Hook for triggering haptic feedback on touch & mobile devices.
 * 
 * Provides calibrated presets:
 * - `trigger('tap')`: for navigation, tabs, dialog buttons
 * - `trigger('incorrect')`: for wrong answers with a dual-pulse pattern
 * - `trigger('success')`: for correct answers
 * - `trigger('selection')`: for choosing topics/options
 * - `trigger('streak')` / `trigger('jackpot')`: for rewards & milestones
 */
export function useHaptics(options?: UseHapticsOptions) {
  const isSupported = useMemo(() => isHapticsSupported(), []);
  const isEnabled = options?.enabled ?? true;

  const trigger = useCallback(
    (preset: HapticPreset = 'tap') => {
      if (!isEnabled || !isSupported) return false;
      return triggerHaptic(preset, { enabled: isEnabled });
    },
    [isEnabled, isSupported]
  );

  const triggerIncorrect = useCallback(() => {
    return trigger('incorrect');
  }, [trigger]);

  const triggerSuccess = useCallback(() => {
    return trigger('success');
  }, [trigger]);

  const triggerNavTap = useCallback(() => {
    return trigger('tap');
  }, [trigger]);

  const triggerSelection = useCallback(() => {
    return trigger('selection');
  }, [trigger]);

  const cancel = useCallback(() => {
    cancelHaptics();
  }, []);

  return {
    isSupported,
    trigger,
    triggerIncorrect,
    triggerSuccess,
    triggerNavTap,
    triggerSelection,
    cancel
  };
}
