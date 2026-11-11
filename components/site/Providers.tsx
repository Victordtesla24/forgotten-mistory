'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { useSyncExternalStore, type ReactNode } from 'react';

import { motionOff, subscribeToMotion } from '@/lib/motion';

/**
 * Motion for stateful interaction (menu, panel, filters). Features load lazily; the
 * reduced-motion preference and the site's own Motion control are honoured everywhere.
 */
export function Providers({ children }: { children: ReactNode }) {
  const off = useSyncExternalStore(subscribeToMotion, motionOff, () => false);
  return (
    <MotionConfig reducedMotion={off ? 'always' : 'user'}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
