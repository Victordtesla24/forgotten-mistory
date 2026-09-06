# W1-MV5 — the fix

`app/globals.css`, one new rule, in the MiniVic launcher block:

```css
@media (max-width: 87.4375rem) {
    .minivic-launcher {
        background: var(--ink-900);
        border-radius: 2px;
    }
}
```

## Why this and not a colour change

Nothing the launcher paints was ever too bright: the pill and the disc are both
`--ink-900` (#0A0A0A, luminance 0.0033), the portrait is held at
`brightness(0.12)` (peaks rgb(33)), the mark is white at α 0.22 (rgb(82)) and
the pip dot is `--ink-500` (rgb(60)). The failure is that the control's box is
larger than the sum of its parts, and the unpainted remainder is page. So the
control now paints its own ground across its whole footprint at the widths
where it floats over the reading column.

## Why 2px and not the capsule's 999px

A stadium of radius r leaves its own bounding box's corners r(√2 − 1) outside
the paint — 9.1px at 44px tall, 13.3px at 64px. Those corners are page, not
launcher, so a capsule ground would have left exactly the defect it was meant
to close, four times over. At 2px the unpainted corner sliver is 0.6px, under
one device pixel at DPR 1.

## What is deliberately unchanged

* the pill stays `display: inline-block` at every width — G-MV1, MONO-MV-02,
  TC-MV-LABEL-01. Nothing is hidden and no opacity is zeroed.
* the dock keeps its `pastHero` opacity gate and its `:hover` / `:focus-within`
  reveal; the reveal now brings back a dark ground, which is what it should
  have been bringing back.
* `--ink-900` is R == G == B, so MONO-MV-01 ("every colour inside the launcher
  is R==G==B and never gold") still holds.
* above 87.5rem the page's own 96px gutter holds the disc clear of the measure,
  so the launcher keeps its transparent ground there and the portrait and mark
  stay at full value.

## Measurements (probe-occlude02.mjs, the spec's own measurement)

| viewport | state  | brightest pixel in the launcher's box | luminance | ceiling | pixels over ceiling |
|----------|--------|---------------------------------------|-----------|---------|---------------------|
| 390x844  | closed | rgb(182,182,182) → **rgb(60,60,60)**  | 0.4678 → **0.0452** | 0.0968 | 172/1659 → **0/1659** |
| 390x844  | hover  | **rgb(60,60,60)**                     | **0.0452** | 0.0968 | **0/1659** |
| 640x844  | closed | **rgb(60,60,60)**                     | **0.0452** | 0.0968 | **0/2790** |

rgb(60,60,60) is `--ink-500` — the status pip, which is the brightest thing the
closed launcher is supposed to paint at phone widths.
