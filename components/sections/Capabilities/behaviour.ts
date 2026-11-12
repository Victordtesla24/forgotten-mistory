/**
 * What makes the Capabilities filters answer, written against the page's own DOM and loaded after the
 * page is up (`CapabilitiesBehaviour`), so none of it is in the first JavaScript. Until it has run, and
 * without script, the map is complete: every domain on the wide map, the first domain on the narrow one.
 *
 * The filters are buttons with `aria-pressed`, exactly one pressed. From 1024 px the choice is All or a
 * domain and the wide map keeps everything on the page, the domains outside the choice receding; below
 * it there is no All and the field shows one domain, the others leaving as the chosen one arrives. Either
 * way the field re-forms with `spring.snappy` from `lib/motion.ts`, cut at 300 ms, and only opacity and a
 * small lift change, so nothing on the page moves. While it runs the section carries `data-forming`.
 * Under reduced motion or Motion off it is instant. A choice made while the field is moving starts from
 * where each part is now.
 */

import { reducedMotion, spring, stepSpring, type SpringState } from '@/lib/motion';

/** The most a re-forming runs, in milliseconds. */
const LIMIT = 300;

/** How far a domain's group rises into place on the narrow map, in pixels. */
const LIFT = 10;

/** What the wide map's parts outside the chosen domain fall to. */
const RECEDED = 0.2;

interface Part {
  element: SVGElement | HTMLElement;
  /** A narrow map's group of one domain, or a part of the wide map that belongs to one or more. */
  group: boolean;
  value: number;
  from: number;
  to: number;
}

const WIDE = '(min-width: 1024px)';

const MS = 1000;

/** How close to the row's edge a chip may stand before it is brought in, in pixels. */
const EDGE = 8;

/** The longest step the spring takes at once, in seconds, so a frame lost to a busy page does not jump the field. */
const LONGEST_STEP = 0.032;

export function attach(page: HTMLElement): () => void {
  const section = page;
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('button[data-filter]'));
  const first = section.querySelector<HTMLElement>('[data-group]')?.dataset.group ?? 'all';
  const parts: Part[] = [
    ...Array.from(section.querySelectorAll<SVGElement>('svg[data-field] [data-node], svg[data-field] path[data-part="edge"]'), (element) => ({
      element,
      group: false,
      value: 1,
      from: 1,
      to: 1,
    })),
    ...Array.from(section.querySelectorAll<HTMLElement>('[data-group]'), (element) => ({
      element,
      group: true,
      value: element.hasAttribute('data-shown') ? 1 : 0,
      from: 0,
      to: 0,
    })),
  ];

  const wide = window.matchMedia(WIDE);
  let choice = wide.matches ? 'all' : first;
  let frame = 0;
  let timer = 0;
  let last = 0;
  const motion: SpringState = { value: 0, velocity: 0 };

  const target = (part: Part, effective: string): number => {
    const domain = part.element.dataset.domain ?? part.element.dataset.group ?? '';
    if (part.group) return domain === effective ? 1 : 0;
    return effective === 'all' || domain.split(' ').includes(effective) ? 1 : RECEDED;
  };

  const write = (part: Part, shown: boolean): void => {
    const { element } = part;
    if (part.group) {
      element.toggleAttribute('data-shown', shown);
      element.style.opacity = shown && part.value < 1 ? String(part.value) : '';
      element.style.transform = shown && part.value < 1 ? `translateY(${(1 - part.value) * LIFT}px)` : '';
    } else {
      element.style.opacity = part.value < 1 ? String(part.value) : '';
    }
  };

  const paint = (progress: number): void => {
    parts.forEach((part) => {
      const low = Math.min(part.from, part.to);
      const high = Math.max(part.from, part.to);
      part.value = Math.min(high, Math.max(low, part.from + (part.to - part.from) * progress));
      write(part, !part.group || part.value > 0 || part.to > 0);
    });
  };

  const finish = (): void => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    frame = 0;
    paint(1);
    parts.filter((part) => part.group).forEach((part) => write(part, part.to === 1));
    delete section.dataset.forming;
  };

  const tick = (now: number): void => {
    const moving = stepSpring(motion, 1, spring.snappy, Math.max(0, Math.min((now - last) / MS, LONGEST_STEP)));
    last = now;
    if (!moving) {
      finish();
      return;
    }
    paint(motion.value);
    frame = window.requestAnimationFrame(tick);
  };

  const show = (next: string, animate: boolean): void => {
    const effective = !wide.matches && next === 'all' ? first : next;
    choice = effective;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    section.dataset.filter = effective;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === effective)));
    parts.forEach((part) => {
      part.from = part.value;
      part.to = target(part, effective);
    });
    if (!animate || reducedMotion()) {
      finish();
      return;
    }
    motion.value = 0;
    motion.velocity = 0;
    section.dataset.forming = '';
    last = performance.now();
    // The clock, not the frames, ends it: a page too busy to draw every frame still settles inside the limit.
    timer = window.setTimeout(finish, LIMIT);
    frame = window.requestAnimationFrame(tick);
  };

  const onClick = (event: MouseEvent): void => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-filter]') : null;
    if (!button?.dataset.filter || button.dataset.filter === choice) return;
    show(button.dataset.filter, true);
    // A chip the row has cut off comes to the row's start, where the row snaps, so the choice is whole and the next one peeks.
    const row = button.closest<HTMLElement>('[data-filters="narrow"]');
    if (row && (button.getBoundingClientRect().right > row.getBoundingClientRect().right - EDGE || button.getBoundingClientRect().left < row.getBoundingClientRect().left + EDGE)) {
      button.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'instant' });
    }
  };
  const onResize = (): void => show(choice, false);

  show(choice, false);
  section.addEventListener('click', onClick);
  wide.addEventListener('change', onResize);
  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    section.removeEventListener('click', onClick);
    wide.removeEventListener('change', onResize);
  };
}
