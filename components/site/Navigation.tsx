'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { contact } from '@/app/data/siteContent';

/**
 * One entry per section that exists, in page order. Three of these used to point
 * at #architecture-lab, #work and #contact — sections deleted in the rebuild —
 * so the menu was quietly offering a recruiter three links that scrolled
 * nowhere. Anchors here must be kept in step with app/page.tsx; the navigation
 * test asserts every one of them resolves to a real element.
 */
const NAV_LINKS = [
  { href: '#hero', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  // Labelled from the sections themselves, not from the generic words a
  // portfolio template would use. A visitor who clicked "Work" arrived at a
  // section headed "What is keeping me busy" and had to re-orient; the menu now
  // says where it is actually sending them.
  { href: '#vitrine', label: 'Keeping me busy' },
  { href: '#listen', label: 'Feedback & coffee' },
  { href: contact.linkedin, label: 'LinkedIn', external: true },
  { href: '/docs/Vik_Resume_Final.pdf', label: 'Download CV', external: true },
] as const;

const CV_HREF = '/docs/Vik_Resume_Final.pdf';

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
  const navRef = useRef<HTMLElement>(null);

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

  // Focus management + trap (WCAG 2.4.3 / 2.1.2): when the overlay opens, move
  // focus into it and cycle Tab/Shift+Tab within its links so keyboard focus
  // never leaks to the (visually hidden) page behind the menu; on close, return
  // focus to the toggle that opened it.
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const toggle = navRef.current?.querySelector<HTMLElement>('.menu-toggle') ?? null;
    const focusable = () =>
      Array.from(overlay.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
        (el) => el.offsetParent !== null,
      );
    focusable()[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !overlay.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !overlay.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  // Transparent → frosted nav: flag data-scrolled once the page leaves the top.
  // Set imperatively via the ref so scrolling never triggers a React re-render.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.setAttribute('data-scrolled', String(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav ref={navRef}>
      <a className="logo" href="#hero" aria-label="Back to top">
        VIKRAM.
        <svg className="logo-underline" viewBox="0 0 120 4" fill="none" aria-hidden="true" preserveAspectRatio="none">
          <motion.path
            d="M1 2 H119"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            // `initial` must stay identical on the server and the client's first paint —
            // branching it on the raw useReducedMotion() hook (false during SSR, but
            // already resolved on a reduced-motion client's very first render) produced
            // a hard hydration mismatch ("Expected server HTML to contain a matching
            // <nav> in <body>", React #418/#423). Reduced motion is expressed via a
            // zero-duration transition instead, matching the Reveal.tsx convention.
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }
            }
          />
        </svg>
      </a>
      <div className="nav-actions">
        {/* D-CV-01 — always-visible Download CV, the strongest recruiter action,
            reachable without opening the overlay menu. */}
        <a className="nav-cv" href={CV_HREF} download target="_blank" rel="noreferrer">
          Download CV
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
      </div>
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
