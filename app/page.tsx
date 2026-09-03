'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Crown,
  GitBranch,
  GraduationCap,
  Mail,
  Phone,
} from 'lucide-react';

import ErrorBoundary from '@/components/ErrorBoundary';
import Hero from '@/components/sections/Hero/Hero';
import About from '@/components/sections/About/About';
import Experience from '@/components/sections/Experience/Experience';
const SpaceScene = dynamic(() => import('./components/SpaceScene'), { ssr: false });
import CursorGlow from '@/components/site/CursorGlow';
import CardDepth from '@/components/site/CardDepth';
import SectionBeats from '@/components/site/SectionBeats';
import Navigation from '@/components/site/Navigation';
import Reveal from '@/components/site/Reveal';
import ExpandableCard from '@/components/site/ExpandableCard';
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
import SkillsScroll from '@/components/site/SkillsScroll';
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
const SkillVizAI = dynamic(() => import('@/components/fx/SkillVizAI'), {
  loading: () => <div className="skill-viz-placeholder" />,
  ssr: false,
});
const SkillVizEngineering = dynamic(() => import('@/components/fx/SkillVizEngineering'), {
  loading: () => <div className="skill-viz-placeholder" />,
  ssr: false,
});
const SkillVizLeadership = dynamic(() => import('@/components/fx/SkillVizLeadership'), {
  loading: () => <div className="skill-viz-placeholder" />,
  ssr: false,
});
const SkillVizCertifications = dynamic(() => import('@/components/fx/SkillVizCertifications'), {
  loading: () => <div className="skill-viz-placeholder" />,
  ssr: false,
});
const SkillVizEducation = dynamic(() => import('@/components/fx/SkillVizEducation'), {
  loading: () => <div className="skill-viz-placeholder" />,
  ssr: false,
});
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
  skillGroups,
} from './data/siteContent';

// FR-CONTACT: booking CTA — owner can set NEXT_PUBLIC_BOOKING_URL to a Calendly/Cal.com
// link; falls back to a structured mailto so the path always works. Plus in-section CV.
const BOOKING_HREF =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  `mailto:${contact.email}?subject=${encodeURIComponent('Conversation request — portfolio')}`;
const CV_HREF = '/docs/Vik_Resume_Final.pdf';


const SKILL_ICONS = {
  brain: Brain,
  gitBranch: GitBranch,
  crown: Crown,
  badgeCheck: BadgeCheck,
  graduationCap: GraduationCap,
} as const;

const SKILL_VIZ_MAP: Record<string, React.ComponentType> = {
  'ai-ml': SkillVizAI,
  'engineering': SkillVizEngineering,
  'leadership': SkillVizLeadership,
  'certifications': SkillVizCertifications,
  'education': SkillVizEducation,
};

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
            all sourced from `experience`/`skillGroups`. Establishes pedigree near the top. */}
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

        <section id="skills" className="skills-section beat">
          {/* T6 — SkillsScroll: GSAP ScrollTrigger enter stagger, per-skill micro-viz cue */}
          <SkillsScroll />
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Skills &amp; Certifications</h2>
            </Reveal>
            <div className="skills-grid">
              {skillGroups.map((group, index) => {
                const Icon = SKILL_ICONS[group.icon];
                const Viz = SKILL_VIZ_MAP[group.id];
                return (
                  <div key={group.id} className="skill-card-wrapper" style={{ opacity: 0 }}>
                    <Reveal delay={index * 0.06}>
                    <ExpandableCard
                      baseClass="skill-card"
                      headerClass="skill-header"
                      bodyClass="skill-body"
                      header={
                        <>
                          <div className="skill-title">
                            <span className="skill-icon">
                              <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                            </span>
                            <div>
                              <p className="skill-kicker">{group.kicker}</p>
                              <h3 className="skill-name">{group.name}</h3>
                            </div>
                          </div>
                          <span className="skill-chevron" aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                          </span>
                        </>
                      }
                    >
                      <div className="skill-content-layout">
                        <ul className="skill-list">
                          {group.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        {Viz && (
                          <div className="skill-viz-wrapper">
                            <Viz />
                          </div>
                        )}
                      </div>
                    </ExpandableCard>
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="architecture-lab"
          className="architecture-section beat"
          aria-labelledby="architecture-title"
        >
          <div className="container">
            <Reveal className="section-header architecture-section-header">
              <p className="architecture-section-kicker">System topology / reference pathways</p>
              <div className="architecture-section-title-row">
                <div>
                  <h2 id="architecture-title" className="section-title">
                    Interactive Architecture Map
                  </h2>
                  <p className="section-subhead">
                    Trace how requests move from edge clients to Gemini, telemetry, and governance.
                  </p>
                </div>
                <ul className="architecture-section-facts" aria-label="Architecture map features">
                  <li>
                    <strong>03</strong>
                    <span>Traceable routes</span>
                  </li>
                  <li>
                    <strong>06</strong>
                    <span>Inspectable nodes</span>
                  </li>
                  <li>
                    <strong>AA</strong>
                    <span>Keyboard ready</span>
                  </li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ArchitectureMap />
            </Reveal>
          </div>
        </section>

        <section id="work" className="work-section beat">
          {/* T4 + T5 — WorkScroll (per-scene pin sequential) + CatalogueScroll (vertical→horizontal) */}
          <ScrollRail targetId="work" label="Work" />
          <WorkScroll />
          <CatalogueScroll />
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Current Projects in the Pipeline</h2>
              <p className="section-subhead work-section-lede">
                Flagship builds with live signature effects — drag or scroll the catalogue.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <ProjectsCarousel projects={projects} />
            </Reveal>

            <Reveal delay={0.12}>
              <div className="section-subhead vfx-gallery-label">Signature effects — live</div>
              <InViewGate className="vfx-gallery" rootMargin="600px" minHeight="480px">
                <SprintBurndown project="EFDDH-Jira-Analytics-Dashboard" />
                <TokenStreamMatch project="tailor-resume-with-ai" />
                <TokenReflow project="Advanced-Prompt-Creator" />
                <JourneyTimeline project="relationship-timeline-feature" />
                <InboxTriage project="AI-Gmail-Mailbox-Manager" />
                <ErrorBoundary>
                  <CelestialSphere project="btr-demo" />
                </ErrorBoundary>
                <ErrorBoundary>
                  <AstroChartSphere project="jyotish-shastra" />
                </ErrorBoundary>
                <ErrorBoundary>
                  <OrchestrationGraph project="ralph-loop-infinite" />
                </ErrorBoundary>
                <ErrorBoundary>
                  <PacketFlowGraph project="telemetry-cluster" />
                </ErrorBoundary>
                <JarvisRepairLoop project="Error-Management-System" />
                <AtoEvidenceBar project="cobol-testing-ato-work" />
                <ClearanceStepper project="clearance" />
                <ImageEnhancer project="image-enhancer" />
                <KeySigningPulse project="public-key-server" />
                <EventSeatShimmer project="abentertainment" />
                <TeslaDashboard project="telemetry-server" />
              </InViewGate>
            </Reveal>

            <div className="live-content">
              <Reveal className="github-feed">
                <div className="section-subhead">Latest GitHub work</div>
                <GithubFeed />
                <div className="repo-curated">
                  <div className="section-subhead">Featured repos</div>
                  <ul>
                    {featuredRepos.map((repo) => (
                      <li key={repo.name}>
                        <a href={repo.href} target="_blank" rel="noreferrer">
                          {repo.name}
                        </a>{' '}
                        — {repo.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal className="video-feed" delay={0.1}>
                <div className="section-subhead">YouTube stream</div>
                <div className="video-frame">
                  <LiteYouTube playlistId="UUJSYpoFkGKKzYTKzAr8vGzQ" title="Vicd0ct YouTube uploads" />
                </div>
                <p className="video-note">
                  Latest drops from @vicd0ct. Live coding, algorithm archaeology, telemetry breakdowns.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <MindsetProjection />

        <Dossier />

        <section id="contact" className="contact-section beat">
          {/* T7 — ContactScroll: GSAP enter reveals + magnetic CTA */}
          <ContactScroll />
          <div className="container">
            <div className="contact-wrapper">
              <Reveal>
                <h2 className="contact-title">{contact.headline}</h2>
              </Reveal>
              <Reveal className="contact-cta-row" delay={0.04}>
                <a
                  href={BOOKING_HREF}
                  className="btn-primary contact-cta"
                  {...(BOOKING_HREF.startsWith('http')
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                >
                  Book a conversation
                </a>
                <a
                  href={CV_HREF}
                  className="btn-link contact-cta"
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  Download CV
                </a>
              </Reveal>
              <Reveal className="contact-links-grid" delay={0.08}>
                <a
                  href={`mailto:${contact.email}`}
                  className="contact-card"
                  aria-label={`Email ${contact.email}`}
                  title={`Email ${contact.email}`}
                >
                  <Mail className="contact-card-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span className="contact-card-label">Email</span>
                  <span className="contact-card-value">{contact.email}</span>
                </a>
                <a
                  href={contact.phoneHref}
                  className="contact-card"
                  aria-label={`Call ${contact.phone}`}
                  title={`Call ${contact.phone}`}
                >
                  <Phone className="contact-card-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
                  <span className="contact-card-label">Call</span>
                  <span className="contact-card-value">{contact.phone}</span>
                </a>
              </Reveal>
              <Reveal className="social-links-large" delay={0.16}>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn"
                  data-cursor-label="LinkedIn"
                >
                  <span>LinkedIn</span>
                  <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                </a>
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn"
                  data-cursor-label="GitHub"
                >
                  <span>GitHub</span>
                  <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                </a>
                <a
                  href={contact.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn"
                  data-cursor-label="YouTube"
                >
                  <span>YouTube</span>
                  <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                </a>
              </Reveal>
            </div>
          </div>
        </section>
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
