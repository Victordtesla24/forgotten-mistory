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

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
      if (!rects.length) continue;
      const points: [number, number][] = [];
      for (const r of rects.slice(0, 3)) {
        const y = r.top + r.height / 2;
        for (const f of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * f;
          if (x >= 0 && x < vw && y >= 0 && y < vh) points.push([Math.round(x), Math.round(y)]);
        }
      }
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

async function auditViewport(page: Page, width: number, height: number): Promise<Sample[]> {
  await page.setViewportSize({ width, height });
  await page.goto('/');
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

  const failures: Sample[] = [];
  const seen = new Set<string>();
  for (let top = 0; top < total; top += height) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(350);
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
      const need = large ? 3 : 4.5;
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

test.describe('Text contrast (WCAG 1.4.3, every visible text node)', () => {
  test.describe.configure({ timeout: 240000 });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-CONTRAST-01 @ ${width}: no visible text node falls below AA against its sampled ground`, async ({
      page,
    }) => {
      const failures = await auditViewport(page, width, height);
      const report = failures
        .slice(0, 10)
        .map(
          (f) =>
            `${f.ratio.toFixed(2)}:1 (needs ${f.need}) [${f.section}] ${f.selector} — "${f.text}" ` +
            `fg ${f.fg} on bg ${f.bg} @ ${f.fontSize}px/${f.fontWeight}`,
        )
        .join('\n');
      expect(failures.length, `${failures.length} text node(s) below AA — worst ten:\n${report}`).toBe(0);
    });
  }
});
