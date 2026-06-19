'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ProjectCard } from '@/app/data/siteContent';

interface ProjectsCarouselProps {
  projects: ProjectCard[];
}

function ProjectVisual({ visual }: { visual: ProjectCard['visual'] }) {
  switch (visual) {
    case 'dashboard':
      return (
        <div className="viz-dashboard">
          <div className="dash-header" />
          <div className="dash-row">
            <div className="dash-card c-1" />
            <div className="dash-card c-2" />
          </div>
          <div className="dash-row row-2">
            <div className="dash-bar b-1" />
            <div className="dash-bar b-3" />
            <div className="dash-bar b-2" />
            <div className="dash-bar b-4" />
          </div>
        </div>
      );
    case 'doc':
      return (
        <div className="viz-doc">
          <div className="doc-page">
            <div className="doc-line w-70" />
            <div className="doc-line w-90" />
            <div className="doc-line w-50" />
            <div className="scan-line" />
          </div>
        </div>
      );
    case 'waveform':
      return (
        <div className="viz-waveform">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="bar" />
          ))}
          <div className="play-btn" />
        </div>
      );
    case 'terminal':
      return (
        <div className="viz-terminal">
          <div className="terminal-header">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="terminal-body">
            <div className="code-line">
              <span className="c-purple">await</span> gmail.<span className="c-yellow">fetch</span>();
            </div>
            <div className="code-line">&gt; Analyzing sentiment...</div>
            <div className="code-line">
              &gt; Label: <span className="c-green">Urgent</span>
            </div>
            <div className="code-line">&gt; Draft created.</div>
            <div className="code-line blink">_</div>
          </div>
        </div>
      );
  }
}

// Apple "emphasized decelerate" — the house entrance curve shared across the waves.
const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const railVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: APPLE_EASE } },
};

interface DragState {
  startX: number;
  startScroll: number;
  dragging: boolean;
  moved: boolean;
  lastX: number;
  lastT: number;
  velocity: number;
}

/**
 * Horizontally scrollable project rail. Cards stagger into view on scroll, lift in
 * 3D toward the pointer (perspective tilt on the glass surface), and the rail flings
 * with inertial decay when a drag is released. Cards remain plain anchors, so
 * keyboard and middle-click behaviour is native. Under reduced motion the tilt and
 * the fling are both suppressed — the rail is a quiet native horizontal scroller.
 */
export default function ProjectsCarousel({ projects }: ProjectsCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState>({
    startX: 0,
    startScroll: 0,
    dragging: false,
    moved: false,
    lastX: 0,
    lastT: 0,
    velocity: 0,
  });
  const momentumRaf = useRef(0);

  const stopMomentum = () => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = 0;
    }
  };

  // Cancel any in-flight fling if the component unmounts mid-decay.
  useEffect(() => stopMomentum, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail || e.pointerType === 'touch') return; // touch uses native scrolling
    // Prevent the browser's native link-drag from hijacking the gesture.
    e.preventDefault();
    stopMomentum();
    dragState.current = {
      startX: e.clientX,
      startScroll: rail.scrollLeft,
      dragging: true,
      moved: false,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
    };
    rail.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rail = railRef.current;
    const s = dragState.current;
    if (!rail || !s.dragging) return;
    const delta = e.clientX - s.startX;
    if (Math.abs(delta) > 4) s.moved = true;
    rail.scrollLeft = s.startScroll - delta;
    // Track scroll velocity (px/ms) so the release can hand off to an inertial fling.
    const dt = e.timeStamp - s.lastT;
    if (dt > 0) {
      s.velocity = -(e.clientX - s.lastX) / dt;
      s.lastX = e.clientX;
      s.lastT = e.timeStamp;
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const rail = railRef.current;
    const s = dragState.current;
    if (rail?.hasPointerCapture(e.pointerId)) rail.releasePointerCapture(e.pointerId);
    s.dragging = false;
    if (!rail || prefersReducedMotion) return;

    // Inertial decay: convert the px/ms velocity into a per-frame fling, then let
    // friction settle it. Stops at the track ends or once the motion is sub-pixel.
    let velocity = s.velocity * 16;
    if (Math.abs(velocity) < 0.6) return;
    const FRICTION = 0.94;
    const step = () => {
      velocity *= FRICTION;
      rail.scrollLeft += velocity;
      const atStart = rail.scrollLeft <= 0;
      const atEnd = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
      momentumRaf.current =
        Math.abs(velocity) > 0.4 && !atStart && !atEnd ? requestAnimationFrame(step) : 0;
    };
    momentumRaf.current = requestAnimationFrame(step);
  };

  /** A drag should never trigger the card's link navigation on release. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  /** Pointer-driven 3D tilt: write the rotation the glass surface reads via CSS vars. */
  const onCardMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion || dragState.current.dragging) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--tilt-y', `${(nx * 9).toFixed(2)}deg`);
    card.style.setProperty('--tilt-x', `${(-ny * 7).toFixed(2)}deg`);
  };

  const onCardLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    card.style.removeProperty('--tilt-y');
    card.style.removeProperty('--tilt-x');
  };

  return (
    <div className="carousel-wrapper">
      <motion.div
        ref={railRef}
        className="projects-carousel"
        id="projects-carousel"
        data-carousel-stagger=""
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        variants={railVariants}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {projects.map((project) => (
          <motion.a
            key={project.href}
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="project-card"
            data-tilt-card=""
            draggable={false}
            variants={cardVariants}
            onPointerMove={onCardMove}
            onPointerLeave={onCardLeave}
          >
            <div className="project-image">
              <ProjectVisual visual={project.visual} />
              <div className="card-badge">{project.badge}</div>
            </div>
            <div className="project-info">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
}
