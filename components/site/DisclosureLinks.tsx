'use client';

import { useEffect } from 'react';

/** The element a URL fragment names, or null where it names none. */
function fragmentTarget(): HTMLElement | null {
  try {
    const id = decodeURIComponent(window.location.hash.slice(1));
    return id ? document.getElementById(id) : null;
  } catch {
    return null;
  }
}

/**
 * Opens the detail a link points at. A fragment that names a disclosure, or anything
 * inside one, opens it on load and whenever the fragment changes, so every detail can be
 * linked to. It renders nothing.
 */
export function DisclosureLinks() {
  useEffect(() => {
    const reveal = () => {
      const target = fragmentTarget();
      let opened = false;
      for (
        let details = target?.closest('details') ?? null;
        details;
        details = details.parentElement?.closest('details') ?? null
      ) {
        if (!details.open) {
          details.open = true;
          opened = true;
        }
      }
      if (opened) target?.scrollIntoView({ block: 'start' });
    };

    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);

  return null;
}
