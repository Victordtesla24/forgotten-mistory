#!/usr/bin/env python3
"""Cycle 11 source edits, applied with exact-match guards (evidence of what changed).

Every path is absolute, rooted at the cycle's worktree. Each replacement must match
exactly once or the script stops without writing anything for that file.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path('/root/forgotten-mistory/.claude/worktrees/wf_7658aeb2-d07-1')


def edit(rel, pairs):
    path = ROOT / rel
    text = path.read_text()
    for old, new in pairs:
        count = text.count(old)
        if count != 1:
            print(f'FAIL {rel}: expected exactly one match (got {count}) for:\n{old[:160]}')
            sys.exit(1)
        text = text.replace(old, new)
    path.write_text(text)
    print('edited', rel)


# ── A. Vitrine.module.css ─────────────────────────────────────────────────────
edit('components/sections/Vitrine/Vitrine.module.css', [
("""    border-bottom: 1px solid var(--token-border-default);
    scrollbar-width: thin;
    scrollbar-color: rgb(246 246 246 / 0.18) transparent;
}

.rail::-webkit-scrollbar {
    height: 3px;
}

.rail::-webkit-scrollbar-thumb {
    background: rgb(246 246 246 / 0.18);
}
""",
"""    border-bottom: 1px solid var(--token-border-default);
    /* The rail ends; it is not severed. Both edges fade over the gutter so the
       plate running off the viewport reads as continuing, not cut (council
       R-c1, C6). The mask covers the rail's own scrollbar too, which is why
       the thumb below sits inside the fade rather than under it. */
    -webkit-mask-image: linear-gradient(
        to right,
        transparent 0,
        rgb(0 0 0) var(--page-gutter, 4.5rem),
        rgb(0 0 0) calc(100% - 4rem),
        transparent 100%
    );
    mask-image: linear-gradient(
        to right,
        transparent 0,
        rgb(0 0 0) var(--page-gutter, 4.5rem),
        rgb(0 0 0) calc(100% - 4rem),
        transparent 100%
    );
}

/* A 2 px thumb on a hairline track: the horizontal affordance is visible
   without a hover (council R-c1, C6). Chromium ignores the ::-webkit-scrollbar
   pseudo-elements once the standard scrollbar-* properties are set, so those
   are declared only for engines without the pseudo-elements. */
.rail::-webkit-scrollbar {
    height: 2px;
}

.rail::-webkit-scrollbar-track {
    background: var(--card-border);
}

.rail::-webkit-scrollbar-thumb {
    background: rgb(246 246 246 / 0.32);
}

@supports not selector(::-webkit-scrollbar) {
    .rail {
        scrollbar-width: thin;
        scrollbar-color: rgb(246 246 246 / 0.32) var(--card-border);
    }
}
"""),
("""    /* Unlit plates sit back. This is the shadow half of the raking light. */
    opacity: 0.42;
""",
"""    /* Unlit plates sit back. This is the shadow half of the raking light —
       but a plate at rest is still read, and at 0.42 its captions composited
       to 1.75:1 on the page ground (council R-c1, C6). At 0.62 every text
       token below clears WCAG AA through the plate's own opacity: --white
       7.2:1, --mist-200 5.2:1, --gold-pale 5.6:1. --mist-400 (3.0:1) and
       --ink-300 (2.5:1) do not, so no text inside a plate uses them. */
    opacity: 0.62;
"""),
(""".plate:not([data-lit]):hover {
    opacity: 0.72;
""",
""".plate:not([data-lit]):hover {
    opacity: 0.8;
"""),
(""".accession {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    letter-spacing: 0.14em;
    color: var(--mist-400);
}

.repo {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    letter-spacing: 0.02em;
    color: var(--ink-300);
""",
"""/* Every text token inside a plate is --mist-200 or --white: the plate's rest
   opacity is the only dimming the captions get (see .plate). */
.accession {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    letter-spacing: 0.14em;
    color: var(--mist-200);
}

.repo {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    letter-spacing: 0.02em;
    color: var(--mist-200);
"""),
(""".metric dt {
    font-family: var(--font-mono);
    font-size: var(--fs-micro);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-300);
}
""",
""".metric dt {
    font-family: var(--font-mono);
    font-size: var(--fs-micro);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mist-200);
}

/* An open caliper on a resting plate composites through the plate's 0.62 and
   its own 0.85 value opacity — 4.1:1 in --mist-200. Inside a plate the value
   is shown at full opacity so the mark reads at rest (5.2:1). */
.metric dd [data-state='open'] {
    color: var(--mist-200);
}

.metric dd [data-state='open'] > span:nth-child(2) {
    opacity: 1;
}
"""),
(""".limits {
    margin: var(--space-05) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-caption);
    color: var(--mist-400);
}

.limitsLabel {
    display: block;
    margin-bottom: var(--space-05);
    font-family: var(--font-mono);
    font-size: var(--fs-micro);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-300);
}
""",
""".limits {
    margin: var(--space-05) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-caption);
    color: var(--mist-200);
}

.limitsLabel {
    display: block;
    margin-bottom: var(--space-05);
    font-family: var(--font-mono);
    font-size: var(--fs-micro);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mist-200);
}
"""),
(""".notDeployed {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    color: var(--ink-300);
    align-self: center;
}""",
""".notDeployed {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    color: var(--mist-200);
    align-self: center;
}"""),
])

# ── A. Drawings.module.css ────────────────────────────────────────────────────
edit('components/sections/Vitrine/Drawings.module.css', [
(""".label {
    font-family: var(--font-mono);
    font-size: 7px;
    letter-spacing: 0.1em;
    fill: currentColor;
    opacity: 0.65;
}""",
"""/* The wrapper exists so the strokes can learn their draw order; it has no box. */
.frame {
    display: contents;
}

/* ── Trace-on ────────────────────────────────────────────────────────────────
   Every stroked element carries pathLength="1", so one dash of length 1 offset
   by 1 hides it entirely. When the plate gains the raking light (data-lit) the
   offset runs to 0 over the cinematic band with the emphasised ease, staggered
   40 ms per element in document order (--k), and the labels fade up once the
   last stroke has landed. data-drawn keeps the drawing on the plate after the
   light has moved on: a mechanism is traced once, not every pass. */
.stroke {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
}

[data-lit] .stroke,
[data-drawn] .stroke {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1);
    transition-delay: calc(var(--k, 0) * 40ms);
}

/* Labels are set in --white on their own `color`, not only their fill: the
   contrast gate reads the text's computed colour, and through a resting
   plate's 0.62 the white at 0.85 composites to 5.4:1 where --mist-200 at the
   old 0.65 was 2.8:1. */
.label {
    font-family: var(--font-mono);
    font-size: 7px;
    letter-spacing: 0.1em;
    color: var(--white);
    fill: currentColor;
    opacity: 0;
}

[data-lit] .label,
[data-drawn] .label {
    opacity: 0.85;
    transition: opacity 320ms linear 900ms;
}

/* Reduced motion: the strokes and labels are simply present. The drawing is
   the plate's argument, so it is never withheld — only the tracing is. */
@media (prefers-reduced-motion: reduce) {
    .stroke,
    [data-lit] .stroke,
    [data-drawn] .stroke {
        stroke-dashoffset: 0;
        transition: none;
    }

    .label,
    [data-lit] .label,
    [data-drawn] .label {
        opacity: 0.85;
        transition: none;
    }
}"""),
])

# ── A. Drawings.tsx ───────────────────────────────────────────────────────────
path = ROOT / 'components/sections/Vitrine/Drawings.tsx'
text = path.read_text()
tagged = len(re.findall(r'<(?:line|circle|path|rect)(?=[\s\n])', text))
text = re.sub(r'<(line|circle|path|rect)(?=[\s\n])', r'<\1 pathLength="1" className={styles.stroke}', text)
# The marker head and the filled house are not strokes to trace.
for literal in (
    'd="M0,0 L6,3 L0,6" fill="none"',
    'd="M144 26 L181 63 L144 100 L107 63 Z" fill="currentColor"',
):
    old = '<path pathLength="1" className={styles.stroke} ' + literal
    assert text.count(old) == 1, literal
    text = text.replace(old, '<path ' + literal)
old_head = """'use client';

import type { DrawingId } from '@/app/data/portfolio/vitrine';
"""
new_head = """'use client';

import { useEffect, useRef } from 'react';

import type { DrawingId } from '@/app/data/portfolio/vitrine';
"""
assert text.count(old_head) == 1
text = text.replace(old_head, new_head)
old_tail = """export default function Drawing({ id }: DrawingProps) {
  const Component = DRAWINGS[id];
  return <Component />;
}"""
new_tail = """export default function Drawing({ id }: DrawingProps) {
  const Component = DRAWINGS[id];
  const frame = useRef<HTMLSpanElement>(null);

  // Draw order is document order. Each stroke learns its index once, and the
  // 40 ms stagger of the trace-on is computed from it in CSS (Drawings.module.css
  // `.stroke`), so a drawing can be re-authored without renumbering anything.
  useEffect(() => {
    frame.current
      ?.querySelectorAll<SVGElement>(`.${styles.stroke}`)
      .forEach((element, k) => element.style.setProperty('--k', String(k)));
  }, [id]);

  return (
    <span ref={frame} className={styles.frame}>
      <Component />
    </span>
  );
}"""
assert text.count(old_tail) == 1
text = text.replace(old_tail, new_tail)
path.write_text(text)
print('edited Drawings.tsx: stroked elements tagged =', tagged - 2)

# ── A. Vitrine.tsx: data-drawn, once per plate ────────────────────────────────
edit('components/sections/Vitrine/Vitrine.tsx', [
("""  const [lit, setLit] = useState(0);

  useEffect(() => {""",
"""  const [lit, setLit] = useState(0);
  // A plate's drawing is traced the first time the light reaches it and stays
  // drawn after the light has moved on (Drawings.module.css `[data-drawn]`).
  const [drawn, setDrawn] = useState<boolean[]>(() => plates.map((_, index) => index === 0));

  useEffect(() => {
    setDrawn((previous) =>
      previous[lit] ? previous : previous.map((was, index) => was || index === lit),
    );
  }, [lit]);

  useEffect(() => {"""),
("""              data-lit={index === lit || undefined}
""",
"""              data-lit={index === lit || undefined}
              data-drawn={drawn[index] || undefined}
"""),
])

# ── A. Guards: tests/e2e/vitrine.spec.ts ──────────────────────────────────────
edit('tests/e2e/vitrine.spec.ts', [
("""      expect(spread, `${row} varies by ${spread}px across the rail: ${values.join(', ')}`)
        .toBeLessThanOrEqual(2);
    }
  });
});""",
"""      expect(spread, `${row} varies by ${spread}px across the rail: ${values.join(', ')}`)
        .toBeLessThanOrEqual(2);
    }
  });

  test('TC-VIT-10: a plate traces its drawing when the light reaches it', async ({ page }) => {
    // Council R-c1 (motion, #vitrine): the drawings are the section's story —
    // what each repository does — so they are traced as the plate is lit, not
    // printed static. Scroll the rail by 700 and the third plate takes the
    // light; its first stroke must have run its dash to 0 within 1200 ms.
    const plates = page.locator(`${VITRINE} ol > li`);
    const litIndex = () =>
      plates.evaluateAll((nodes) => nodes.findIndex((n) => n.getAttribute('data-lit') === 'true'));
    const litBefore = await litIndex();
    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollBy({ left: 700, behavior: 'instant' as ScrollBehavior });
    });
    await expect.poll(litIndex, { timeout: 2000 }).toBe(2);
    expect(litBefore, 'the third plate was not the lit one before the scroll').not.toBe(2);

    const stroke = plates
      .nth(2)
      .locator('svg[role="img"] :is(path, line, circle)')
      .first();
    await expect(stroke).toHaveAttribute('pathLength', '1');
    const dashoffset = () =>
      stroke.evaluate((el) => Number.parseFloat(getComputedStyle(el).strokeDashoffset));
    await expect
      .poll(dashoffset, { timeout: 1200, message: 'first stroke of the lit plate traced to 0' })
      .toBe(0);

    // Drawn once: the light moving on does not undraw the plate.
    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    });
    await expect.poll(litIndex, { timeout: 2000 }).not.toBe(2);
    await expect(plates.nth(2)).toHaveAttribute('data-drawn', 'true');
    expect(await dashoffset()).toBe(0);
  });

  test('TC-VIT-11: under reduced motion the drawings are present, untraced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator(VITRINE).scrollIntoViewIfNeeded();
    // The fifth plate has never been lit, so it has neither data-lit nor
    // data-drawn: only the reduced-motion rule can have put its strokes at 0.
    const plate = page.locator(`${VITRINE} ol > li`).nth(4);
    await expect(plate).not.toHaveAttribute('data-lit', /.*/);
    await expect(plate).not.toHaveAttribute('data-drawn', /.*/);
    const stroke = plate.locator('svg[role="img"] :is(path, line, circle)').first();
    const style = await stroke.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { offset: Number.parseFloat(cs.strokeDashoffset), transition: cs.transitionProperty };
    });
    expect(style.offset, 'strokes are present immediately under reduced motion').toBe(0);
    expect(style.transition, 'no dash animation under reduced motion').not.toContain('stroke-dashoffset');
  });
});"""),
])

# ── B. About.module.css ───────────────────────────────────────────────────────
edit('components/sections/About/About.module.css', [
(""".sideTag {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    font-weight: 400;
    letter-spacing: var(--ls-caption);
    text-transform: uppercase;
    color: var(--ink-300);
    padding: var(--space-05) var(--space-1);
    border: 1px solid var(--token-border-default);
    border-radius: 3px;
}
""",
""".sideTag {
    font-family: var(--font-mono);
    font-size: var(--fs-caption);
    font-weight: 400;
    letter-spacing: var(--ls-caption);
    text-transform: uppercase;
    /* The open caliper draws its value at 0.85 of the mark's colour. --ink-300
       through that measured 3.7:1 (composition pass, 390); --mist-200 at 0.85
       composites to #B0B0B0 on the page ground — 8.0:1, and 6.0:1 on the
       lightest ground the list is ever drawn over. */
    color: var(--mist-200);
    padding: var(--space-05) var(--space-1);
    border: 1px solid var(--token-border-default);
    border-radius: 3px;
}
"""),
("""    .instrument {
        position: static;
        /* Below the fold on a phone the compass is a header ornament, so it
           gets less of the screen than it does beside the list. */
        max-width: 14rem;
        margin: 0 auto;
    }
""",
"""    .instrument {
        /* In flow above the list, never sticky over it: on a phone the
           instrument is a header ornament the reader scrolls past, and a
           sticky face behind the answers put the ten paragraphs over the
           dial (composition pass, 390). `top` is reset with the position so
           no later rule can pin it again. */
        position: relative;
        top: auto;
        z-index: 0;
        /* Below the fold on a phone the compass is a header ornament, so it
           gets less of the screen than it does beside the list. */
        max-width: 14rem;
        margin: 0 auto;
    }

    .list {
        position: relative;
        z-index: 1;
        background: var(--token-bg-base);
    }
"""),
])

# ── B. Compass.module.css ─────────────────────────────────────────────────────
edit('components/sections/About/Compass.module.css', [
(""".numeral {
    font-family: var(--font-mono);
    font-size: 3.4px;
    letter-spacing: 0.08px;
    fill: var(--mist-200);
    opacity: 0.75;
""",
""".numeral {
    font-family: var(--font-mono);
    font-size: 3.4px;
    letter-spacing: 0.08px;
    /* Set on `color` as well as `fill`: the contrast gate reads the computed
       colour of SVG text, and the numerals are the ten labels that identify
       the dimensions, not furniture. --white at 0.85 over the darkest ground
       the dial sits on (#0A0A0A) composites to 7.5:1; over the sector fills
       and the pool of light behind the face it stays above 4.5:1. */
    color: var(--white);
    fill: currentColor;
    opacity: 0.85;
"""),
])

# ── C. Hero: label and provenance share one cell on a phone ───────────────────
edit('components/sections/Hero/Hero.tsx', [
("""              <span className={styles.ledgerLabel}>{entry.label}</span>
              {/* Provenance sits with the figure. A number a reader cannot
                  trace is a claim, not evidence. */}
              <span className={styles.ledgerSource}>{entry.source}</span>
""",
"""              {/* One cell on a phone, two rows beside the figure elsewhere:
                  the wrapper has no box of its own above 600 px. */}
              <span className={styles.ledgerText}>
                <span className={styles.ledgerLabel}>{entry.label}</span>
                {/* Provenance sits with the figure. A number a reader cannot
                    trace is a claim, not evidence. */}
                <span className={styles.ledgerSource}>{entry.source}</span>
              </span>
"""),
])

edit('components/sections/Hero/Hero.module.css', [
(""".ledgerLabel {
    font-size: var(--fs-body);
    line-height: var(--lh-prose);
    color: var(--mist-200);
}
""",
"""/* No box above 600 px: label and source stay two rows of the entry's column. */
.ledgerText {
    display: contents;
}

.ledgerLabel {
    font-size: var(--fs-body);
    line-height: var(--lh-prose);
    color: var(--mist-200);
}
"""),
("""    .ledgerItem {
        display: grid;
        grid-template-columns: minmax(6.5rem, 6.5rem) 1fr;
        column-gap: var(--space-2);
        align-items: baseline;
        padding-top: var(--space-1);
    }

    .ledgerValue {
        grid-row: span 2;
    }
""",
"""    /* The label and its provenance share one line beside the figure: three
       two-row entries ended the first screen 76 px below the actions at
       390×844 (TC-HERO-12). One run of text each recovers ~45 px; the
       statement and the actions give up the rest. */
    .ledgerItem {
        display: grid;
        grid-template-columns: minmax(6.5rem, 6.5rem) minmax(0, 1fr);
        column-gap: var(--space-2);
        align-items: baseline;
        padding-top: var(--space-1);
    }

    .ledgerValue {
        grid-row: auto;
    }

    .ledgerText {
        display: block;
        font-size: var(--fs-small);
        line-height: var(--lh-caption);
    }

    .ledgerLabel {
        display: inline;
        font-size: inherit;
        line-height: inherit;
    }

    .ledgerSource {
        display: inline;
        margin-left: var(--space-1);
    }
"""),
("""    .statement {
        font-size: var(--fs-body);
        line-height: var(--lh-prose);
    }

    .actions {
        gap: var(--space-1);
    }
""",
"""    .statement {
        margin-top: var(--space-1);
        font-size: var(--fs-body);
        line-height: var(--lh-prose);
    }

    .actions {
        margin-top: var(--space-1);
        gap: var(--space-1);
    }
"""),
])

print('all edits applied')
