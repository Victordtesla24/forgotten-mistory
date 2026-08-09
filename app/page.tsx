'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Crown,
  Gauge,
  GitBranch,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import FloatingDetailBox from '@/components/FloatingDetailBox';
import ErrorBoundary from '@/components/ErrorBoundary';
const SpaceScene = dynamic(() => import('./components/SpaceScene'), { ssr: false });
import Preloader from '@/components/site/Preloader';
import CursorGlow from '@/components/site/CursorGlow';
import CardDepth from '@/components/site/CardDepth';
import SectionBeats from '@/components/site/SectionBeats';
import Navigation from '@/components/site/Navigation';
import Reveal from '@/components/site/Reveal';
import TelemetryPanel from '@/components/site/TelemetryPanel';
import ExperienceAccordion from '@/components/site/ExperienceAccordion';
import ExpandableCard from '@/components/site/ExpandableCard';
import ArchitectureMap from '@/components/site/ArchitectureMap';
import ProjectsCarousel from '@/components/site/ProjectsCarousel';
import GithubFeed from '@/components/site/GithubFeed';
import LiteYouTube from '@/components/site/LiteYouTube';
import HiddenTerminal from '@/components/site/HiddenTerminal';
import HeroAvatar from '@/components/site/HeroAvatar';
import ScrollRail from '@/components/site/ScrollRail';
import InViewGate from '@/components/site/InViewGate';
import HeroScroll from '@/components/site/HeroScroll';
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

import { resumeContent } from './data/resumeContent';
import {
  about,
  contact,
  credibility,
  experience,
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

const OUTCOME_ICONS: Record<string, LucideIcon> = {
  'Test Automation at Scale': Workflow,
  'Cloud Modernisation': UploadCloud,
  'Realtime Reliability': Gauge,
  'AI Quality & Risk': ShieldCheck,
  'Leadership Scale': Users,
  'Portfolio Value': TrendingUp,
};

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
const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.085, delayChildren: 0.12 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Subtle scroll parallax across the hero.
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -60]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -24]);
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 48]);

  // Whole-document progress drives the slim reading indicator pinned to the top edge.
  const { scrollYProgress: pageProgress } = useScroll();

  const openDetail = useCallback((key: string, element: HTMLElement, locked: boolean) => {
    setTriggerRect(element.getBoundingClientRect());
    setActiveKey(key);
    setIsLocked(locked);
  }, []);

  const handleMetaClick = (key: string, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    openDetail(key, e.currentTarget as HTMLElement, true);
  };

  const handleMetaKeyDown = (key: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(key, e.currentTarget as HTMLElement, true);
    }
  };

  const handleMetaHover = (key: string, e: React.MouseEvent) => {
    if (isLocked || activeKey === key) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const target = e.currentTarget as HTMLElement;
    hoverTimeoutRef.current = setTimeout(() => openDetail(key, target, false), 200);
  };

  const handleMetaLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!isLocked) setActiveKey(null);
  };

  const handleClose = useCallback(() => {
    setActiveKey(null);
    setIsLocked(false);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [handleClose]);

  return (
    <>
      <motion.div
        className="scroll-progress"
        data-scroll-progress
        aria-hidden="true"
        style={{ scaleX: pageProgress }}
      />

      <Preloader />
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

      <FloatingDetailBox
        activeKey={activeKey}
        triggerRect={triggerRect}
        onClose={handleClose}
        isLocked={isLocked}
      />

      <Navigation />

      <main>
        <section id="hero" className="hero-section cine-stage" ref={heroRef}>
          <div className="cine-spotlight" aria-hidden="true" />
          <div className="cine-vignette" aria-hidden="true" />
          <div className="hero-hud-backdrop">
            <HudFrame variant="backdrop" label="" scene={false} />
          </div>
          <motion.div
            className="hero-content"
            variants={heroStagger}
            // `initial` is kept identical on server and first client paint (it cannot
            // branch on useReducedMotion without a hydration mismatch). MotionConfig
            // reducedMotion="user" makes the transform legs instant for reduced-motion
            // users, leaving only a gentle opacity fade.
            initial="hidden"
            animate={revealed ? 'visible' : 'hidden'}
            data-revealed={revealed ? 'true' : 'false'}
          >
            <motion.h1 className="hero-title cine-title" variants={heroItem} style={{ y: titleY }}>
              <span className="line">{hero.greeting}</span>{' '}
              <span className="line reveal-text glitch-text" data-text={hero.name}>
                {hero.name}
              </span>
            </motion.h1>

            {/* D-HERO-01 / D-AVAIL-01 — scannable first-paint positioning: one CV-aligned
                target role, location, and a truthful open-to-work signal. */}
            <motion.div className="hero-positioning" variants={heroItem} style={{ y: titleY }}>
              <p className="hero-role">{hero.title}</p>
              <p className="hero-location">{hero.location}</p>
              <p className="hero-availability" data-availability="open">
                <span className="availability-dot" aria-hidden="true" />
                {hero.availability}
              </p>
            </motion.div>

            {/* D-PROOF-01 — ≥3 quantified metrics in the first viewport (reuses `proof`). */}
            <motion.ul className="hero-proof-strip" variants={heroItem} aria-label="Career proof points">
              {proof.slice(0, 4).map((m) => (
                <li key={m.label} className="hero-proof-item" data-hero-proof>
                  <span className="hero-proof-value">
                    {m.prefix ?? ''}
                    {m.value}
                    {m.suffix ?? ''}
                  </span>
                  <span className="hero-proof-label">{m.label}</span>
                </li>
              ))}
            </motion.ul>

            {/* Dual-pillar CTAs (NN-1) sit above the narrative subtitle so a
                recruiter's first paint lands on role + actions, not a wall of copy. */}
            <motion.div className="hero-cta-pillars" variants={heroItem}>
              <a
                href="#experience"
                data-pillar="employer"
                className="btn-pillar"
                data-magnetic=""
                data-cursor-label="Experience"
              >
                Review experience
              </a>
              <a
                href="#proof"
                data-pillar="client"
                className="btn-pillar"
                data-magnetic=""
                data-cursor-label="Outcomes"
              >
                See outcomes
              </a>
            </motion.div>

            <motion.div variants={heroItem} style={{ y: titleY }}>
              <p className="hero-subtitle">
                {hero.subtitle.map((paragraph, index) => (
                  <React.Fragment key={paragraph.slice(0, 32)}>
                    {index > 0 && (
                      <>
                        <br />
                        <br />
                      </>
                    )}
                    {paragraph}
                  </React.Fragment>
                ))}
              </p>
            </motion.div>
            <motion.div className="hero-links" variants={heroItem}>
              {/* D-CONTACT-01 + D-CV-01 — LinkedIn (primary recruiter channel) and a
                  clearly-labelled Download CV lead the row. */}
              <a href={contact.linkedin} target="_blank" rel="noreferrer" className="btn-link btn-link--linkedin">
                LinkedIn
              </a>
              <a href="/docs/Vik_Resume_Final.pdf" className="btn-link btn-link--cv" download target="_blank" rel="noreferrer">
                Download CV
              </a>
              <a href={contact.github} target="_blank" rel="noreferrer" className="btn-link">
                GitHub
              </a>
              <a href={contact.youtube} target="_blank" rel="noreferrer" className="btn-link">
                YouTube
              </a>
              <a href="#contact" className="btn-primary">
                Let&apos;s Talk
              </a>
            </motion.div>
            <motion.div variants={heroItem} style={{ y: panelY }}>
              <TelemetryPanel />
            </motion.div>
            <motion.div className="hero-meta" variants={heroItem}>
              {Object.entries(resumeContent).map(([key, outcome], index) => {
                const Icon = OUTCOME_ICONS[key] ?? TrendingUp;
                return (
                  // Plain div: the magnetic depth-parallax transform is driven via
                  // CSS custom properties (--rx/--ry/--tx/--ty from CursorGlow), so a
                  // framer-motion inline transform would shadow it. Hover lift/scale
                  // moved to CSS (System C).
                  <div
                    key={key}
                    className="meta-card glass-card cursor-pointer"
                    role="button"
                    tabIndex={0}
                    data-outcome-card="true"
                    data-outcome-index={index}
                    onClick={(e) => handleMetaClick(key, e)}
                    onKeyDown={(e) => handleMetaKeyDown(key, e)}
                    onMouseEnter={(e) => handleMetaHover(key, e)}
                    onMouseLeave={handleMetaLeave}
                  >
                    <div className="meta-icon">
                      <Icon size={22} strokeWidth={1.7} />
                    </div>
                    <div className="meta-content">
                      <span className="meta-label">{outcome.title}</span>
                      <div className="meta-stats">
                        <span className="meta-value">{outcome.stats.value}</span>
                        <span className="meta-subvalue">{outcome.stats.label}</span>
                      </div>
                      <span className="meta-note">{outcome.details[0]}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div className="hero-image-container" style={{ y: avatarY }}>
            <HeroAvatar />
          </motion.div>

          {/* T1 — HeroScroll: GSAP ScrollTrigger scrubs HUD backdrop, headline clip-reveal, avatar crossfade */}
          <HeroScroll />
        </section>

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

        <section id="about" className="about-section beat">
          <div className="container">
            <Reveal className="section-header" variant="depth">
              <h2 className="section-title">About Me</h2>
            </Reveal>
            <div className="about-content">
              {about.paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 32)} delay={index * 0.08}>
                  <p className="about-text">{paragraph}</p>
                </Reveal>
              ))}

              <Reveal delay={0.16} y={24}>
              <div className="snap-grid" role="list">
                <ExpandableCard
                  baseClass="snap-card"
                  headerClass="snap-header"
                  bodyClass="snap-body"
                  role="listitem"
                  header={
                    <>
                      <div>
                        <p className="snap-kicker">What I aim to deliver</p>
                        <h3 className="snap-title">Career Objective</h3>
                        <p className="snap-summary">
                          Bridge technical depth with executive strategy so AI/ML pilots land in production with
                          business value.
                        </p>
                      </div>
                      <span className="snap-icon" aria-hidden="true">
                        +
                      </span>
                    </>
                  }
                >
                  <ul>
                    <li>Translate strategy into roadmaps that improve delivery efficiency and de-risk cloud modernisations.</li>
                    <li>Align AI/ML delivery with compliance and risk models from the start.</li>
                    <li>Use telemetry and dashboards to provide transparency for leaders and teams.</li>
                  </ul>
                </ExpandableCard>

                <ExpandableCard
                  baseClass="snap-card"
                  headerClass="snap-header"
                  bodyClass="snap-body"
                  role="listitem"
                  header={
                    <>
                      <div>
                        <p className="snap-kicker">Measurable outcomes</p>
                        <h3 className="snap-title">Delivery Impact</h3>
                        <p className="snap-summary">Programs built around latency, resilience, and cost controls.</p>
                      </div>
                      <span className="snap-icon" aria-hidden="true">
                        +
                      </span>
                    </>
                  }
                >
                  <ul>
                    <li>≈92% reduction in test-evidence effort across 200+ mainframe SIT/E2E scenarios (ATO Payday Super).</li>
                    <li>P95 &lt; 200 ms realtime WebSocket telemetry across 10k+ device concurrency (ANZ).</li>
                    <li>Core banking transformation (.NET/Azure) trimmed delivery time by &gt;30% and infra cost by &gt;15%.</li>
                    <li>$5M+ portfolio oversight with 100% compliance to enterprise standards and risk models.</li>
                  </ul>
                </ExpandableCard>

                <ExpandableCard
                  baseClass="snap-card"
                  headerClass="snap-header"
                  bodyClass="snap-body"
                  role="listitem"
                  header={
                    <>
                      <div>
                        <p className="snap-kicker">How teams experience it</p>
                        <h3 className="snap-title">Leadership &amp; Governance</h3>
                        <p className="snap-summary">Servant leadership with clear guardrails and steady cadence.</p>
                      </div>
                      <span className="snap-icon" aria-hidden="true">
                        +
                      </span>
                    </>
                  }
                >
                  <ul>
                    <li>Lead the Agile Kookaburras squad at the ATO within an eight-team SIT program.</li>
                    <li>Led 5+ squads (up to 40 resources including offshore) through Agile/Scrum/SAFe rituals.</li>
                    <li>Exec workshops for 40+ leaders improved decision clarity by ~55%.</li>
                    <li>Certified Scrum Master; governance first to keep risk, budget, and delivery aligned.</li>
                  </ul>
                </ExpandableCard>

                <ExpandableCard
                  baseClass="snap-card"
                  headerClass="snap-header"
                  bodyClass="snap-body"
                  role="listitem"
                  header={
                    <>
                      <div>
                        <p className="snap-kicker">Live proof points</p>
                        <h3 className="snap-title">Recent Builds</h3>
                        <p className="snap-summary">Hands-on shipping to validate decisions with working software.</p>
                      </div>
                      <span className="snap-icon" aria-hidden="true">
                        +
                      </span>
                    </>
                  }
                >
                  <ul>
                    <li>Next.js + Supabase JIRA analytics dashboard surfacing sprint velocity and LLM retro insights.</li>
                    <li>Node.js/Express public-key server with full Mocha/Chai coverage for API signing.</li>
                    <li>React/TypeScript + D3 relationship timeline visualiser for customer journeys.</li>
                    <li>Langfuse + Phoenix evaluation stack reducing simulated LLM error-budget breaches by 38%.</li>
                  </ul>
                </ExpandableCard>
              </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="experience" className="experience-section beat">
          <ScrollRail targetId="experience" label="Experience" />
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Experience</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <ExperienceAccordion roles={experience} />
            </Reveal>
          </div>
        </section>

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
