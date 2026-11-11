'use client';

import { useEffect } from 'react';

/**
 * Loads what makes the Work section answer (`behaviour.ts`) once the page is up and sets it up on the
 * section. It renders nothing; the cards and panels are the server's, complete without it.
 */
export function WorkBehaviour() {
  useEffect(() => {
    const section = document.getElementById('work');
    if (!section) return undefined;
    let live = true;
    let detach = (): void => undefined;
    void import('./behaviour').then(({ attach }) => {
      if (live) detach = attach(section);
    });
    return () => {
      live = false;
      detach();
    };
  }, []);

  return null;
}
