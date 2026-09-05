import { test, expect, type Page } from '@playwright/test';

/**
 * Per-text-node WCAG 1.4.3 contrast gate.
 *
 * Ported from the adversarial review's contrast probe
 * (docs/delivery/evidence/v9-20260904T2312Z/R-c1/adv/attack2.mjs) and made
 * honest about backgrounds: instead of trusting the nearest ancestor with an
 * opaque `background-color`, the ground behind every text node is sampled from
 * the composited pixels themselves. The page is screenshotted one viewport at a
 * time with every glyph made transparent, so whatever actually sits behind the
 * text — a gradient, a canvas, a translucent card over a scene — is what the
 * ratio is computed against.
 *
 * Thresholds are WCAG AA: 4.5:1 for normal text, 3:1 for large text
 * (≥ 24 px, or ≥ 18.66 px at weight ≥ 700). Disabled controls are exempt
 * (1.4.3 "incidental"); nothing else is.
 *
 * On failure the worst ten nodes are printed with a selector, both colours and
 * the ratio, so the fix is a token swap and not a hunt.
 */

type Sample = {
  selector: string;
  text: string;
  fg: string;
  bg: string;
  fontSize: number;
  fontWeight: number;
  large: boolean;
  need: number;
  ratio: number;
  section: string;
};

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

/**
 * Nodes held above AA by a stated margin, not merely at it.
 *
 * 4.5:1 is a threshold, and a node that lands on 4.496 or 4.51 has not passed or
 * failed a design decision — it has reported which frame of a shader's phase the
 * screenshot caught. `p.Experience_openNote` measured exactly 4.496:1 at 390 on
 * `?gl=force` (reviewer 62e1e10): `--mist-400` over strata the scrim had left at
 * #2A2A2A. The remedy was to give the note its own opaque ground so the number
 * stops depending on the shader at all, and this floor is what stops the ground
 * being taken away again — one frame of drift can no longer decide the gate.
 *
 * These are *additional* requirements. Nothing here relaxes the 4.5 / 3.0 AA
 * thresholds every other node is still measured against.
 */
const PINNED_FLOORS: { pattern: RegExp; min: number; why: string }[] = [
  {
    // No `\b` anchors: the audit reports hashed CSS-module paths like
    // `p.Experience_openNote__aBc12`, and `_` is a word character — so a word
    // boundary before `openNote` never matches and the floor would be dead code
    // that always passes. `pinsSeen` below is what proves it is not.
    pattern: /openNote/,
    min: 4.6,
    why: 'the open-bracket note sits over the career strata; it must clear AA with margin',
  },
];

/**
 * Which pinned floors actually matched a node on the last audit.
 *
 * A floor that matches nothing passes silently, which is the same as not having
 * it — one rename of a CSS module class and the margin this lane was opened for
 * is gone with no test going red. So the audit records what it matched and the
 * tests assert that every pin was exercised.
 */
const pinsSeen = new Set<RegExp>();

/**
 * Software rasteriser, explicitly enabled.
 *
 * This host has no GPU, and `components/gl/useGLCapability.ts` treats SwiftShader
 * as unsupported — so without these flags *and* `?gl=force` no line of GLSL is
 * ever compiled here and TC-CONTRAST-02 below would photograph the same CSS
 * still TC-CONTRAST-01 already covers. Declared at file scope because Playwright
 * refuses `launchOptions` inside a `describe` (it would force a new worker
 * mid-file); TC-CONTRAST-01 is unaffected, because it loads `/` with no query
 * and the application's own guard still classifies SwiftShader as unsupported
 * there — so that case keeps photographing the CSS still, which is its job.
 */
const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

test.use({ launchOptions: { args: GL_ARGS } });

/**
 * Every `sceneId` stamped by `components/gl/Scene.tsx`, in document order.
 *
 * `skills-bench` (66b0872) was missing here, so TC-CONTRAST-02 walked past the
 * Skills bench before its canvas had ever been asked for and photographed the
 * three `.bandLabel`s on the CSS still instead of the lit, animating field they
 * actually sit on. Warming it is what puts the band labels on the ground a
 * reader with a GPU sees.
 */
const SCENE_SLOTS = ['hero-atmosphere', 'about-field', 'career-strata', 'skills-bench'];

interface AuditOptions {
  /** What to load. `/?gl=force` is the shader path. */
  path: string;
  /** Settle before each band is photographed. */
  settleMs: number;
  /** Mount every scene before the walk starts. */
  warmScenes: boolean;
}

const STILL_PATH: AuditOptions = { path: '/', settleMs: 350, warmScenes: false };
const GL_PATH: AuditOptions = { path: '/?gl=force', settleMs: 1500, warmScenes: true };

/**
 * Scrolls every scene slot into view and waits for its canvas, so the shader a
 * band will be photographed over is compiled before the walk reaches it.
 * `Scene` mounts on an IntersectionObserver with half a viewport of lead-in and
 * releases the canvas once the slot is well past, so a scene may remount during
 * the walk — which is why each band also gets `settleMs` of its own below.
 */
async function warmScenes(page: Page) {
  for (const scene of SCENE_SLOTS) {
    const slot = page.locator(`[data-scene="${scene}"]`);
    if ((await slot.count()) === 0) continue;
    await slot.evaluate((el) =>
      el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
    );
    await page
      .locator(`[data-scene="${scene}"] canvas`)
      .waitFor({ state: 'attached', timeout: 30000 });
    await page.waitForTimeout(1500);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

/** Collect visible text nodes whose box lies inside the current viewport. */
async function collectNodes(page: Page) {
  return page.evaluate(() => {
    const out: {
      path: string;
      text: string;
      color: string;
      opacity: number;
      fontSize: number;
      fontWeight: number;
      points: [number, number][];
      section: string;
    }[] = [];

    const cssPath = (el: Element) => {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body && parts.length < 6) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          part += `#${node.id}`;
          parts.unshift(part);
          break;
        }
        const testId = node.getAttribute('data-testid');
        if (testId) part += `[data-testid="${testId}"]`;
        else {
          const cls = Array.from(node.classList).slice(0, 2).join('.');
          if (cls) part += `.${cls}`;
        }
        const parent: Element | null = node.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = parent;
      }
      return parts.join(' > ');
    };

    const effectiveOpacity = (el: Element) => {
      let o = 1;
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        o *= parseFloat(getComputedStyle(node).opacity) || 0;
        node = node.parentElement;
      }
      return o;
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let textNode: Node | null;
    while ((textNode = walker.nextNode())) {
      const text = (textNode.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 2) continue;
      const el = textNode.parentElement;
      if (!el) continue;
      if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
      if (el.closest(':disabled,[aria-disabled="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      // `opacityProperty` is in Chromium but not yet in the TS DOM lib.
      const visibilityOptions = {
        opacityProperty: true,
        visibilityProperty: true,
      } as unknown as CheckVisibilityOptions;
      if (!(el as HTMLElement).checkVisibility?.(visibilityOptions)) continue;
      const opacity = effectiveOpacity(el);
      if (opacity < 0.05) continue;
      // Visually-hidden text. The `clip: rect(0,0,0,0)` sr-only idiom
      // (components/marks/Caliper.module.css `.gloss`, which speaks the mark's
      // state to a screen reader) paints no pixel at all, but `Range` still
      // reports the unclipped rects, so the walk was sampling a ground behind
      // a glyph that is never drawn — the caliper gloss came back at 1.36:1 on
      // ?gl=force for text 1 px wide. WCAG 1.4.3 governs visible text; an
      // element clipped to a 1 px box is not it. Measured on the box, not on
      // the idiom, so any future way of hiding text is caught too.
      const box = el.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
      if (!rects.length) continue;
      // A point is only honest if the glyph it names is the thing painted
      // there. The site's chrome is `position: fixed` — `nav` is 96 px tall,
      // opaque at `rgba(10 11 13 / 0.92)` once scrolled, and carries the
      // `.nav-actions` group at `mix-blend-mode: difference`, so the white
      // border of the "Download CV" pill composites to about rgb(226,225,223)
      // over it. Text scrolled under that bar is not dim, it is *covered*: the
      // walk was reading the pill's border as the ground behind
      // `span.Skills_statusLabel` at scrollY 9000 and calling 2.29:1 on a node
      // no reader can see there (band probe, 09-culprit.md). Same idiom as the
      // `clip: rect(0,0,0,0)` exclusion above — 1.4.3 governs visible text.
      //
      // `elementsFromPoint` returns hit-testable elements front to back, so
      // anything ahead of `el` that `el` does not contain is painted over it.
      // Decorative layers opt out of hit testing (`pointer-events: none` on the
      // canvases, `.fieldSlot`, the vignette), so they never appear here and go
      // on being sampled as the ground — which is exactly their job.
      const covered = (x: number, y: number) => {
        const stack = document.elementsFromPoint(x, y);
        const idx = stack.indexOf(el);
        if (idx < 0) return true;
        return stack.slice(0, idx).some((over) => !el.contains(over));
      };

      const points: [number, number][] = [];
      for (const r of rects.slice(0, 3)) {
        const y = r.top + r.height / 2;
        for (const f of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * f;
          if (x < 0 || x >= vw || y < 0 || y >= vh) continue;
          const px = Math.round(x);
          const py = Math.round(y);
          if (covered(px, py)) continue;
          points.push([px, py]);
        }
      }
      // Nothing measurable in this band. The node is left un-`seen` so the
      // overlapping band below picks it up clear of the chrome, rather than
      // being scored against a bar it is hidden behind.
      if (!points.length) continue;

      out.push({
        path: cssPath(el),
        text: text.slice(0, 48),
        color: cs.color,
        opacity,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
        points,
        section: (el.closest('section[id]') as HTMLElement | null)?.id || 'chrome',
      });
    }
    return out;
  });
}

/**
 * How much each scroll band overlaps the one above it, in CSS px. Comfortably
 * more than the 96 px `nav` (plus its shadow) that covers the top of every
 * viewport, so no row of type is only ever offered to the walk while it is
 * hidden behind the bar.
 */
const BAND_OVERLAP = 160;

const GLYPH_MASK_ID = '__text_contrast_glyph_mask__';

async function maskGlyphs(page: Page, on: boolean) {
  await page.evaluate(
    ([id, enable]) => {
      document.getElementById(id as string)?.remove();
      if (!enable) return;
      const style = document.createElement('style');
      style.id = id as string;
      style.textContent =
        '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;' +
        'text-shadow:none!important;caret-color:transparent!important;transition:none!important}';
      document.head.appendChild(style);
    },
    [GLYPH_MASK_ID, on] as const,
  );
}

/** Decode a viewport PNG inside the page and read the pixels at the requested points. */
async function samplePixels(page: Page, png: Buffer, points: [number, number][]) {
  return page.evaluate(
    async ([b64, pts]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const scale = img.naturalWidth / window.innerWidth;
      return (pts as [number, number][]).map(([x, y]) => {
        const d = ctx.getImageData(Math.min(canvas.width - 1, Math.round(x * scale)), Math.min(canvas.height - 1, Math.round(y * scale)), 1, 1).data;
        return [d[0], d[1], d[2]] as [number, number, number];
      });
    },
    [png.toString('base64'), points] as const,
  );
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const parseColor = (value: string): [number, number, number, number] | null => {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};
const composite = (fg: [number, number, number], alpha: number, bg: [number, number, number]) =>
  [0, 1, 2].map((i) => Math.round(bg[i] + (fg[i] - bg[i]) * alpha)) as [number, number, number];

async function auditViewport(
  page: Page,
  width: number,
  height: number,
  options: AuditOptions = STILL_PATH,
): Promise<Sample[]> {
  await page.setViewportSize({ width, height });
  await page.goto(options.path);
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
  // Walk the page once so every entrance animation has fired and settled.
  const total = await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    return document.documentElement.scrollHeight;
  });
  await page.waitForTimeout(2500);
  if (options.warmScenes) await warmScenes(page);

  pinsSeen.clear();
  const failures: Sample[] = [];
  const seen = new Set<string>();
  // Bands overlap by more than the fixed chrome is tall. Stepping a clean
  // viewport at a time gave every document row exactly one band, so a row that
  // landed in the top 96 px — under `nav` — had no other chance to be measured
  // once the occlusion guard dropped it. With the overlap every row appears at
  // least once clear of the bar, and `seen` still measures it only once.
  for (let top = 0; top < total; top += height - BAND_OVERLAP) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(options.settleMs);
    const nodes = await collectNodes(page);
    const fresh = nodes.filter((n) => !seen.has(`${n.path}|${n.text}`));
    if (!fresh.length) continue;
    await maskGlyphs(page, true);
    const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
    await maskGlyphs(page, false);
    const allPoints = fresh.flatMap((n) => n.points);
    const pixels = await samplePixels(page, png, allPoints);
    let cursor = 0;
    for (const node of fresh) {
      seen.add(`${node.path}|${node.text}`);
      const fg = parseColor(node.color);
      const samples = pixels.slice(cursor, cursor + node.points.length);
      cursor += node.points.length;
      if (!fg) continue;
      let worst = Infinity;
      let worstBg: [number, number, number] = [0, 0, 0];
      let worstFg: [number, number, number] = [fg[0], fg[1], fg[2]];
      for (const bg of samples) {
        const painted = composite([fg[0], fg[1], fg[2]], fg[3] * node.opacity, bg);
        const ratio = contrast(painted, bg);
        if (ratio < worst) {
          worst = ratio;
          worstBg = bg;
          worstFg = painted;
        }
      }
      const large = node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
      // AA first, then any floor pinned for this node — whichever is stricter wins.
      const pinned = PINNED_FLOORS.find((floor) => floor.pattern.test(node.path));
      if (pinned) pinsSeen.add(pinned.pattern);
      const need = Math.max(large ? 3 : 4.5, pinned?.min ?? 0);
      if (worst < need) {
        failures.push({
          selector: node.path,
          text: node.text,
          fg: `rgb(${worstFg.join(',')})`,
          bg: `rgb(${worstBg.join(',')})`,
          fontSize: node.fontSize,
          fontWeight: node.fontWeight,
          large,
          need,
          ratio: Math.round(worst * 100) / 100,
          section: node.section,
        });
      }
    }
  }
  return failures.sort((a, b) => a.ratio - b.ratio);
}

function worstTen(failures: Sample[]): string {
  return failures
    .slice(0, 10)
    .map(
      (f) =>
        `${f.ratio.toFixed(2)}:1 (needs ${f.need}) [${f.section}] ${f.selector} — "${f.text}" ` +
        `fg ${f.fg} on bg ${f.bg} @ ${f.fontSize}px/${f.fontWeight}`,
    )
    .join('\n');
}

test.describe('Text contrast (WCAG 1.4.3, every visible text node)', () => {
  test.describe.configure({ timeout: 240000 });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-CONTRAST-01 @ ${width}: no visible text node falls below AA against its sampled ground`, async ({
      page,
    }) => {
      const failures = await auditViewport(page, width, height, STILL_PATH);
      expect(
        failures.length,
        `${failures.length} text node(s) below AA — worst ten:\n${worstTen(failures)}`,
      ).toBe(0);
    });
  }
});

/**
 * TC-CONTRAST-02 — the same audit, on the path a reader with a GPU actually gets.
 *
 * TC-CONTRAST-01 loads `/`, so on this host it photographs the CSS still and
 * never a single fragment of GLSL. That is how nine text nodes at 1440 and
 * twelve at 390 shipped below AA over the flagship scenes: company names on lit
 * strata at 1.10:1, the hero's third ledger source on the atmosphere's pool at
 * 1.34:1 (C22 09-verification.md, F2). The scenes were measured; the type over
 * them was not.
 *
 * Same algorithm, same thresholds, same walk — nothing here is relaxed. The
 * differences are the URL (`?gl=force`, which lifts the application's own
 * SwiftShader guard), a warm-up that mounts every scene before the walk starts,
 * and a longer per-band settle so a canvas that remounts as the walk passes it
 * has ramped its entrance before its band is photographed.
 */
test.describe('TC-CONTRAST-02 (WebGL path) — contrast is measured over the shaders too', () => {
  test.describe.configure({ timeout: 300000 });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-CONTRAST-02 @ ${width}: no visible text node falls below AA over the live scenes`, async ({
      page,
    }) => {
      test.setTimeout(300000);
      const failures = await auditViewport(page, width, height, GL_PATH);
      expect(
        failures.length,
        `${failures.length} text node(s) below AA on ?gl=force — worst ten:\n${worstTen(failures)}`,
      ).toBe(0);
      // The pinned floors are only a gate while they still address a node that exists.
      for (const floor of PINNED_FLOORS) {
        expect(
          pinsSeen.has(floor.pattern),
          `no text node matched ${floor.pattern} — the pinned ${floor.min}:1 floor ` +
            `(${floor.why}) measured nothing and would have passed regardless`,
        ).toBe(true);
      }
    });
  }
});
