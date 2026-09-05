# G-A3 — independent live review · `rev-d19939ac-c24`

**Verdict: PASS**

| field | value |
|---|---|
| Reviewer identity | `rev-d19939ac-c24` (fresh; no AP or prior reviewer resumed) |
| Task | `t_g2_a3` |
| Live SoT | <https://forgotten-mistory.web.app/> |
| `meta[name=build-commit]` | **`d19939ac`** — asserted on every probe page load, both widths |
| Probe browser | Chrome + SwiftShader (`--use-gl=swiftshader --enable-unsafe-swiftshader`), `/?gl=force` |
| Page errors | **0** at 1440 and 390 |
| Evidence | `docs/delivery/evidence/v10-20260905T0515Z/G-REV/d19939ac/` |

Read-only review. No production code was written or modified.

---

## Primary gate — recruiter recall of `#about` is the GL field, not the radar widget

**PASS.**

Gate text: *FAIL if the only/main graphic is a ~384×384 canvas coincident with `svg.Compass`.
PASS only if, while `#about` is in view, a WebGL canvas occupies the section body plane at a
scale clearly larger than the compass chrome.*

Measured while `#about` is in view, mid-travel (the frame a recruiter actually reads):

| width | About GL canvas (CSS) | `svg.Compass` (CSS) | field ÷ compass | Listen full-bleed band |
|---|---|---|---|---|
| **1440** | **1248 × 900** @ x96 y153 — area 1 123 200 | 416 × 416 @ x96 y160 — area 173 056 | **6.49×** area, 3.0× each linear axis | 1440 × 901 — area 1 296 878 |
| **390** | 342 × 480 @ x24 y320 — area 164 160 | 224 × 224 @ x83 y320 — area 50 176 | **3.27×** area | 390 × 1018 — area 397 069 |

At 1440 the field is **86.6 % of the area of Listen's full-bleed band** — the reference plane the
gate names. It is the section body plane (`.body` inset, sticky viewport at `height:100vh`),
not a plate behind the dial. The compass sits on top as chrome, as permitted.

Not coincident with the compass: the canvas origin is x96 y153 spanning 1248×900, the compass
is 416×416 at x96 y160 — the field extends 832 px beyond the dial horizontally and 484 px
vertically, and the two are not the same box at either width.

**Decisive artifact — `screens/about-shader-isolated-1440.png`.** Every non-canvas descendant of
`#about` was set `visibility:hidden` and the canvas rect re-shot, isolating the shader from all
overlaid chrome and text. It shows a 1248×900 luminous field: rose-locked rings at the instrument
plus rays and haze travelling across the *entire* plane, far past the compass footprint. This is
the section's graphic, not a 384×384 backing plate.

Sanity check on the mount, `width-sweep.json` — the canvas mounts at every width probed, and the
desktop plane switches on at the 901 px breakpoint exactly as designed:

```
w=390   canvas 342×480      w=901   canvas 811×900
w=834   canvas 751×480      w=1024  canvas 922×900
w=900   canvas 810×480      w=1280  canvas 1152×900
                            w=1440  canvas 1248×900
```

> **Probe-artifact note, recorded for honesty.** My first pass measured `#about` canvases as
> `[]` at 1440 and would have read as a FAIL. It was a *measurement* fault, not a defect: the
> desktop sticky field needs ~5 s to mount and I had settled only 2.5 s. The width sweep (6 s
> settle) and the final run (6.5 s settle) both mount it reliably. Recorded so no later reader
> re-derives the false negative.

### Shader behaviour

- **Light follows the active dimension.** Hovering dimension 01 vs dimension 07 and diffing the
  isolated field: `meanChannelDelta 2.244`, `maxPixelDelta 168` over 54 000 sampled pixels
  (`screens/about-field-hover-dim01.png` vs `-dim07.png`, `shader-checks.json`). The field
  responds to the active sector; it is not a static wash.
- **Gold stays out of the shader — clean.** On the isolated canvas: `goldPixels 0`,
  `goldFraction 0`, **`maxSaturation 0.000`** over 105 420 sampled pixels. The field is
  perfectly achromatic. `maxLuma 0.914` confirms it is genuinely lit, not a black rectangle.
  (The un-isolated 1440 clip reads `goldFraction 0.00698` — that is the legitimate gold
  provenance text of the reading column compositing *over* the plane, not pigment in the shader.
  The isolation run is what settles it.)

---

## Hold checks — confirmed, none regressed

| gap | check | live result | status |
|---|---|---|---|
| **G-L1 C5** | greeting reading is the measured duration, not gold | `24.98 s`, colour `rgb(144,144,144)` — neutral grey, not `--gold #c9a84c`. Present at 1440 and 390 | **HOLDS** |
| **G-NEW-1** | "Ask Mini Vic" pill visible at all widths | Pill rendered and legible at **1440** and **390** — `screens/about-1440.jpg`, `screens/about-390.jpg`. See caveat below | **HOLDS** |
| **G-C1** | honest email labels, no false Book/Start promise | Action plate reads **"Email a 20-minute-call agenda"** → `mailto:` with a pre-filled agenda body. Remaining contacts are the plain address, `tel:`, LinkedIn, GitHub. No plate says "Book" or "Start a project" while backed only by mailto; no two competing mailto promises | **HOLDS** |
| **colour photo** | portrait is colour, not greyscale | `/assets/my_avatar.avif`, natural 1480 px, `maxSaturation 0.921`, `meanSaturation 0.295` | **HOLDS** |

**G-NEW-1 caveat, stated precisely.** My DOM selector matched the off-screen `skip-link
minivic-skip` element rather than the visible pill, so I did not read a `display` value off the
pill itself. The pill's *presence and visibility* at both widths is confirmed by screenshot, which
is what the gap's own tester criterion (390 screenshot) asks for. The CSS-level
`display:inline-block` assertion is therefore screenshot-based here, not computed-style-based.
Not a regression signal — flagged so the record is accurate.

---

## Verdict

**G-A3 — PASS on live `d19939ac`.** The GL field is the section body plane at 1248×900 (1440) and
342×480 (390), 6.49× and 3.27× the compass area respectively, 86.6 % of Listen's full-bleed band
at desktop. The compass is chrome over it. The shader responds to the active dimension and carries
zero gold (`maxSaturation 0.000`). Zero page errors at both widths. G-L1 C5, G-NEW-1, G-C1 and the
colour photo all hold and are not reopened.

### Artifacts

```
probe.json                              measurements, both widths, final run
width-sweep.json                        canvas mount across 390 → 1440
shader-checks.json                      isolated-shader gold + hover diff
screens/about-1440.jpg                  the recall frame, desktop
screens/about-390.jpg                   the recall frame, mobile
screens/about-shader-isolated-1440.png  shader with all chrome hidden — decisive
screens/about-field-1440.png            canvas-rect clip, un-isolated
screens/about-field-390.png             canvas-rect clip, un-isolated
screens/about-field-hover-dim01.png     active-sector response A
screens/about-field-hover-dim07.png     active-sector response B
screens/listen-1440.jpg                 full-bleed band scale reference
screens/listen-390.jpg                  full-bleed band scale reference
```
