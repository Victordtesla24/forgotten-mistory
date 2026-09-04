'use client';

import { useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';

import Hero from '@/components/sections/Hero/Hero';
import About from '@/components/sections/About/About';
import Experience from '@/components/sections/Experience/Experience';
import Skills from '@/components/sections/Skills/Skills';
import Vitrine from '@/components/sections/Vitrine/Vitrine';
import Listen from '@/components/sections/Listen/Listen';
import Navigation from '@/components/site/Navigation';
<<<<<<< HEAD

/**
 * The page is a composition and nothing else.
 *
 * It was 783 lines: five sections written inline, thirty component imports, a
 * preloader handshake, two deferred-mount gates and a credibility band that
 * restated figures the sections below it already carried. Each section now owns
 * its own markup, styles, data and scene, so this file's only remaining jobs are
 * to order them and to raise the one signal the rest of the app still listens
 * for.
 */
=======
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
// D-LCP-02 — CursorDepthField is an R3F/three scene. Importing it STATICALLY put
// three.js into the initial script list for "/": `.next/app-build-manifest.json`
// listed `static/chunks/b536a0f1-*.js` (681,907 bytes decoded, the whole three.js
// build) plus the @react-three/fiber chunk under `/page`, and `out/index.html`
// emitted them as blocking <script src> tags. That is ~900 kB of JS parsed,
// compiled and executed before hydration can finish — on a 4x-throttled mobile
// CPU it is the dominant term in TBT/TTI and it pushes every content paint out
// behind it. The runtime render was already gated on `heavyReady`; only the
// module reference was eager. next/dynamic + ssr:false moves the whole three
// graph into an async chunk that is fetched after the hero has painted.
const CursorDepthField = dynamic(() => import('@/components/site/CursorDepthField'), {
  ssr: false,
});

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

// D-LCP-01 — the blocks that sit inside the FIRST MOBILE VIEWPORT enter on a pure
// rise: opacity is 1 in both states, so they are painted by the static HTML.
//
// Measured root cause (Moto G Power profile, 412x823, 4x CPU / Slow 4G, live
// site): FCP 1.270 s but LCP 6.393 s — a 5.1 s gap. `heroItem` serialises into the
// export as `style="opacity:0;transform:translateY(22px)"` (85 such nodes in
// out/index.html), and on mobile the portrait — the desktop LCP element — is laid
// out 3158 px below the fold, so the largest in-viewport candidate is the <h1>
// (371x89 = ~33k px^2). Chrome does not treat an opacity:0 element as a paint
// candidate, so LCP could not resolve until React had downloaded + hydrated, the
// preloader had run its 1.0 s count + 0.5 s hold + 0.42 s wipe, and framer had
// finished the 0.62 s fade — i.e. never before ~6 s. Desktop scored 93/LCP 1.42 s
// on the identical markup precisely because the portrait IS above the fold there.
//
// Dropping the fade (not the motion) for these five blocks makes the export paint
// them at FCP. The staggered 22 px rise, easing and preloader choreography are
// unchanged, and everything below the fold keeps the original fade + rise.
const heroLeadItem = {
  hidden: { opacity: 1, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
};

>>>>>>> 9588cff (Merging everythig on nain)
export default function Home() {
  // `page-ready` was the preloader's handoff signal. The preloader is gone — the
  // hero is server-rendered and reveals itself in CSS — but the class and the
  // event are still what MiniVicBot and the test suite key on, so the page
  // raises them itself on the frame after mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.body.classList.add('page-ready');
      window.dispatchEvent(new Event('fm:page-ready'));
    });
    return () => cancelAnimationFrame(id);
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
      <Navigation />

<<<<<<< HEAD
      <main id="main">
        <Hero />

        <About />

        <Experience />

        <Skills />

        <Vitrine />
=======
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
            <motion.h1 className="hero-title cine-title" variants={heroLeadItem} style={{ y: titleY }}>
              <span className="line">{hero.greeting}</span>{' '}
              <span className="line reveal-text glitch-text" data-text={hero.name}>
                {hero.name}
              </span>
            </motion.h1>

            {/* D-HERO-01 / D-AVAIL-01 — scannable first-paint positioning: one CV-aligned
                target role, location, and a truthful open-to-work signal. */}
            <motion.div className="hero-positioning" variants={heroLeadItem} style={{ y: titleY }}>
              <p className="hero-role">{hero.title}</p>
              <p className="hero-location">{hero.location}</p>
              <p className="hero-availability" data-availability="open">
                <span className="availability-dot" aria-hidden="true" />
                {hero.availability}
              </p>
            </motion.div>

            {/* D-PROOF-01 — ≥3 quantified metrics in the first viewport (reuses `proof`). */}
            <motion.ul className="hero-proof-strip" variants={heroLeadItem} aria-label="Career proof points">
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
            <motion.div className="hero-cta-pillars" variants={heroLeadItem}>
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

            <motion.div variants={heroLeadItem} style={{ y: titleY }}>
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
>>>>>>> 9588cff (Merging everythig on nain)

        <Listen />
      </main>
    </>
  );
}
