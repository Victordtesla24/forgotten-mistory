'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { href: '#hero', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#architecture-lab', label: 'Architecture' },
  { href: '#work', label: 'Work' },
  { href: '/docs/Vik_Resume_Final.pdf', label: 'Resume', external: true },
  { href: '#contact', label: 'Contact' },
] as const;

/**
 * Site navigation: logo, menu toggle, and full-screen overlay. Reuses the
 * existing `.nav-overlay.open` CSS state. Locks body scroll while open and
 * closes on Escape or link selection.
 */
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Remove the closed overlay from the tab order + accessibility tree so its links
  // are not focusable while aria-hidden (fixes axe aria-hidden-focus — TC-NFR-A11Y).
  useEffect(() => {
    if (overlayRef.current) overlayRef.current.inert = !open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <nav>
      <a className="logo" href="#hero" aria-label="Back to top">
        VIKRAM.
      </a>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-nav-overlay"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      <div ref={overlayRef} id="site-nav-overlay" className={`nav-overlay${open ? ' open' : ''}`} aria-hidden={!open}>
        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="nav-link"
                onClick={close}
                {...('external' in link && link.external
                  ? { target: '_blank', rel: 'noreferrer' }
                  : {})}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
