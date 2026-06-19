'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

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

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

// Overlay drops in on a spring; its links stagger in once the panel is settling.
const OVERLAY_VARIANTS: Variants = {
  closed: { opacity: 0, y: '-100%', transition: { ...SPRING, when: 'afterChildren' } },
  open: { opacity: 1, y: 0, transition: { ...SPRING, when: 'beforeChildren', staggerChildren: 0.08, delayChildren: 0.12 } },
};
const LINK_VARIANTS: Variants = {
  closed: { opacity: 0, y: 26 },
  open: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Site navigation: a line-draw wordmark, a hamburger↔X morph toggle, and a
 * glassmorphism full-screen overlay whose links stagger in on a spring. Reuses the
 * existing `.nav-overlay.open` class marker (legacy + a11y selectors depend on it),
 * locks body scroll while open, removes the closed overlay from the tab order via
 * `inert`, and closes on Escape or link selection.
 */
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
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
        <svg className="logo-underline" viewBox="0 0 120 4" fill="none" aria-hidden="true" preserveAspectRatio="none">
          <motion.path
            d="M1 2 H119"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          />
        </svg>
      </a>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-nav-overlay"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="menu-toggle__label">{open ? 'Close' : 'Menu'}</span>
        <span className="menu-toggle__icon" aria-hidden="true">
          <motion.span className="menu-toggle__bar" animate={open ? { y: 0, rotate: 45 } : { y: -3.5, rotate: 0 }} transition={SPRING} />
          <motion.span className="menu-toggle__bar" animate={open ? { y: 0, rotate: -45 } : { y: 3.5, rotate: 0 }} transition={SPRING} />
        </span>
      </button>
      <motion.div
        ref={overlayRef}
        id="site-nav-overlay"
        className={`nav-overlay${open ? ' open' : ''}`}
        aria-hidden={!open}
        variants={OVERLAY_VARIANTS}
        initial={false}
        animate={open ? 'open' : 'closed'}
      >
        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <motion.a
                href={link.href}
                className="nav-link"
                onClick={close}
                variants={LINK_VARIANTS}
                {...('external' in link && link.external
                  ? { target: '_blank', rel: 'noreferrer' }
                  : {})}
              >
                {link.label}
              </motion.a>
            </li>
          ))}
        </ul>
      </motion.div>
    </nav>
  );
}
