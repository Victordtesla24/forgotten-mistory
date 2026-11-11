'use client';

import { useSyncExternalStore } from 'react';

import { motionOff, setMotionOff, subscribeToMotion } from '@/lib/motion';

/**
 * The footer's Motion on/off control. It turns the site's own motion off (entrances, the
 * field in the hero, panel transitions) and remembers the choice in this browser. It
 * stands apart from the system's reduced-motion preference, which is always honoured.
 */
export function MotionToggle({ className }: { className?: string }) {
  const off = useSyncExternalStore(subscribeToMotion, motionOff, () => false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!off}
      onClick={() => setMotionOff(!off)}
      className={className}
    >
      Motion {off ? 'off' : 'on'}
    </button>
  );
}
