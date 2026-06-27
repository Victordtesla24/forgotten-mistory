'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import SpaceScene from './components/SpaceScene';
import Preloader from '@/components/site/Preloader';
import CursorGlow from '@/components/site/CursorGlow';
import Navigation from '@/components/site/Navigation';
import Reveal from '@/components/site/Reveal';
import TelemetryPanel from '@/components/site/TelemetryPanel';
import ExperienceAccordion from '@/components/site/ExperienceAccordion';
import ExpandableCard from '@/components/site/ExpandableCard';
import ArchitectureMap from '@/components/site/ArchitectureMap';
import ProjectsCarousel from '@/components/site/ProjectsCarousel';
import GithubFeed from '@/components/site/GithubFeed';
import HiddenTerminal from '@/components/site/HiddenTerminal';
import HeroAvatar from '@/components/site/HeroAvatar';
import ScrollRail from '@/components/site/ScrollRail';
import HeroScroll from '@/components/site/HeroScroll';
import ProofScroll from '@/components/site/ProofScroll';
import WorkScroll from '@/components/site/WorkScroll';
import CatalogueScroll from '@/components/site/CatalogueScroll';
import SkillsScroll from '@/components/site/SkillsScroll';
import ContactScroll from '@/components/site/ContactScroll';
import HudFrame from '@/components/fx/HudFrame';
import PacketFlowGraph from '@/components/fx/PacketFlowGraph';
import SprintBurndown from '@/components/fx/SprintBurndown';
import TokenReflow from '@/components/fx/TokenReflow';
import AtoEvidenceBar from '@/components/fx/AtoEvidenceBar';
import CelestialSphere from '@/components/fx/CelestialSphere';
import OrchestrationGraph from '@/components/fx/OrchestrationGraph';
import ClearanceStepper from '@/components/fx/ClearanceStepper';
import InboxTriage from '@/components/fx/InboxTriage';
import JourneyTimeline from '@/components/fx/JourneyTimeline';
import TokenStreamMatch from '@/components/fx/TokenStreamMatch';
import AstroChartSphere from '@/components/fx/AstroChartSphere';
import JarvisRepairLoop from '@/components/fx/JarvisRepairLoop';
import ProofBar from '@/components/site/ProofBar';
import MindsetProjection from '@/components/site/MindsetProjection';
import SynthesisProvenance from '@/components/site/SynthesisProvenance';
import Dossier from '@/components/site/Dossier';
import CursorDepthField from '@/components/site/CursorDepthField';
import CardDepth from '@/components/site/CardDepth';

import { resumeContent } from './data/resumeContent';
import {
  about,
  contact,
  experience,
  featuredRepos,
  hero,
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

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 1.05 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] } },
};

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subtle scroll parallax across the hero.
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -60]);
  const panelY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -24]);
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 48]);

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
      <Preloader />
      <CursorGlow />

      <div className="scene-stack" aria-hidden="true">
        <SpaceScene />
        <div className="cosmic-backdrop" />
      </div>

      <CursorDepthField />
      <CardDepth />

      <FloatingDetailBox
        activeKey={activeKey}
        triggerRect={triggerRect}
        onClose={handleClose}
        isLocked={isLocked}
      />

      <Navigation />

      <main>
        <section id="hero" className="hero-section" ref={heroRef}>
          <div className="hero-hud-backdrop">
            <HudFrame variant="backdrop" label="" scene={false} />
          </div>
          <motion.div
            className="hero-content"
            variants={heroStagger}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
          >
            <motion.h1 className="hero-title" variants={heroItem} style={{ y: titleY }}>
              <span className="line">{hero.greeting}</span>{' '}
              <span className="line reveal-text glitch-text" data-text={hero.name}>
                {hero.name}
              </span>
            </motion.h1>
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
            {/* Dual-pillar CTAs (NN-1): the two first-class audiences each get a
                first-class action — employers review the evidence, clients see the
                quantified outcomes. */}
            <motion.div className="hero-cta-pillars" variants={heroItem}>
              <a href="#experience" data-pillar="employer" className="btn-pillar">
                Review experience
              </a>
              <a href="#proof" data-pillar="client" className="btn-pillar">
                See outcomes
              </a>
            </motion.div>
            <motion.div className="hero-links" variants={heroItem}>
              <a href={contact.github} target="_blank" rel="noreferrer" className="btn-link">
                GitHub
              </a>
              <a href={contact.youtube} target="_blank" rel="noreferrer" className="btn-link">
                YouTube
              </a>
              <a href="/docs/Vik_Resume_Final.pdf" className="btn-link" target="_blank" rel="noreferrer">
                Resume PDF
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

        <ProofBar />

        {/* T2 — ProofScroll: GSAP onEnter cue anchor */}
        <ProofScroll />

        <section id="about" className="about-section">
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">About Me</h2>
            </Reveal>
            <div className="about-content">
              {about.paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph.slice(0, 32)} delay={index * 0.08}>
                  <p className="about-text">{paragraph}</p>
                </Reveal>
              ))}

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
            </div>
          </div>
        </section>

        <section id="experience" className="experience-section">
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

        <section id="skills" className="skills-section">
          {/* T6 — SkillsScroll: GSAP ScrollTrigger enter stagger, per-skill micro-viz cue */}
          <SkillsScroll />
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Skills &amp; Certifications</h2>
            </Reveal>
            <div className="skills-grid">
              {skillGroups.map((group, index) => {
                const Icon = SKILL_ICONS[group.icon];
                return (
                  <Reveal key={group.id} delay={index * 0.06}>
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
                            +
                          </span>
                        </>
                      }
                    >
                      <ul className="skill-list">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </ExpandableCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="architecture-lab" className="architecture-section">
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Interactive Architecture Map</h2>
              <p className="section-subhead">
                Trace how requests move from edge clients to Gemini, telemetry, and governance.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ArchitectureMap />
            </Reveal>
          </div>
        </section>

        <section id="work" className="work-section">
          {/* T4 + T5 — WorkScroll (per-scene pin sequential) + CatalogueScroll (vertical→horizontal) */}
          <WorkScroll />
          <CatalogueScroll />
          <div className="container">
            <Reveal className="section-header">
              <h2 className="section-title">Current Projects in the Pipeline</h2>
            </Reveal>

            <Reveal delay={0.05}>
              <HudFrame label="JARVIS · real-time telemetry" className="work-hud" />
            </Reveal>

            <Reveal delay={0.08}>
              <ProjectsCarousel projects={projects} />
            </Reveal>

            <Reveal delay={0.12}>
              <div className="vfx-gallery">
                <SprintBurndown project="EFDDH-Jira-Analytics-Dashboard" />
                <TokenStreamMatch project="tailor-resume-with-ai" />
                <TokenReflow project="Advanced-Prompt-Creator" />
                <JourneyTimeline project="relationship-timeline-feature" />
                <InboxTriage project="AI-Gmail-Mailbox-Manager" />
                <CelestialSphere project="btr-demo" />
                <AstroChartSphere project="jyotish-shastra" />
                <OrchestrationGraph project="rishi-prajnya" />
                <PacketFlowGraph project="telemetry-cluster" />
                <JarvisRepairLoop />
                <AtoEvidenceBar />
                <ClearanceStepper />
              </div>
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
                  <iframe
                    title="Vicd0ct YouTube uploads"
                    src="https://www.youtube.com/embed/videoseries?list=UUJSYpoFkGKKzYTKzAr8vGzQ"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <p className="video-note">
                  Latest drops from @vicd0ct. Live coding, algorithm archaeology, telemetry breakdowns.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <MindsetProjection />

        <SynthesisProvenance />

        <Dossier />

        <section id="contact" className="contact-section">
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
                <a href={contact.github} target="_blank" rel="noreferrer" className="social-btn">
                  <span>GitHub</span>
                  <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                </a>
                <a href={contact.youtube} target="_blank" rel="noreferrer" className="social-btn">
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
          <p>&copy; {new Date().getFullYear()} Vikram Deshpande. All rights reserved.</p>
          <HiddenTerminal />
        </div>
      </footer>
    </>
  );
}
