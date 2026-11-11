import { readFileSync } from 'node:fs';

import type { Page, Response } from '@playwright/test';

/** The page sections, in reading order. */
export const SECTION_IDS = [
  'top',
  'proof',
  'work',
  'experience',
  'capabilities',
  'about',
  'contact',
] as const;

/** The header anchors, in order: the sections a reader can jump to. */
export const NAV_ITEMS = [
  { label: 'Work', id: 'work' },
  { label: 'Experience', id: 'experience' },
  { label: 'Capabilities', id: 'capabilities' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' },
] as const;

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

/** The header rules of firebase.json, in the order Firebase Hosting applies them. */
export function readHostingHeaders(): HeaderRule[] {
  const config: { hosting: { headers: HeaderRule[] } } = JSON.parse(readFileSync('firebase.json', 'utf8'));
  return config.hosting.headers;
}

interface RedirectRule {
  source: string;
  destination: string;
  type: number;
}

/** The redirect rules of firebase.json: old addresses that still lead somewhere. */
export function readHostingRedirects(): RedirectRule[] {
  const config: { hosting: { redirects?: RedirectRule[] } } = JSON.parse(readFileSync('firebase.json', 'utf8'));
  return config.hosting.redirects ?? [];
}

/** The Content-Security-Policy Firebase Hosting sends with every page. */
export function readProductionCsp(): string {
  const header = readHostingHeaders()
    .filter((rule) => rule.source === '**')
    .flatMap((rule) => rule.headers)
    .find((entry) => entry.key === 'Content-Security-Policy');
  if (!header) throw new Error('firebase.json no longer sets a Content-Security-Policy for **');
  return header.value;
}

/**
 * Whether a Firebase Hosting `source` glob matches a request path. Only the forms
 * firebase.json uses are understood: `**` (any depth), `*` (within one segment) and
 * literal text.
 */
function matchesSource(source: string, path: string): boolean {
  const pattern = source
    .split(/(\*\*\/|\*\*|\*)/)
    .map((part) => {
      if (part === '**/') return '(?:.*/)?';
      if (part === '**') return '.*';
      if (part === '*') return '[^/]*';
      return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`^${pattern}$`).test(path);
}

/** The Cache-Control header Firebase Hosting sends for a path: the last matching rule wins. */
export function cacheControlFor(path: string): string | undefined {
  return readHostingHeaders()
    .filter((rule) => matchesSource(rule.source, path))
    .flatMap((rule) => rule.headers)
    .filter((entry) => entry.key === 'Cache-Control')
    .at(-1)?.value;
}

/**
 * The static server sends no security headers, so the production policy from
 * firebase.json is added to every document the page loads. Violations then show
 * up as the browser would report them to a reader.
 */
export async function enforceProductionCsp(page: Page): Promise<void> {
  const policy = readProductionCsp();
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': policy },
    });
  });
}

/** Waits until React has attached to the header, so clicks are never lost to a page that is not interactive yet. */
export async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const button = document.querySelector('header button');
    return button !== null && Object.keys(button).some((key) => key.startsWith('__reactProps$'));
  });
}

/**
 * Waits until React has taken over one element: its handlers are attached, so a tap on it does
 * what a reader's tap does. The header hydrates first; the hero's controls can follow later on a
 * busy machine, and a tap in between is a plain link.
 */
export async function hydratedAt(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((target) => {
    const element = document.querySelector(target);
    return element !== null && Object.keys(element).some((key) => key.startsWith('__reactProps$'));
  }, selector);
}

/** Opens a path and waits for the page to become interactive. */
export async function open(page: Page, path: string): Promise<Response | null> {
  const response = await page.goto(path);
  await hydrated(page);
  return response;
}

/**
 * The words a reader meets in each element before anything opens: the text that is not
 * hidden, not inside a closed disclosure (its summary excepted) and not zero-sized. A word is
 * a token with a letter or a digit in it.
 */
export async function visibleWordCounts(page: Page, ids: readonly string[]): Promise<Record<string, number>> {
  return page.evaluate((elementIds) => {
    const visibleWords = (root: Element): number => {
      let total = 0;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        const text = (node as Text).data.trim();
        if (!parent || !text) continue;
        let hidden = false;
        for (let el: Element | null = parent; el && el !== root.parentElement; el = el.parentElement) {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') hidden = true;
          if (el instanceof HTMLDetailsElement && !el.open) {
            const summary = Array.from(el.children).find((child) => child.tagName === 'SUMMARY');
            if (!summary?.contains(node)) hidden = true;
          }
        }
        const box = parent.getBoundingClientRect();
        if (hidden || (box.width <= 1 && box.height <= 1)) continue;
        total += text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
      }
      return total;
    };
    return Object.fromEntries(
      elementIds.map((id) => [id, visibleWords(document.getElementById(id) as Element)]),
    );
  }, ids);
}

/** Collects every console error and warning and every uncaught page error, to be asserted empty at the end of a test. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(String(error)));
  return problems;
}

/**
 * Opens the Ask Mini Vic panel from whichever control is there: the floating launcher, which a
 * phone has at every moment and a wide screen has once the hero is past, or else the header's
 * own button, which a wide screen has over the hero.
 */
export async function openAssistant(page: Page): Promise<void> {
  const launcher = page.locator('#assistant-launcher');
  if (await launcher.isVisible()) await launcher.click();
  else await page.locator('#assistant-header-button').click();
}

/**
 * Resolves once every animation the page has started has finished, so the entrance has left each
 * element where it rests and a measurement is of the layout, not of a transform on the way. It
 * waits on the browser's own record of the animations that run on the clock (the ones driven by
 * scrolling have no end), not on a time: a slow machine takes longer and a fast one does not wait
 * for nothing.
 */
export async function entranceDone(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.timeline !== document.timeline || animation.playState === 'finished'),
  );
}
