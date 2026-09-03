'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Mail, Phone } from 'lucide-react';

import ErrorBoundary from '@/components/ErrorBoundary';
import Hero from '@/components/sections/Hero/Hero';
import About from '@/components/sections/About/About';
import Experience from '@/components/sections/Experience/Experience';
import Skills from '@/components/sections/Skills/Skills';
import Vitrine from '@/components/sections/Vitrine/Vitrine';
const SpaceScene = dynamic(() => import('./components/SpaceScene'), { ssr: false });
import CursorGlow from '@/components/site/CursorGlow';
import CardDepth from '@/components/site/CardDepth';
import SectionBeats from '@/components/site/SectionBeats';
import Navigation from '@/components/site/Navigation';
import Reveal from '@/components/site/Reveal';
import ArchitectureMap from '@/components/site/ArchitectureMap';
import ProjectsCarousel from '@/components/site/ProjectsCarousel';
import GithubFeed from '@/components/site/GithubFeed';
import LiteYouTube from '@/components/site/LiteYouTube';
import HiddenTerminal from '@/components/site/HiddenTerminal';
import ScrollRail from '@/components/site/ScrollRail';
import InViewGate from '@/components/site/InViewGate';
import ProofScroll from '@/components/site/ProofScroll';
import WorkScroll from '@/components/site/WorkScroll';
import CatalogueScroll from '@/components/site/CatalogueScroll';
import ContactScroll from '@/components/site/ContactScroll';
import HudFrame from '@/components/fx/HudFrame';
import SprintBurndown from '@/components/fx/SprintBurndown';
import TokenReflow from '@/components/fx/TokenReflow';
import AtoEvidenceBar from '@/components/fx/AtoEvidenceBar';
// R3F Canvas components loaded via next/dynamic for code-splitting (FR-CODE-SPLIT).
// WebGL contexts are never needed on the server; ssr:false avoids hydration mismatches.
const CelestialSphere = dynamic(() => import('@/components/fx/CelestialSphere'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});
const OrchestrationGraph = dynamic(() => import('@/components/fx/OrchestrationGraph'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});
const PacketFlowGraph = dynamic(() => import('@/components/fx/PacketFlowGraph'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});
// R2 skill visualizations — compact R3F scenes for the #skills section.
// Each renders a unique monochrome micro-visualization bound to a skill group
// per SPEC §9.3 (one dedicated effect per tangible skill domain).
import ClearanceStepper from '@/components/fx/ClearanceStepper';
import InboxTriage from '@/components/fx/InboxTriage';
import JourneyTimeline from '@/components/fx/JourneyTimeline';
import TokenStreamMatch from '@/components/fx/TokenStreamMatch';
import AstroChartSphere from '@/components/fx/AstroChartSphere';
import JarvisRepairLoop from '@/components/fx/JarvisRepairLoop';
import ImageEnhancer from '@/components/fx/ImageEnhancer';
import KeySigningPulse from '@/components/fx/KeySigningPulse';
import EventSeatShimmer from '@/components/fx/EventSeatShimmer';
import TeslaDashboard from '@/components/fx/TeslaDashboard';
import ProofBar from '@/components/site/ProofBar';
import MindsetProjection from '@/components/site/MindsetProjection';
import Dossier from '@/components/site/Dossier';
import CursorDepthField from '@/components/site/CursorDepthField';

import {
  contact,
  credibility,
  featuredRepos,
  hero,
  proof,
  projects,
} from './data/siteContent';

// FR-CONTACT: booking CTA — owner can set NEXT_PUBLIC_BOOKING_URL to a Calendly/Cal.com
// link; falls back to a structured mailto so the path always works. Plus in-section CV.
const BOOKING_HREF =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  `mailto:${contact.email}?subject=${encodeURIComponent('Conversation request — portfolio')}`;
const CV_HREF = '/docs/Vik_Resume_Final.pdf';


// Entrance is triggered by the preloader handoff (`fm:page-ready`), not a fixed
// delay — so `delayChildren` is just a short beat after the wipe starts.

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  // `page-ready` used to be the preloader's handoff. The preloader is gone — the
  // hero is server-rendered and reveals itself in CSS — so the page raises the
  // signal itself on the frame after mount. Everything downstream (the remaining
  // sections' entrance, the deferred starfield) keeps its existing contract.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.classList.add('page-ready');
      window.dispatchEvent(new Event('fm:page-ready'));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Hero entrance is choreographed to the preloader handoff. `initial="hidden"`
  // stays identical on the server and first client paint (no hydration branch);
  // the entrance plays the moment the boot wipe begins (`fm:page-ready`), which
  // also covers the Skip-intro path. A safety timeout guarantees the hero is
  // never left hidden if the signal is somehow missed.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body.classList.contains('page-ready')) {
      setRevealed(true);
      return;
    }
    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setRevealed(true);
    };
    window.addEventListener('fm:page-ready', reveal);
    const fallback = window.setTimeout(reveal, 2600);
    return () => {
      window.removeEventListener('fm:page-ready', reveal);
      window.clearTimeout(fallback);
    };
  }, []);

  // Defer the heavy WebGL starfield off the critical load path: mount SpaceScene only
  // once the boot/hero-reveal sequence has actually settled, so its shader compile +
  // per-frame star loop never counts against LCP/TBT (Lighthouse perf gate). The
  // static .cosmic-backdrop CSS is the immediate background; the starfield fades in
  // after.
  //
  // Measured root cause (2026-07): arming this on raw `load` (as before) fires almost
  // immediately on a static prerendered page — well BEFORE the preloader's boot wipe
  // (~1.9 s) and the hero's own framer-motion reveal transition (~0.6 s) have painted.
  // SpaceScene's mount (WebGL context + shader compile + 4.5k-star buffer init) is a
  // long, uninterruptible main-thread task; when it lands inside that ~1.9-2.6 s
  // window it blocks the hero's pending opacity commit until it finishes, pushing the
  // REAL largest-contentful-paint from ~1.9 s to ~4.6 s and registering as Lighthouse
  // NO_LCP. Arming on `fm:page-ready` (the preloader's own reveal signal, covering the
  // Skip-intro path too) instead of `load` guarantees SpaceScene never contends with
  // the hero's critical paint.
  const [heavyReady, setHeavyReady] = useState(false);
  useEffect(() => {
    let idleId: number | undefined;
    let settled = false;
    const arm = () => {
      if (settled) return;
      settled = true;
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => setHeavyReady(true), { timeout: 2500 });
      } else {
        idleId = window.setTimeout(() => setHeavyReady(true), 300);
      }
    };
    if (typeof document !== 'undefined' && document.body.classList.contains('page-ready')) {
      arm();
    } else {
      window.addEventListener('fm:page-ready', arm, { once: true });
    }
    // Safety net: never wait forever if the preloader's event is somehow missed
    // (matches the `revealed` fallback above).
    const fallback = window.setTimeout(arm, 4000);
    return () => {
      window.removeEventListener('fm:page-ready', arm);
      window.clearTimeout(fallback);
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        else window.clearTimeout(idleId);
      }
    };
  }, []);


  // Whole-document progress drives the slim reading indicator pinned to the top edge.
  const { scrollYProgress: pageProgress } = useScroll();



  return (
    <>
      <motion.div
        className="scroll-progress"
        data-scroll-progress
        aria-hidden="true"
        style={{ scaleX: pageProgress }}
      />
      <CursorGlow />
      <CardDepth />
      <SectionBeats />

      <div className="scene-stack" aria-hidden="true">
        {heavyReady && <SpaceScene />}
        <div className="cosmic-backdrop" />
      </div>

      {/* Decorative volumetric WebGL layer — not needed for first paint; deferred
          behind the same heavyReady gate as SpaceScene so its Canvas/shader init
          never competes with the hero's critical LCP paint (see heavyReady above). */}
      {heavyReady && <CursorDepthField />}


      <Navigation />

      <main>
        <Hero />

        {/* D-TRUST-01 — scannable credibility band: recognised employers + CSM + degrees,
            sourced from the roles in siteContent. Establishes pedigree near the top. */}
        <aside className="credibility-band" aria-label="Career credibility">
          <div className="container credibility-inner">
            <span className="credibility-label">{credibility.label}</span>
            <ul className="credibility-employers">
              {credibility.employers.map((e) => (
                <li key={e} data-employer>
                  {e}
                </li>
              ))}
            </ul>
            <ul className="credibility-creds">
              {credibility.credentials.map((c) => (
                <li key={c} className="credibility-cred">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <ProofBar />

        {/* T2 — ProofScroll: GSAP onEnter cue anchor */}
        <ProofScroll />

        <About />

        <Experience />

        <Skills />

        <Vitrine />
      </main>

      <footer role="contentinfo">
        <div className="footer-content">
          {/* Fixed year avoids SSR/CSR Date drift hydration warnings (D-CRASH-01). */}
          <p>&copy; 2026 Vikram Deshpande. All rights reserved.</p>
          <HiddenTerminal />
        </div>
      </footer>
    </>
  );
}
