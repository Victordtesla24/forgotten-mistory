'use client';

import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ProjectCard } from '@/app/data/siteContent';

interface ProjectsCarouselProps {
  projects: ProjectCard[];
}

/* ── Micro-effect previews (SPEC §7 / MOTION §5: one dedicated miniature per repo) ── */

/** Mini sprint burndown chart — SVG bars with animated stroke-dash draw-in.
 *  Maps to: EFDDH-Jira-Analytics-Dashboard → SPEC §7 #3 (SprintBurndown). */
function MiniSprintBurndown() {
  const bars = [75, 55, 62, 48, 30, 22, 15, 8, 6, 5, 5, 5];
  const max = Math.max(...bars);
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {/* Ideal trend line */}
      <polyline
        fill="none"
        stroke="var(--steel)"
        strokeWidth="0.6"
        strokeDasharray="2 3"
        points="10,85 160,15"
      />
      {/* Burn-down bars */}
      {bars.map((v, i) => {
        const h = (v / max) * 70;
        const x = 14 + i * 14;
        const y = 85 - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="10"
            height={h}
            rx="2"
            fill="var(--accent-color)"
            opacity={0.6 + (i / bars.length) * 0.4}
          >
            <animate
              attributeName="height"
              from="0"
              to={h}
              dur="1.2s"
              begin={`${i * 0.08}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
            <animate
              attributeName="y"
              from="85"
              to={y}
              dur="1.2s"
              begin={`${i * 0.08}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
          </rect>
        );
      })}
    </svg>
  );
}

/** Mini résumé↔JD keyword-match arcs — SVG connecting arcs.
 *  Maps to: tailor-resume-with-ai → SPEC §7 #6. */
function MiniResumeArcs() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {/* Left column (CV tokens) */}
      {['AI', 'Agile', 'Cloud', 'Python', 'React'].map((_, i) => (
        <circle key={`l-${i}`} cx="25" cy={20 + i * 18} r="3" fill="var(--steel)" />
      ))}
      {/* Right column (JD tokens) */}
      {['LLM', 'Scrum', 'Azure', 'TypeScript', 'Next.js'].map((_, i) => (
        <circle key={`r-${i}`} cx="155" cy={20 + i * 18} r="3" fill="var(--steel)" />
      ))}
      {/* Connecting arcs with staggered animate */}
      {[
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [0, 3],
        [2, 0],
      ].map(([li, ri], idx) => (
        <path
          key={idx}
          d={`M 28 ${20 + li * 18} Q ${91 + idx * 2} ${10 + idx * 3}, 152 ${20 + ri * 18}`}
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="0.7"
          opacity="0.55"
          strokeDasharray="1 1000"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="0.8s"
            begin={`${idx * 0.12}s`}
            fill="freeze"
          />
        </path>
      ))}
    </svg>
  );
}

/** Mini event-arc customer-journey timeline — SVG timeline dots + arcs.
 *  Maps to: relationship-timeline-feature → SPEC §7 #7. */
function MiniJourneyTimeline() {
  const events = [
    { x: 20, label: 'Onboard' },
    { x: 50, label: 'Engage' },
    { x: 80, label: 'Convert' },
    { x: 110, label: 'Retain' },
    { x: 140, label: 'Advocate' },
  ];
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {/* Baseline */}
      <line x1="10" y1="75" x2="170" y2="75" stroke="var(--steel)" strokeWidth="0.4" opacity="0.3" />
      {/* Event dots + vertical stems */}
      {events.map((ev, i) => (
        <g key={i}>
          <line
            x1={ev.x}
            y1="75"
            x2={ev.x}
            y2={35 - i * 5}
            stroke="var(--steel)"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <circle cx={ev.x} cy={35 - i * 5} r="4" fill="none" stroke="var(--accent-color)" strokeWidth="1">
            <animate
              attributeName="r"
              from="0"
              to="4"
              dur="0.5s"
              begin={`${i * 0.2}s`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.22 1 0.36 1"
            />
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.3s"
              begin={`${i * 0.2}s`}
              fill="freeze"
            />
          </circle>
        </g>
      ))}
      {/* Connecting arcs */}
      {events.slice(0, -1).map((ev, i) => {
        const next = events[i + 1];
        return (
          <path
            key={i}
            d={`M ${ev.x} ${35 - i * 5} Q ${(ev.x + next.x) / 2} ${15 - i * 3}, ${next.x} ${35 - (i + 1) * 5}`}
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth="0.6"
            opacity="0.3"
            strokeDasharray="1 1000"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="1000"
              to="0"
              dur="0.7s"
              begin={`${(i + 1) * 0.25}s`}
              fill="freeze"
            />
          </path>
        );
      })}
    </svg>
  );
}

/** Mini inbox-triage funnel — SVG funnel visualization.
 *  Maps to: AI-Gmail-Mailbox-Manager → SPEC §7 #5. */
function MiniInboxFunnel() {
  return (
    <svg viewBox="0 0 180 100" className="micro-effect" aria-hidden="true">
      {/* Incoming messages — wide bar */}
      <rect x="10" y="8" width="160" height="12" rx="2" fill="var(--steel)" opacity="0.3">
        <animate attributeName="width" from="0" to="160" dur="0.6s" begin="0s" fill="freeze" />
      </rect>
      {/* Filter stage */}
      <rect x="30" y="28" width="120" height="12" rx="2" fill="var(--steel)" opacity="0.4">
        <animate attributeName="width" from="0" to="120" dur="0.6s" begin="0.2s" fill="freeze" />
      </rect>
      {/* Label stage */}
      <rect x="50" y="48" width="80" height="12" rx="2" fill="var(--steel)" opacity="0.5">
        <animate attributeName="width" from="0" to="80" dur="0.6s" begin="0.4s" fill="freeze" />
      </rect>
      {/* Draft stage — narrowest */}
      <rect x="70" y="68" width="40" height="12" rx="2" fill="var(--accent-color)" opacity="0.7">
        <animate attributeName="width" from="0" to="40" dur="0.6s" begin="0.6s" fill="freeze" />
      </rect>
      {/* Particle dots dropping through stages */}
      {[
        { x: 90, y: 20 },
        { x: 75, y: 40 },
        { x: 85, y: 60 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--accent-color)">
          <animate
            attributeName="cy"
            from={p.y - 8}
            to={p.y}
            dur="0.5s"
            begin={`${0.3 + i * 0.3}s`}
            fill="freeze"
          />
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            dur="0.2s"
            begin={`${0.3 + i * 0.3}s`}
            fill="freeze"
          />
        </circle>
      ))}
    </svg>
  );
}

/** Dedicated micro-effect per project visual type (SPEC §7 1:1 mapping). */
function ProjectMicroEffect({ visual }: { visual: ProjectCard['visual'] }) {
  switch (visual) {
    case 'dashboard':
      return <MiniSprintBurndown />;
    case 'doc':
      return <MiniResumeArcs />;
    case 'waveform':
      return <MiniJourneyTimeline />;
    case 'terminal':
      return <MiniInboxFunnel />;
  }
}

/* ── Carousel component ── */

/**
 * Disney+ inspired horizontal poster-row — dark full-bleed, monochrome cards,
 * each with a dedicated micro-effect preview (SPEC §7). Wrapped in `.projects-row`
 * for GSAP T5 vertical→horizontal ScrollTrigger binding.
 *
 * Reduced-motion: vertical static card grid.
 */
export default function ProjectsCarousel({ projects }: ProjectsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dragState = useRef<{ startX: number; startScroll: number; dragging: boolean; moved: boolean }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
    moved: false,
  });

  // Reset hovered card on pointer leave from the whole carousel
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const handleLeave = () => setHoveredIndex(null);
    rail.addEventListener('pointerleave', handleLeave);
    return () => rail.removeEventListener('pointerleave', handleLeave);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail || e.pointerType === 'touch') return;
    e.preventDefault();
    dragState.current = { startX: e.clientX, startScroll: rail.scrollLeft, dragging: true, moved: false };
    rail.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail || !dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > 4) dragState.current.moved = true;
    rail.scrollLeft = dragState.current.startScroll - delta;
  };

  const endDrag = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (rail?.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
    dragState.current.dragging = false;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  return (
    <div className="carousel-wrapper catalogue-row" data-carousel="true">
      <div
        ref={railRef}
        className={`projects-carousel${prefersReducedMotion ? '' : ' catalogue-scroll'}`}
        id="projects-carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div className={`projects-row${prefersReducedMotion ? ' projects-grid' : ''}`}>
          {projects.map((project, index) => (
            <a
              key={project.href}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="project-card catalogue-card"
              draggable={false}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Poster-style image area with micro-effect */}
              <div className="project-poster">
                <ProjectMicroEffect visual={project.visual} />
                {/* Dark gradient overlay — lifts on hover */}
                <div className={`poster-overlay${hoveredIndex === index ? ' overlay-lifted' : ''}`} />
                {/* Hover-revealed title block */}
                <div className={`poster-info${hoveredIndex === index ? ' info-visible' : ''}`}>
                  <span className="poster-badge">{project.badge}</span>
                  <h3 className="poster-title">{project.title}</h3>
                  <p className="poster-desc">{project.description}</p>
                  {/* Stat line: live repo link */}
                  <span className="poster-link-hint">View on GitHub →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
