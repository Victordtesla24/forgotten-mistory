'use client';

import { ArrowRight } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { useDetailOpen } from '@/components/ui/DetailPanel';
import { StageView } from '@/components/visuals/StageView';
import { EXPERIENCE_VIEW } from '@/lib/gl/ids';
import { poke } from '@/lib/gl/signal';
import { reducedMotion } from '@/lib/motion';

import styles from './Experience.module.css';
import { percent } from './percent';
import { RoleFigure } from './RoleFigure';
import type { RoleView } from './roles';

/** The bars are the controls where there is a fine pointer and room: the same condition the stylesheet lays the tabs on the axis under. */
const WIDE = '(min-width: 640px) and (pointer: fine) and (hover: hover)';

/** The entrance: the bars draw in date order and the playhead settles on the current role, inside 900 ms. The stylesheet's timings add up to it. */
const ENTRANCE_MS = 900;

/** The longest a row that was moved from code is left alone, so the row's own scroll does not answer it. It is released sooner, when the scroll ends. */
const ROW_SETTLE_MS = 700;

type Phase = 'idle' | 'armed' | 'play' | 'done';

interface TimelineProps {
  roles: readonly RoleView[];
  /** How many lanes of names each class of width needs, narrowest class first. */
  lanes: readonly number[];
  /** The server-drawn axis: the bars and the ruler. */
  children: ReactNode;
}

/** The role whose bar is nearest to a position on the track, 0 to 1. A bar is nearest to the months it spans. */
function nearest(roles: readonly RoleView[], at: number): RoleView | undefined {
  let found: RoleView | undefined;
  let gap = Number.POSITIVE_INFINITY;
  for (const role of roles) {
    const away = at < role.start ? role.start - at : at > role.end ? at - role.end : 0;
    if (away < gap) {
      gap = away;
      found = role;
    }
  }
  return found;
}

/** The custom properties the stylesheet lays the track out from: the lanes of each class of width, and where the selected bar's middle is. */
function laneVars(lanes: readonly number[], centre: number): CSSProperties {
  const vars: Record<string, string | number> = { '--cx': centre.toFixed(5) };
  lanes.forEach((count, at) => {
    vars[`--lanes-${at}`] = count;
  });
  return vars as CSSProperties;
}

/**
 * The Experience timeline: the controls, the playhead and the card around the server-drawn
 * axis. The bars are the tabs of one tab list, in date order; one tab panel is the card of the
 * selected role, joined to its bar by a connector; "Open role" and Enter open the role's panel.
 * A fine pointer moves the playhead and a click selects; a finger drags along the track and
 * selects what it lands on; on a phone the same tabs are the cards of a row that snaps, and the
 * row and the track follow each other. The stage's light reads the state from the attributes this
 * writes (`data-selected`, `data-phase` and the track's `--p`) and never from a render.
 */
export function Timeline({ roles, lanes, children }: TimelineProps) {
  const current = roles.find((role) => role.current) ?? roles[roles.length - 1];
  const [selectedId, setSelectedId] = useState(current?.id ?? '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [moved, setMoved] = useState(false);
  const open = useDetailOpen();

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  const fromRow = useRef(false);
  const rowBusy = useRef(false);
  const drag = useRef<{ pointer: number; x: number; dragging: boolean } | null>(null);

  const index = Math.max(
    roles.findIndex((role) => role.id === selectedId),
    0,
  );
  const role = roles[index];

  /** Where on the track, 0 to 1, a client x falls. */
  const fractionAt = useCallback((clientX: number): number => {
    const box = trackRef.current?.getBoundingClientRect();
    return box && box.width > 0 ? Math.min(Math.max((clientX - box.left) / box.width, 0), 1) : 0;
  }, []);

  /** The playhead goes to a position and either follows (no transition) or rests (it eases there). */
  const placePlayhead = useCallback((at: number, following: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.setProperty('--p', at.toFixed(5));
    track.dataset.following = following ? 'true' : 'false';
    poke(EXPERIENCE_VIEW);
  }, []);

  const rest = useCallback(
    (id: string) => {
      const target = roles.find((entry) => entry.id === id);
      if (target) placePlayhead(target.centre, false);
    },
    [placePlayhead, roles],
  );

  const select = useCallback(
    (id: string, source: 'row' | 'other') => {
      if (id === selectedRef.current) return;
      selectedRef.current = id;
      fromRow.current = source === 'row';
      setMoved(true);
      setSelectedId(id);
    },
    [],
  );

  /** Marks the bar under the pointer, and only that one. */
  const hover = useCallback((id: string | null) => {
    for (const bar of trackRef.current?.querySelectorAll<HTMLElement>('[data-bar]') ?? []) {
      if (bar.dataset.bar === id) bar.dataset.hover = 'true';
      else delete bar.dataset.hover;
    }
  }, []);

  /** Selects the role whose card the row has snapped to, where the row is the row of cards. */
  const syncFromRow = useCallback(() => {
    const row = rowRef.current;
    // A role's panel that is open names the role (the scroll the first layout set can arrive after a link opened it), and the row is behind it.
    if (!row || window.matchMedia(WIDE).matches || document.querySelector('[data-role-item][data-active]')) return;
    const tabs = Array.from(row.querySelectorAll<HTMLElement>('[role="tab"]'));
    const pad = Number.parseFloat(getComputedStyle(row).paddingLeft);
    const atEnd = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2;
    let snapped = atEnd ? tabs.length - 1 : 0;
    if (!atEnd) {
      let gap = Number.POSITIVE_INFINITY;
      tabs.forEach((tab, at) => {
        const away = Math.abs(tab.offsetLeft - pad - row.scrollLeft);
        if (away < gap) {
          gap = away;
          snapped = at;
        }
      });
    }
    const next = roles[snapped];
    if (next) select(next.id, 'row');
  }, [roles, select]);

  /** Scrolls the row, when it is the row of cards, so a role's card is the first one in it. */
  const rowTo = useCallback(
    (id: string) => {
      const row = rowRef.current;
      if (!row || window.matchMedia(WIDE).matches || row.scrollWidth <= row.clientWidth) return;
      const tab = row.querySelector<HTMLElement>(`[data-role="${CSS.escape(id)}"]`);
      if (!tab) return;
      const left = Math.max(Math.min(tab.offsetLeft - Number.parseFloat(getComputedStyle(row).paddingLeft), row.scrollWidth - row.clientWidth), 0);
      if (Math.abs(row.scrollLeft - left) < 1) return;
      rowBusy.current = true;
      // When the move ends the row is let go. A row that is not where the move put it was moved by something else while it ran, and the selection follows it.
      const release = () => {
        rowBusy.current = false;
        if (Math.abs(row.scrollLeft - left) > 2) syncFromRow();
      };
      row.addEventListener('scrollend', release, { once: true });
      window.setTimeout(release, ROW_SETTLE_MS);
      row.scrollTo({ left, behavior: reducedMotion() ? 'instant' : 'smooth' });
    },
    [syncFromRow],
  );

  // The bars, the playhead, the row and the light follow the selection. The card and the connector follow it through the render.
  useEffect(() => {
    for (const bar of trackRef.current?.querySelectorAll<HTMLElement>('[data-bar]') ?? []) {
      if (bar.dataset.bar === selectedId) bar.dataset.selected = 'true';
      else delete bar.dataset.selected;
    }
    if (trackRef.current?.dataset.following !== 'true') rest(selectedId);
    else poke(EXPERIENCE_VIEW);
    if (!fromRow.current) rowTo(selectedId);
    fromRow.current = false;
  }, [selectedId, rest, rowTo]);

  // On a phone the row begins at the selected role's card, as the axis begins at the selected role.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const tab = row?.querySelector<HTMLElement>(`[data-role="${CSS.escape(selectedRef.current)}"]`);
    if (!row || !tab || window.matchMedia(WIDE).matches) return;
    row.scrollLeft = Math.max(tab.offsetLeft - Number.parseFloat(getComputedStyle(row).paddingLeft), 0);
  }, []);

  // A role's panel that is open, reached by a link, the address bar or Previous and Next, is the selected role.
  useEffect(() => {
    const follow = () => {
      const open = document.querySelector<HTMLElement>('[data-role-item][data-active]');
      const found = roles.find((entry) => entry.id === open?.dataset.roleItem);
      if (found) select(found.id, 'other');
    };
    const panel = document.querySelector('[data-role-item]')?.closest('dialog');
    if (!panel) return;
    follow();
    const observer = new MutationObserver(follow);
    observer.observe(panel, { subtree: true, attributes: true, attributeFilter: ['data-active'] });
    return () => observer.disconnect();
  }, [roles, select]);

  // The entrance: armed once script has run, played once when the section comes into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    setPhase('armed');
    let timer = 0;
    const observer = new IntersectionObserver(
      (changes) => {
        if (!changes.some((change) => change.isIntersecting)) return;
        observer.disconnect();
        root.setAttribute('data-entered-at', String(performance.now()));
        setPhase('play');
        poke(EXPERIENCE_VIEW);
        timer = window.setTimeout(() => setPhase('done'), ENTRANCE_MS);
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !role) return;
    if (event.key === 'Enter') {
      const tab = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="tab"]') : null;
      if (!tab || tab.dataset.role !== role.id) return;
      event.preventDefault();
      open(role.panel, tab);
      return;
    }
    const last = roles.length - 1;
    const target =
      event.key === 'ArrowRight' ? Math.min(index + 1, last) : event.key === 'ArrowLeft' ? Math.max(index - 1, 0) : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
    if (target === null) return;
    event.preventDefault();
    const next = roles[target];
    if (!next) return;
    placePlayhead(next.centre, false);
    select(next.id, 'other');
    rowRef.current?.querySelector<HTMLElement>(`[data-role="${CSS.escape(next.id)}"]`)?.focus({ preventScroll: true });
  };

  const onStageMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const at = fractionAt(event.clientX);
    placePlayhead(at, true);
    hover(nearest(roles, at)?.id ?? null);
  };

  const onStageLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    hover(null);
    rest(selectedRef.current);
  };

  const onStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('[role="tab"]')) return;
    const found = nearest(roles, fractionAt(event.clientX));
    if (found) select(found.id, 'other');
  };

  const onTrackDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    drag.current = { pointer: event.pointerId, x: event.clientX, dragging: false };
  };

  const onTrackMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) return;
    if (!held.dragging && Math.abs(event.clientX - held.x) < 6) return;
    if (!held.dragging) {
      held.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const at = fractionAt(event.clientX);
    placePlayhead(at, true);
    const found = nearest(roles, at);
    if (found) select(found.id, 'other');
  };

  const onTrackUp = (event: PointerEvent<HTMLDivElement>) => {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) return;
    drag.current = null;
    if (!held.dragging) return;
    const found = nearest(roles, fractionAt(event.clientX));
    if (found) select(found.id, 'other');
    rest(found?.id ?? selectedRef.current);
  };

  const onRowScroll = () => {
    if (!rowBusy.current) syncFromRow();
  };

  if (!role) return null;
  return (
    <div
      ref={rootRef}
      data-experience=""
      data-selected={role.id}
      data-phase={phase}
      className={styles.root}
      style={laneVars(lanes, role.centre)}
    >
      <div className={styles.stage} onPointerMove={onStageMove} onPointerLeave={onStageLeave} onClick={onStageClick}>
        <div
          ref={trackRef}
          data-timeline=""
          data-following="false"
          className={styles.track}
          style={{ '--p': role.centre.toFixed(5) } as CSSProperties}
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackUp}
          onPointerCancel={onTrackUp}
        >
          <StageView view={EXPERIENCE_VIEW} className={styles.light} />
          <span data-connector="" aria-hidden="true" className={styles.connector} />
          <span data-playhead="" aria-hidden="true" className={styles.playhead} />
          {children}
        </div>

        <div
          ref={rowRef}
          role="tablist"
          aria-label="Roles, oldest first"
          data-row=""
          className={styles.tabs}
          onKeyDown={onKeyDown}
          onPointerDown={() => {
            rowBusy.current = false;
          }}
          onScroll={onRowScroll}
        >
          {roles.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              id={`role-tab-${entry.id}`}
              aria-selected={entry.id === role.id}
              aria-controls="role-panel"
              tabIndex={entry.id === role.id ? 0 : -1}
              data-role={entry.id}
              data-role-card=""
              data-label={entry.label}
              data-current={entry.current ? 'true' : undefined}
              data-detail-trigger={entry.panel}
              className={styles.tab}
              style={{ '--l': percent(entry.start), '--w': percent(entry.end - entry.start) } as CSSProperties}
              onClick={() => select(entry.id, 'other')}
            >
              <span aria-hidden="true" className={styles.tabLabel}>
                {entry.label}
              </span>
              <span aria-hidden="true" className={styles.mini}>
                <span
                  className={styles.span}
                  style={{ left: percent(entry.start), width: percent(entry.end - entry.start) } as CSSProperties}
                />
              </span>
              <span className={styles.said}>
                {entry.employer}, {entry.shortTitle}, {entry.dates}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id="role-panel" aria-labelledby={`role-tab-${role.id}`} data-lens="" className={styles.card}>
        <div key={role.id} className={styles.body} data-moved={moved ? '' : undefined}>
          <div className={styles.who}>
            <p className={styles.employer}>{role.label}</p>
            <h3 className={styles.title}>{role.shortTitle}</h3>
          </div>
          <p className={styles.when}>
            {role.years}
            <span aria-hidden="true"> · </span>
            {role.duration}
          </p>
          {role.headline ? <RoleFigure headline={role.headline} place="card" /> : <p className={styles.summary}>{role.summary}</p>}
          <button type="button" aria-haspopup="dialog" className={styles.open} onClick={(event) => open(role.panel, event.currentTarget)}>
            Open role
            <ArrowRight aria-hidden="true" className={styles.arrow} />
          </button>
        </div>
      </div>
    </div>
  );
}
