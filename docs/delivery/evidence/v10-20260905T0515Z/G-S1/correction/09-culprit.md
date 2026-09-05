# G-S1 correction — the near-white ground, named

Task `t_g_s1c`. Reviewer FAIL-A on live `ceca1fa5` reported four nodes below AA at 1440
on `/` and `/?gl=force`: three `p.Bench_bandLabel`, and one text node measured against a
**near-white ground** — `span.Experience_roleCompany` "InfoCentric", fg `rgb(205,205,205)`
on `rgb(200,199,199)` → 1.06:1.

Reproduced locally on a fresh `npm run build:static` served at `http://127.0.0.1:5618`
before anything was changed (`02-tests-failing.log`, both paths red, four nodes each):

```
2.29:1 (needs 4.5) [skills] … span.Skills_statusLabel — "measured in production"
                              fg rgb(147,147,147) on bg rgb(223,222,220) @ 12px/400
3.63:1 (needs 4.5) [skills] … p.Bench_bandLabel — "Repositories"  fg rgb(125,125,125) on bg rgb(39,39,39)
3.96:1 (needs 4.5) [skills] … p.Bench_bandLabel — "Credentials"   fg rgb(125,125,125) on bg rgb(32,32,32)
4.05:1 (needs 4.5) [skills] … p.Bench_bandLabel — "Programmes"    fg rgb(125,125,125) on bg rgb(30,30,30)
```

The near-white node is a different element from the reviewer's (`Skills_statusLabel`
rather than `Experience_roleCompany`) with the same colour signature — a near-white,
faintly non-neutral ground, `rgb(223,222,220)` here against `rgb(200,199,199)` there.
Which node lands in it is decided by where the walk's scroll bands fall, which is why it
moves between production and a local build; the ground itself is the same object.

## There is no near-white panel

A band-walk probe reproducing `auditViewport`'s scroll bands exactly, reporting
`document.elementsFromPoint` and the masked pixel at each sample point, puts the failing
sample at **scrollY = 9000, viewport y = 28**:

```
### band scrollY=9000
  "measured in production" fg=rgb(147,147,147)
     1191,10 -> rgb(9,10,12)   1220,10 -> rgb(9,10,12)   1249,10 -> rgb(9,10,12)
     1189,28 -> rgb(226,225,223)  1216,28 -> rgb(224,224,222)  1242,28 -> rgb(223,222,220)   <<< NEAR-WHITE
    stack@1189,28
      a.nav-cv        box=[1141,28,132,39] bg=rgba(0,0,0,0)      blend=normal
      div.nav-actions box=[1141,28,228,39] bg=rgba(0,0,0,0)      blend=difference
      nav             box=[0,0,1440,96]    bg=rgba(10,11,13,0.92) blend=normal
      span.Skills_statusLabel box=[1178,2,149,36]
      td.Skills_status        box=[1144,-14,199,68]
      table.Skills_table      box=[97,-1198,1246,1623]
```

The culprit is **the site's own fixed navigation bar**, not any panel in `#experience` or
`#skills`:

- `nav` is `position: fixed; top: 0; height: 96px; z-index: 100` (`app/globals.css`),
  and once scrolled it is an opaque frosted plate at `rgba(10 11 13 / 0.92)` — which is
  why the points at y = 10 sample `rgb(9,10,12)` rather than the page ground.
- `.nav-actions` carries `mix-blend-mode: difference`, and `.nav-cv` inside it has
  `border: 1px solid var(--white)`. The pill's top border row sits at exactly y = 28.
  Differenced against the bar beneath it, `#F6F6F6` composites to about
  `|246 − 10| = 236` per channel, landing at `rgb(226,225,223)` after antialiasing —
  the near-white, faintly non-neutral ground the gate reported.
- The glyph mask the audit applies blanks `color` and `-webkit-text-fill-color`. It does
  not blank a **border**, so the pill's rim survives into the screenshot the ground is
  read from.

So the text was never dim. It was **covered**: `collectNodes` accepted any sample point
inside the viewport, including the top 96 px the fixed bar owns, and scored a glyph no
reader can see at that scroll position against the chrome sitting on top of it. The three
`Bench_bandLabel` failures are real and were fixed in CSS; this fourth one was the probe
reading the wrong surface.

Not the candidates the task listed: no canvas covers the point (`skills-bench`'s canvas
box is `[96,1267,1248,580]` at that moment, and the `/` path compiles no GLSL at all);
`--keylight` / `--rim` are unchanged in the stack; and every ancestor of the text node
from `td.Skills_status` up to `div.Skills_card` is `rgba(0,0,0,0)` or
`rgba(246,246,246,0.016)`.

## What changed

1. `components/sections/Skills/Bench.module.css` — `.bandLabel` `--ink-300` → `--mist-400`.
   The rails are lifted to #1B1B1B–#272727 by `.fieldSlot`'s 120 %-wide radial, and
   `#7D7D7D` at 11 px does not clear AA there. `#909090` measures 4.68:1 on the brightest
   of those grounds and stays a clear step below the `--mist-200` nodes it labels.
2. `tests/a11y/text-contrast.spec.ts` — a sample point is dropped when the text's own
   element is painted over by an element it does not contain (`elementsFromPoint`).
   Decorative layers opt out of hit testing (`pointer-events: none` on every canvas, on
   `.fieldSlot`, on the vignette), so they never appear in that stack and go on being
   sampled as the ground, which is their job. **No threshold moved**: AA stays 4.5 / 3.0
   and the pinned `openNote` floor stays 4.6.
3. Same file — scroll bands now overlap by 160 px, more than the bar is tall, so a row
   that falls under the chrome in one band is still measured in the next. Before the
   overlap, a row in the top 96 px had exactly one band and the occlusion guard would
   have left it unmeasured. This widens coverage rather than narrowing it.
4. Same file — `SCENE_SLOTS` gains `skills-bench`, so TC-CONTRAST-02 warms the bench
   field and photographs the band labels on the lit, animating ground a reader with a GPU
   actually gets, instead of walking past them on the CSS still.
