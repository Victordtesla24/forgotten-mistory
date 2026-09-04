/**
 * design-scale.spec.ts — runtime acceptance for the v6 design-system lock's
 * spatial / motion / type items, asserted against what the browser actually
 * computes rather than against any class name.
 *
 *   R-48 / SC-29.1  the 8-point spacing scale is a consumable token set
 *   R-46 / SC-27.1  200–450 ms interface motion, 600–1200 ms cinematic motion
 *   R-47 / SC-28.1  a modular type scale every element resolves onto, and a
 *                   55–75 character measure at every breakpoint
 *
 * Lock: docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §2.2, §2.3, §3, §4.
 * The static half of these requirements is gated by
 * scripts/validate/grid_motion_type_audit.mjs; this spec proves the rendered result.
 *
 * Serve the static export and point the suite at it:
 *   npm run build:static
 *   python3 -m http.server 5599 --directory out &
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5599 npx playwright test tests/overhaul/design-scale.spec.ts
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const BREAKPOINTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

/** The locked 8-point scale (lock §3.3). */
const SPACE_TOKENS: Array<[string, number]> = [
  ['--space-0', 0], ['--space-05', 4], ['--space-1', 8], ['--space-2', 16],
  ['--space-3', 24], ['--space-4', 32], ['--space-5', 40], ['--space-6', 48],
  ['--space-8', 64], ['--space-10', 80], ['--space-14', 112], ['--space-20', 160],
];
/** The locked 10-step modular scale (lock §2.2). */
const FS_TOKENS = ['--fs-micro', '--fs-caption', '--fs-small', '--fs-body', '--fs-lede',
  '--fs-h3', '--fs-h2', '--fs-title', '--fs-display', '--fs-name'];

/** Every authored CSS module under components/**. */
function cssModules(dir = join(ROOT, 'components'), acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) cssModules(p, acc);
    else if (p.endsWith('.css')) acc.push(p);
  }
  return acc.sort();
}

type Measure = { selector: string; ch: number; where: string };

/**
 * The declared measure of every module rule that carries one, whether it is
 * written as a literal `max-width: <N>ch` or — as R-47/SC-28.1 requires once the
 * measure is tokenised — as `max-width: var(--measure-read | --measure-display)`.
 * A token is resolved to the ch count `app/globals.css` declares for it, which
 * is only ever used to label the row: the assertion below measures what the
 * browser actually rendered.
 */
function measureTokens(): Record<string, number> {
  const globals = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
  const out: Record<string, number> = {};
  const declRe = /^\s*(--measure-[a-z-]+)\s*:\s*([^;]+);/gm;
  let d: RegExpExecArray | null;
  while ((d = declRe.exec(globals)) !== null) {
    // `66ch`, or the nominal (middle) term of a `clamp(58ch, 64ch + 0.4vw, 72ch)`.
    const chRe = /([\d.]+)ch/g;
    const chs: number[] = [];
    let c: RegExpExecArray | null;
    while ((c = chRe.exec(d[2])) !== null) chs.push(parseFloat(c[1]));
    if (chs.length === 0) continue;
    out[d[1]] = chs.length >= 3 ? chs[1] : chs[0];
  }
  return out;
}

/**
 * Pull every declared measure out of the CSS modules and turn the rule's class
 * into the selector the built page actually carries. CSS Modules hashes the
 * class to `<Module>_<class>__<hash>`, so `[class*="Module_class__"]` addresses
 * exactly the elements that rule styles.
 */
function declaredMeasures(): Measure[] {
  const tokens = measureTokens();
  const out: Measure[] = [];
  for (const file of cssModules()) {
    const mod = basename(file, '.module.css');
    const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const lines = src.split('\n');
    let selector = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const open = line.indexOf('{');
      if (open !== -1) selector = line.slice(0, open).trim() || selector;
      const m = line.match(/max-width:\s*(?:([\d.]+)ch|var\(\s*(--measure-[a-z-]+)\s*\))/);
      if (!m) continue;
      const declaredCh = m[1] !== undefined ? parseFloat(m[1]) : tokens[m[2]];
      if (declaredCh === undefined) continue;
      // Walk back to the selector that opened this block when the brace was on
      // an earlier line than the declaration.
      let sel = selector;
      if (!sel) {
        for (let j = i - 1; j >= 0 && !sel; j--) {
          const o = lines[j].indexOf('{');
          if (o !== -1) sel = lines[j].slice(0, o).trim();
        }
      }
      const cls = (sel.match(/\.([A-Za-z0-9_-]+)/) || [])[1];
      if (!cls) continue;
      out.push({
        selector: `[class*="${mod}_${cls}__"]`,
        ch: declaredCh,
        where: `${relative(ROOT, file)}:${i + 1} (${sel})`,
      });
    }
  }
  return out;
}

const MEASURES = declaredMeasures();

/** Injected into the page: resolve a custom property to its computed px length. */
const RESOLVE_LENGTH = `(name) => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;width:var(' + name + ');';
  document.documentElement.appendChild(probe);
  const declared = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const px = declared === '' ? null : probe.getBoundingClientRect().width;
  probe.remove();
  return { declared, px };
}`;

for (const bp of BREAKPOINTS) {
  test.describe(`design scale @ ${bp.name}px`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      // Entrances are staggered; let the last one land before reading computed style.
      await page.waitForTimeout(1500);
    });

    // ── R-48 / SC-29.1 ──────────────────────────────────────────────────────
    test(`R-48/SC-29.1 the 8-point scale resolves as --space-* custom properties`, async ({ page }) => {
      const resolved = await page.evaluate(
        ([tokens, fn]) => {
          const resolve = eval(fn as string) as (n: string) => { declared: string; px: number | null };
          return (tokens as Array<[string, number]>).map(([name, expected]) => ({
            name, expected, ...resolve(name),
          }));
        },
        [SPACE_TOKENS, RESOLVE_LENGTH] as const,
      );
      const missing = resolved.filter((r) => r.declared === '');
      expect(
        missing.map((m) => m.name).join(', '),
        `R-48/SC-29.1: the 8-point scale must be declared on :root so modules can consume it. ` +
        `${missing.length}/${SPACE_TOKENS.length} --space-* tokens do not resolve in the live document.`,
      ).toBe('');
      for (const r of resolved) {
        expect(
          Math.round(r.px as number),
          `R-48/SC-29.1: ${r.name} must resolve to ${r.expected}px (declared "${r.declared}")`,
        ).toBe(r.expected);
      }
    });

    // ── R-46 / SC-27.1 ──────────────────────────────────────────────────────
    test(`R-46/SC-27.1 every rendered duration sits inside an R-46 band`, async ({ page }) => {
      const offenders = await page.evaluate(() => {
        const out: string[] = [];
        const label = (el: Element) =>
          el.tagName.toLowerCase() +
          (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '');
        const ms = (v: string) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
        for (const el of Array.from(document.querySelectorAll('*'))) {
          for (const pseudo of [null, '::before', '::after']) {
            let s: CSSStyleDeclaration;
            try { s = getComputedStyle(el, pseudo); } catch { continue; }
            if (!s || s.display === 'none') continue;
            for (const [kind, list] of [
              ['transition-duration', s.transitionDuration],
              ['animation-duration', s.animationDuration],
            ] as const) {
              for (const raw of String(list || '').split(',')) {
                if (!raw.trim()) continue;
                const v = ms(raw);
                if (!Number.isFinite(v) || v === 0) continue;
                const inBand = (v >= 200 && v <= 450) || (v >= 600 && v <= 1200);
                if (!inBand) out.push(`${label(el)}${pseudo || ''}  ${kind}: ${v}ms`);
              }
            }
          }
        }
        return Array.from(new Set(out));
      });
      expect(
        offenders,
        `R-46/SC-27.1: interface motion is 200–450ms and cinematic motion is 600–1200ms. ` +
        `${offenders.length} rendered duration(s) fall outside both bands:\n  ${offenders.join('\n  ')}`,
      ).toEqual([]);
    });

    // ── R-47 / SC-28.1 — the scale ──────────────────────────────────────────
    test(`R-47/SC-28.1 every rendered font-size lands on a step of the modular scale`, async ({ page }) => {
      const { steps, strays } = await page.evaluate(
        ([tokens, fn]) => {
          const resolve = eval(fn as string) as (n: string) => { declared: string; px: number | null };
          const probeFont = (name: string) => {
            const el = document.createElement('div');
            el.style.cssText = 'position:absolute;visibility:hidden;font-size:var(' + name + ');';
            document.documentElement.appendChild(el);
            const declared = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            const px = declared === '' ? null : parseFloat(getComputedStyle(el).fontSize);
            el.remove();
            return { name, declared, px };
          };
          void resolve;
          const steps = (tokens as string[]).map(probeFont);
          const known = new Set(steps.filter((s) => s.px !== null).map((s) => Math.round((s.px as number) * 100)));
          const strays = new Map<string, string>();
          for (const el of Array.from(document.querySelectorAll('body *'))) {
            // SVG text is sized in viewBox user units, not on a rem type scale.
            if (el instanceof SVGElement) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const own = Array.from(el.childNodes)
              .filter((n) => n.nodeType === 3)
              .map((n) => (n.textContent || '').trim())
              .join('');
            if (!own) continue;
            const px = Math.round(parseFloat(cs.fontSize) * 100);
            if (known.has(px)) continue;
            const label = el.tagName.toLowerCase() +
              (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
            if (!strays.has(cs.fontSize)) strays.set(cs.fontSize, label);
          }
          return { steps, strays: Array.from(strays.entries()).map(([size, el]) => `${size} — first seen on ${el}`) };
        },
        [FS_TOKENS, RESOLVE_LENGTH] as const,
      );
      const declaredSteps = steps.filter((s) => s.declared !== '');
      expect(
        declaredSteps.length,
        `R-47/SC-28.1: the modular type scale must exist as --fs-* custom properties on :root. ` +
        `${FS_TOKENS.length - declaredSteps.length} of ${FS_TOKENS.length} do not resolve: ` +
        `${steps.filter((s) => s.declared === '').map((s) => s.name).join(', ')}`,
      ).toBe(FS_TOKENS.length);
      expect(
        strays,
        `R-47/SC-28.1: every rendered font-size must be a step of the scale. ` +
        `${strays.length} distinct size(s) are off the scale:\n  ${strays.join('\n  ')}`,
      ).toEqual([]);
    });

    // ── R-47 / SC-28.1 — the measure ────────────────────────────────────────
    test(`R-47/SC-28.1 every prose measure renders between 55 and 75 characters`, async ({ page }) => {
      const found = await page.evaluate((measures: Measure[]) => {
        const rows: Array<{ where: string; declared: number; rendered: number; fontPx: number; chars: number }> = [];
        for (const m of measures) {
          for (const el of Array.from(document.querySelectorAll(m.selector))) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0) continue;
            const chars = (el.textContent || '').trim().length;
            // A measure is a property of running text: a hairline rule carries none.
            if (chars === 0) continue;
            // `1ch` in this element's own rendered font — the same unit the
            // stylesheet asked for, measured on what the browser actually drew.
            const probe = document.createElement('span');
            probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;width:100ch;pointer-events:none';
            el.appendChild(probe);
            const chPx = probe.getBoundingClientRect().width / 100;
            probe.remove();
            const maxPx = parseFloat(cs.maxWidth);
            if (!Number.isFinite(maxPx) || chPx === 0) continue;
            rows.push({
              where: m.where,
              declared: m.ch,
              rendered: Math.round((maxPx / chPx) * 10) / 10,
              fontPx: Math.round(parseFloat(cs.fontSize) * 100) / 100,
              chars,
            });
          }
        }
        return rows;
      }, MEASURES);

      expect(
        found.length,
        `R-47/SC-28.1: no element carrying a declared ch measure rendered; the assertion would be vacuous. ` +
        `${MEASURES.length} measure(s) were parsed out of the CSS modules.`,
      ).toBeGreaterThan(0);

      // A display-size single sentence is a typographic object, not a paragraph
      // (lock §2.3), and is measured by --measure-display instead.
      const prose = found.filter((r) => r.fontPx < 24);
      const offenders = prose
        .filter((r) => r.rendered < 55 || r.rendered > 75)
        .map((r) => `${r.where}  declared ${r.declared}ch, renders ${r.rendered}ch at ${r.fontPx}px`);
      expect(
        offenders,
        `R-47/SC-28.1: running prose holds a 55–75 character measure at every breakpoint. ` +
        `${offenders.length} of ${prose.length} prose measure(s) are out of band:\n  ` +
        offenders.join('\n  '),
      ).toEqual([]);
    });
  });
}
