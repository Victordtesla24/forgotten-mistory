/**
 * What makes the Work section answer, written against the page's own DOM and loaded after the page is
 * up (`WorkBehaviour`), so none of it is in the first JavaScript. Until it has run, and without script,
 * the cards and panels are complete: their controls are off and every stage reads with its note.
 *
 * A card's schematic runs the flow once when a fine pointer is over it, the keyboard is on it or it is
 * tapped: each stage is lit in turn, in the order of the work, and named in the caption, and the last stays
 * lit until the pointer or the focus leaves. A panel's stage controls, and ArrowLeft and ArrowRight in the
 * panel while its project shows, select a stage: the enlarged drawing lights it and its note shows.
 * A stage is lit by `data-active` on its mark (`[data-stage]`) and on the way that leads to it or back
 * from it (`[data-lit]`, the number of the stage that lights it).
 *
 * The first time the rail comes into view its cards arrive in order (`arrive`). A rail that is already in
 * view when this has loaded, and any page that asks for less motion, keeps its cards as they are.
 */

import { duration, reducedMotion } from '@/lib/motion';

/** How long a running schematic lights one stage before it goes on to the next, in milliseconds. */
const STAGE_STEP = duration.entrance;

/** The rail counts as coming into view when its top edge is this far above the bottom of the screen, so the first card is just entering. */
const ARRIVE_MARGIN = '0px 0px -12% 0px';

/** Lights stage `stage` (1 to 3, or 0 for none) in the drawing inside `scope`. */
function light(scope: ParentNode, stage: number): void {
  scope.querySelectorAll<SVGElement>('[data-stage]').forEach((mark, at) => {
    if (at + 1 === stage) mark.dataset.active = 'true';
    else delete mark.dataset.active;
  });
  scope.querySelectorAll<SVGElement>('[data-lit]').forEach((route) => {
    if (Number(route.dataset.lit) === stage) route.dataset.active = 'true';
    else delete route.dataset.active;
  });
}

function attachCard(card: HTMLElement, signal: AbortSignal): void {
  const scene = card.querySelector<HTMLElement>('[data-schematic]');
  const step = card.querySelector<HTMLButtonElement>('button[data-step]');
  const caption = card.querySelector<HTMLElement>('[data-stage-caption]');
  if (!scene || !step || !caption) return;
  const names = Array.from(scene.querySelectorAll<SVGElement>('[data-stage]'), (mark) => mark.dataset.label ?? '');
  let stage = 0;
  let timer = 0;

  const show = (next: number) => {
    stage = next;
    light(scene, next);
    caption.textContent = next > 0 ? `${next} · ${names[next - 1]}` : '';
  };
  const stop = () => {
    window.clearTimeout(timer);
    timer = 0;
  };
  // The next stage is lit one step after the last was drawn, so each is seen for its whole step however busy the page is.
  const onward = () => {
    show(stage + 1);
    timer = stage < names.length ? window.setTimeout(onward, STAGE_STEP) : 0;
  };
  const run = () => {
    stop();
    show(1);
    if (!reducedMotion()) timer = window.setTimeout(onward, STAGE_STEP);
  };
  const clear = () => {
    stop();
    show(0);
  };

  step.disabled = false;
  step.addEventListener(
    'pointerenter',
    (event) => {
      if (event.pointerType === 'mouse') run();
    },
    { signal },
  );
  step.addEventListener(
    'pointerleave',
    (event) => {
      if (event.pointerType === 'mouse') clear();
    },
    { signal },
  );
  step.addEventListener(
    'focus',
    () => {
      if (step.matches(':focus-visible')) run();
    },
    { signal },
  );
  step.addEventListener('blur', clear, { signal });
  step.addEventListener(
    'click',
    () => {
      if (reducedMotion()) show((stage % names.length) + 1);
      else if (timer === 0) run();
    },
    { signal },
  );
}

interface Lead {
  item: HTMLElement;
  controls: HTMLButtonElement[];
  select(index: number): void;
  current(): number;
}

function attachLead(item: HTMLElement, signal: AbortSignal): Lead | null {
  const plate = item.querySelector<HTMLElement>('[data-schematic]');
  const controls = Array.from(item.querySelectorAll<HTMLButtonElement>('button[data-stage-control]'));
  const notes = Array.from(item.querySelectorAll<HTMLElement>('[data-stage-note]'));
  if (!plate || controls.length === 0) return null;
  let current = 0;
  const select = (index: number) => {
    current = index;
    controls.forEach((control, at) => control.setAttribute('aria-pressed', String(at === index)));
    notes.forEach((note, at) => {
      note.hidden = at !== index;
    });
    light(plate, index + 1);
  };
  controls.forEach((control, at) => {
    control.disabled = false;
    control.addEventListener('click', () => select(at), { signal });
  });
  select(0);
  return { item, controls, select, current: () => current };
}

/**
 * The entrance, once. `data-entrance` on the section is `armed` while the rail waits out of sight (its cards
 * wait at their start, off the screen), `play` from the moment it comes into view (each card runs its own
 * delay, in order) and `done` when the last card has landed. The observer is let go as soon as it has played,
 * so scrolling away and back changes nothing, and the cards are never held back from a rail that is already
 * on screen.
 */
function arrive(section: HTMLElement, signal: AbortSignal): void {
  const rail = section.querySelector('article[data-project]')?.closest('ul');
  const last = rail?.lastElementChild;
  if (!rail || !last || reducedMotion()) return;
  let armed = false;
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.at(-1)?.isIntersecting ?? false;
      if (!armed && visible) {
        observer.disconnect();
      } else if (!armed) {
        armed = true;
        section.dataset.entrance = 'armed';
      } else if (visible) {
        observer.disconnect();
        section.dataset.entrance = 'play';
      }
    },
    { rootMargin: ARRIVE_MARGIN },
  );
  observer.observe(rail);
  section.addEventListener(
    'animationend',
    (event) => {
      if (event.target === last && section.dataset.entrance === 'play') section.dataset.entrance = 'done';
    },
    { signal },
  );
  signal.addEventListener('abort', () => {
    observer.disconnect();
    delete section.dataset.entrance;
  });
}

/** Sets the section up and returns what takes it down again. */
export function attach(section: HTMLElement): () => void {
  const abort = new AbortController();
  const { signal } = abort;
  section.querySelectorAll<HTMLElement>('article[data-project]').forEach((card) => attachCard(card, signal));
  const leads = Array.from(section.querySelectorAll<HTMLElement>('[data-detail-item]'), (item) => attachLead(item, signal)).filter(
    (lead): lead is Lead => lead !== null,
  );

  // The panel's own arrow keys step to the previous and next project; here they step the stages, so they
  // are taken before the panel hears them, wherever focus is inside it while a project shows.
  window.addEventListener(
    'keydown',
    (event) => {
      const by = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (by === 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const lead = leads.find((entry) => entry.item.dataset.active === 'true');
      const dialog = lead?.item.closest('dialog');
      if (!lead || !dialog || !(event.target instanceof Node) || !dialog.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      const next = (lead.current() + by + lead.controls.length) % lead.controls.length;
      const onControl = lead.controls.some((control) => control === document.activeElement);
      lead.select(next);
      if (onControl) lead.controls[next]?.focus();
    },
    { capture: true, signal },
  );

  arrive(section, signal);
  section.dataset.interactive = 'true';
  return () => {
    abort.abort();
    delete section.dataset.interactive;
  };
}
