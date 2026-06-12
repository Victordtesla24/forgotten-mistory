'use client';

import { useRef } from 'react';
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

/**
 * Horizontally scrollable project rail with pointer drag-to-scroll. Cards
 * remain plain anchors, so keyboard and middle-click behaviour is native.
 */
export default function ProjectsCarousel({ projects }: ProjectsCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startScroll: number; dragging: boolean; moved: boolean }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
    moved: false,
  });

  const onPointerDown = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail || e.pointerType === 'touch') return; // touch uses native scrolling
    // Prevent the browser's native link-drag from hijacking the gesture.
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

  /** A drag should never trigger the card's link navigation on release. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  return (
    <div className="carousel-wrapper">
      <div
        ref={railRef}
        className="projects-carousel"
        id="projects-carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {projects.map((project) => (
          <a
            key={project.href}
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="project-card"
            draggable={false}
          >
            <div className="project-image">
              <ProjectVisual visual={project.visual} />
              <div className="card-badge">{project.badge}</div>
            </div>
            <div className="project-info">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
