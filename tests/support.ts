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

/** Opens a path and waits for the page to become interactive. */
export async function open(page: Page, path: string): Promise<Response | null> {
  const response = await page.goto(path);
  await hydrated(page);
  return response;
}
