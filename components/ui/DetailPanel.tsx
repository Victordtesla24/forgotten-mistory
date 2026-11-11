'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { reducedMotion } from '@/lib/motion';

import styles from './DetailPanel.module.css';

/** One panel of a set. Its content is in the HTML whether or not script runs. */
export interface DetailItem {
  /** The URL fragment that opens it, and the id of its section. */
  id: string;
  /** A short line above the title, such as the scope of a figure. */
  eyebrow?: ReactNode;
  title: string;
  /** What leads the panel before its text: a figure, a schematic or a small infographic. */
  lead?: ReactNode;
  children: ReactNode;
}

interface DetailContextValue {
  open(id: string, origin: HTMLElement | null): void;
}

const DetailContext = createContext<DetailContextValue | null>(null);

type Transition = { ready: Promise<unknown>; finished: Promise<unknown>; updateCallbackDone: Promise<unknown> };
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => Transition };

const MORPH = 'detail-morph';

/** Names an element for the morph, or takes the name away. */
function morphName(element: HTMLElement, named: boolean): void {
  if (named) element.style.setProperty('view-transition-name', MORPH);
  else element.style.removeProperty('view-transition-name');
}

/** The fragment of the address bar without its '#', or an empty string. */
function currentFragment(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return '';
  }
}

/** The control that opens `id`; where two stand for one panel (a bar and a chip), the one on screen. */
function triggerFor(id: string): HTMLElement | null {
  const triggers = document.querySelectorAll<HTMLElement>(`[data-detail-trigger="${CSS.escape(id)}"]`);
  return Array.from(triggers).find((trigger) => trigger.getClientRects().length > 0) ?? triggers[0] ?? null;
}

function focusable(root: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => element.offsetParent !== null);
}

interface DetailSetProps {
  /** Names the set for assistive technology, for example "Headline figures". */
  label: string;
  items: readonly DetailItem[];
  /** The triggers, wherever they sit in the layout. */
  children: ReactNode;
}

/**
 * A set of detail panels sharing one native modal dialog. Open one from a `DetailTrigger`,
 * a link to its fragment or the address bar. It morphs out of the element that opened it
 * where View Transitions exist and fades in otherwise; it is a bottom sheet on phones. Focus
 * stays inside until it closes by Escape, the backdrop, the close button or the browser's
 * back button, and then returns to the trigger. Previous and next move through the set
 * without closing. With JavaScript off every panel is shown in place, one after another.
 */
export function DetailSet({ label, items, children }: DetailSetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const openRef = useRef<string | null>(null);
  const pushed = useRef(false);
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  /** Shows `id` (or closes with null) through whichever transition the browser and the reader allow. */
  const present = useCallback((id: string | null, origin: HTMLElement | null) => {
    const dialog = dialogRef.current;
    const frame = frameRef.current;
    if (!dialog || !frame) return;
    const previous = openRef.current;
    if (id === previous) return;

    // The DOM is updated directly, so the new state is in place the moment a transition captures it.
    const apply = () => {
      openRef.current = id;
      const index = id === null ? -1 : ids.indexOf(id);
      for (const section of frame.querySelectorAll<HTMLElement>('[data-detail-item]')) {
        if (section.id === id) section.dataset.active = 'true';
        else delete section.dataset.active;
      }
      if (id === null) dialog.removeAttribute('aria-labelledby');
      else dialog.setAttribute('aria-labelledby', `${id}-title`);
      if (countRef.current) countRef.current.textContent = `${index + 1} / ${ids.length}`;
      if (titleRef.current) titleRef.current.textContent = id === null ? '' : (items[index]?.title ?? '');
      if (id !== null && !dialog.open) dialog.showModal();
      if (id === null && dialog.open) dialog.close();
      if (id !== null && previous === null) frame.focus({ preventScroll: true });
    };

    const target = id === null ? triggerFor(previous ?? '') : origin;
    const start = (document as TransitionDocument).startViewTransition;
    const switching = id !== null && previous !== null;
    // A morph still running is left to finish; a second one would skip it.
    const busy = document.documentElement.dataset.vt === 'detail';
    dialog.dataset.transition = reducedMotion() || switching || busy ? 'none' : start && target ? 'morph' : 'fade';

    if (dialog.dataset.transition === 'morph' && start && target) {
      // The dialog itself is named, so its surface, border and shadow grow out of the card with it.
      const from = id === null ? dialog : target;
      const to = id === null ? target : dialog;
      morphName(from, true);
      // The card shows its reading in the DOM's own drawing while it is part of the morph.
      target.dataset.morph = '';
      document.documentElement.dataset.vt = 'detail';
      const transition = start.call(document, () => {
        morphName(from, false);
        morphName(to, true);
        apply();
        if (id === null) target.focus({ preventScroll: true });
      });
      // A transition the browser skips rejects its promises; the panel is in its final state either way.
      const settle = () => undefined;
      void transition.ready.catch(settle);
      void transition.updateCallbackDone.catch(settle);
      void transition.finished.catch(settle).then(() => {
        morphName(to, false);
        delete target.dataset.morph;
        delete document.documentElement.dataset.vt;
      });
      return;
    }

    apply();
    if (id === null) triggerFor(previous ?? '')?.focus({ preventScroll: true });
  }, [ids, items]);

  const open = useCallback(
    (id: string, origin: HTMLElement | null) => {
      if (openRef.current === null) {
        window.history.pushState(null, '', `#${encodeURIComponent(id)}`);
        pushed.current = true;
      } else {
        window.history.replaceState(null, '', `#${encodeURIComponent(id)}`);
      }
      present(id, origin);
    },
    [present],
  );

  const close = useCallback(() => {
    if (openRef.current === null) return;
    if (pushed.current) {
      // The browser's own history step closes it: `sync` below hears the fragment go.
      pushed.current = false;
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    present(null, null);
  }, [present]);

  const step = useCallback(
    (direction: 1 | -1) => {
      const index = ids.indexOf(openRef.current ?? '');
      if (index < 0) return;
      open(ids[(index + direction + ids.length) % ids.length] ?? '', null);
    },
    [ids, open],
  );

  // The fragment is the source of truth: a link, a reload, the address bar and the back
  // button all land here, so every panel can be linked to.
  useEffect(() => {
    const sync = (fromHistory: boolean) => {
      const fragment = currentFragment();
      const known = ids.includes(fragment);
      // A panel reached through history can be left the same way; a deep link cannot.
      pushed.current = known && fromHistory;
      present(known ? fragment : null, null);
      // A panel opened by a link or the history has no trigger to have put focus anywhere: it
      // belongs inside the dialog, and is put back there after the next paint if the page's
      // own hash handling, which also runs now, took it.
      if (known) {
        requestAnimationFrame(() => {
          const dialog = dialogRef.current;
          if (openRef.current !== null && dialog?.open && !dialog.contains(document.activeElement)) {
            frameRef.current?.focus({ preventScroll: true });
          }
        });
      }
    };
    const onHistory = () => sync(true);
    sync(false);
    window.addEventListener('popstate', onHistory);
    window.addEventListener('hashchange', onHistory);
    return () => {
      window.removeEventListener('popstate', onHistory);
      window.removeEventListener('hashchange', onHistory);
    };
  }, [ids, present]);

  const context = useMemo<DetailContextValue>(() => ({ open }), [open]);

  return (
    <DetailContext.Provider value={context}>
      {children}
      <dialog
        ref={dialogRef}
        aria-label={label}
        data-detail=""
        className={styles.dialog}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          const dialog = event.currentTarget;
          if (event.key === 'ArrowLeft' && !event.altKey && !event.metaKey) step(-1);
          else if (event.key === 'ArrowRight' && !event.altKey && !event.metaKey) step(1);
          else if (event.key === 'Tab') {
            const stops = focusable(dialog);
            const first = stops[0];
            const last = stops[stops.length - 1];
            if (!first || !last) return;
            const here = document.activeElement;
            if (event.shiftKey && (here === first || here === frameRef.current)) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && here === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div ref={frameRef} tabIndex={-1} className={styles.frame}>
          <div className={styles.bar}>
            <p className="type-meta text-muted" aria-live="polite">
              <span ref={countRef} />
              <span ref={titleRef} className="sr-only" />
            </p>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous" className={styles.control} onClick={() => step(-1)}>
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <button type="button" aria-label="Next" className={styles.control} onClick={() => step(1)}>
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
              <button type="button" aria-label="Close" className={styles.control} onClick={close}>
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
          {items.map((item) => (
            <section
              key={item.id}
              id={item.id}
              aria-labelledby={`${item.id}-title`}
              data-detail-item=""
              className={styles.item}
            >
              {item.eyebrow ? <p className="type-eyebrow text-muted">{item.eyebrow}</p> : null}
              {item.lead ? <div>{item.lead}</div> : null}
              <h3 id={`${item.id}-title`}>{item.title}</h3>
              <div className={styles.body}>{item.children}</div>
            </section>
          ))}
        </div>
      </dialog>
    </DetailContext.Provider>
  );
}

type DetailTriggerProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  /** The id of the panel it opens: the same as `DetailItem.id`. */
  panel: string;
};

/**
 * The element that opens a panel. It is a link to the panel's fragment, so it works without
 * script (the panel is inline there), can be copied and opened in a new tab, and is a real
 * control for keyboard and assistive technology.
 */
export function DetailTrigger({ panel, className, children, ...rest }: DetailTriggerProps) {
  const detail = useContext(DetailContext);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!detail || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    detail.open(panel, event.currentTarget);
  };
  return (
    <a
      {...rest}
      href={`#${panel}`}
      data-detail-trigger={panel}
      aria-haspopup="dialog"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
