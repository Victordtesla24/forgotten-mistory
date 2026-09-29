'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { contact } from '@/app/data/siteContent';
import { MINIVIC_OPEN_EVENT } from '@/components/MiniVicBot';

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
const INTERNAL_NAV_LINKS = NAV_LINKS.filter((link) => link.href.startsWith('#')).map((link) => link.href);

// Longest a navigation-driven scroll may hold the current-section token.
const PENDING_ANCHOR_MS = 1500;
// Quiet period after the last scroll event that counts as "scroll settled".
const SCROLL_SETTLE_MS = 160;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

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
  const [activeHash, setActiveHash] = useState<string>('#hero');
  const prefersReducedMotion = useReducedMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const activeHashRef = useRef(activeHash);
  const pendingAnchorRef = useRef<{ hash: string; until: number } | null>(null);
  const lockToRef = useRef<((hash: string) => void) | null>(null);
  const internalHashes = useMemo(() => new Set<string>(INTERNAL_NAV_LINKS), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    activeHashRef.current = activeHash;
  }, [activeHash]);

  const setCurrentHash = useCallback((hash: string) => {
    if (activeHashRef.current === hash) return;
    activeHashRef.current = hash;
    setActiveHash(hash);
  }, []);

  const chooseVisibleHash = useCallback(() => {
    let bestHash = '#hero';
    let bestDistance = Number.POSITIVE_INFINITY;
    const targetLine = Math.min(window.innerHeight * 0.42, 220);

    for (const hash of INTERNAL_NAV_LINKS) {
      const section = document.getElementById(hash.slice(1));
      if (!section) continue;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      const distance = Math.abs(rect.top - targetLine);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestHash = hash;
      }
    }

    return bestHash;
  }, []);

  const replaceHash = useCallback((hash: string) => {
    if (window.location.hash === hash) return;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, []);

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

  // Transparent → frosted nav + current section. The scroll path mutates the
  // chrome imperatively and only enters React when the section token changes.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // The pending-anchor lock only exists so a navigation-driven scroll (anchor
    // click, Back/Forward restore) is not overwritten by the sections it passes
    // through on the way. It is released as soon as any of these is true:
    //  - the target section is the visible one (navigation landed);
    //  - the scroll has settled (no scroll event for SCROLL_SETTLE_MS) — whatever
    //    is visible then is where the reader actually is;
    //  - the reader shows scroll intent (wheel, touch, scroll keys, pointer);
    //  - the lock times out (a timer re-syncs, so no later scroll event is needed).
    // Previously only the first and last applied, and the timeout was never
    // re-evaluated: after Back, a manual scroll inside the 2.2s window left the
    // URL pinned to the history target (UX-P2-002: #skills instead of #listen).
    let settleTimer: number | undefined;
    let expiryTimer: number | undefined;

    const releasePending = () => {
      pendingAnchorRef.current = null;
      window.clearTimeout(expiryTimer);
    };

    const syncToVisible = () => {
      const visibleHash = chooseVisibleHash();
      setCurrentHash(visibleHash);
      replaceHash(visibleHash);
    };

    const update = () => {
      nav.setAttribute('data-scrolled', String(window.scrollY > 24));

      const pending = pendingAnchorRef.current;
      const visibleHash = chooseVisibleHash();
      if (pending) {
        if (visibleHash === pending.hash || performance.now() > pending.until) {
          releasePending();
        } else {
          setCurrentHash(pending.hash);
          return;
        }
      }

      setCurrentHash(visibleHash);
      replaceHash(visibleHash);
    };

    const onScroll = () => {
      update();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (!pendingAnchorRef.current) return;
        releasePending();
        syncToVisible();
      }, SCROLL_SETTLE_MS);
    };

    const onUserScrollIntent = (event: Event) => {
      if (!pendingAnchorRef.current) return;
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
      releasePending();
    };

    const syncToLocationHash = () => {
      const hash = window.location.hash;
      if (!internalHashes.has(hash)) return;
      setCurrentHash(hash);
      // Scroll restoration may already have landed on the target (the scroll
      // event can precede popstate); locking then would pin a stale hash.
      if (chooseVisibleHash() === hash) {
        releasePending();
        return;
      }
      lockTo(hash);
    };

    const lockTo = (hash: string) => {
      pendingAnchorRef.current = { hash, until: performance.now() + PENDING_ANCHOR_MS };
      window.clearTimeout(expiryTimer);
      expiryTimer = window.setTimeout(() => {
        if (pendingAnchorRef.current?.hash !== hash) return;
        releasePending();
        syncToVisible();
      }, PENDING_ANCHOR_MS + 50);
    };
    lockToRef.current = lockTo;

    syncToLocationHash();
    update();
    const intentEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', syncToLocationHash);
    window.addEventListener('popstate', syncToLocationHash);
    for (const type of intentEvents) window.addEventListener(type, onUserScrollIntent, { passive: true });
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(expiryTimer);
      lockToRef.current = null;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', syncToLocationHash);
      window.removeEventListener('popstate', syncToLocationHash);
      for (const type of intentEvents) window.removeEventListener(type, onUserScrollIntent);
    };
  }, [chooseVisibleHash, internalHashes, replaceHash, setCurrentHash]);

  const handleNavLinkClick = useCallback((href: string) => {
    if (internalHashes.has(href)) {
      setCurrentHash(href);
      lockToRef.current?.(href);
    }
    close();
  }, [close, internalHashes, setCurrentHash]);

  return (
    <nav ref={navRef}>
      {/* The second bypass block (WCAG 2.4.1; design council R-c8 item 13).
          The chatbot is the channel the brief names for employers and clients,
          and it was the 93rd of 100 tab stops — a keyboard reader had to
          traverse the entire page to reach it. Reordering the DOM would have
          put a floating widget ahead of the page's own content, so the skip
          pattern that already exists is extended instead: off-canvas until
          focused, first thing in the navigation, and it hands focus to the
          launcher with the panel open. */}
      <button
        type="button"
        className="skip-link minivic-skip"
        data-testid="minivic-skip"
        onClick={() => window.dispatchEvent(new Event(MINIVIC_OPEN_EVENT))}
      >
        Ask Mini Vic
      </button>
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
                aria-current={link.href === activeHash ? 'location' : undefined}
                data-active={link.href === activeHash ? 'true' : undefined}
                onClick={() => handleNavLinkClick(link.href)}
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
