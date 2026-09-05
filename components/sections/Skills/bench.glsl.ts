/**
 * The calibration bench — the field the wire diagram is measured on.
 *
 * `#skills` is the one section that shipped with no scene at all: a twenty-path
 * SVG bench drawn on nothing. The section's claim is that every capability was
 * *measured somewhere*, so the field under it is not an atmosphere — it is a
 * bench: a lit plate with a hairline graticule ruled across it, and the
 * engraving (the rails, the wires, the gold marks) sitting on top of it.
 *
 * Three things drive it, and all three come from the section's own state rather
 * than from a clock of the shader's own — the discipline `CareerStrata` and
 * `AboutField` keep:
 *
 * - `uIntensity` is the mount ramp, and it also carries the entry pulse: one
 *   wavefront runs down the plate as the bench arrives and hands over to the
 *   steady state, so the pulse can never desynchronise from the fade-in.
 * - `uHover` is 0 → 1 as the reader takes a node on either rail. The graticule
 *   brightens with it: the bench lights up along the wires being traced.
 * - `uHoverY` is that node's own height within the bench, 0 (top) → 1, so the
 *   brightening is *where the reader is looking* rather than everywhere.
 *
 * ## Why the light stops before the rails
 *
 * The two rails are real text — thirteen sources on the left, seventeen
 * capabilities on the right — and text over a lit plate is the failure this
 * whole lane exists to avoid. `across` therefore holds the plate inside the
 * middle span of the grid (`Bench.module.css` gives it `minmax(4rem, 1fr)`
 * between two fixed rails), ramping in at 0.19 and out at 0.81 of the slot.
 * Nothing bright ever reaches the columns the labels stand in. Below 900 px the
 * slot is not behind the bench at all — it is the bench plate above the list —
 * so there is no type over it to protect.
 *
 * Monochrome, and never the site's one accent: gold means a figure has a source
 * a reader can go and check, and a bench is not a figure. `#skills` spends its
 * gold on the production wires and the legend mark, and this field must not add
 * a fourteenth. The two colours arrive as uniforms from `lib/palette.ts`.
 *
 * Budget: one full-screen quad, no geometry, no textures, three value-noise
 * lookups per pixel — the ceiling every other scene here holds to — plus one
 * hash for grain.
 */

export const benchFieldVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const benchFieldFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  /** 0 → 1 as a node on either rail takes the reader's attention. */
  uniform float uHover;
  /** That node's height within the bench, 0 (top) → 1 (bottom). */
  uniform float uHoverY;
  /** 0 → 1 over the mount ramp; back to 0 if the context is lost. */
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;

  const float TAU = 6.283185307179586;
  /** Graticule pitch, in device pixels. A ruled bench, not a drawing grid. */
  const float PITCH = 38.0;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 p = vUv;
    // Screen-space, so a hairline is a hairline at every width and the pitch
    // does not stretch with the box.
    vec2 px = vUv * uResolution;

    // The plate. It stops well short of both rails — see the header — and dies
    // inside its own frame top and bottom, so the canvas rectangle is never a
    // faintly lighter box on the page.
    float across = smoothstep(0.19, 0.32, p.x) * smoothstep(0.81, 0.68, p.x);
    float down = smoothstep(-0.02, 0.15, p.y) * smoothstep(1.02, 0.85, p.y);
    float plate = across * down;

    // Three lookups, and no more. One slow wash so the plate is not a flat
    // panel; one drift along it so the light has a length; one very low
    // frequency variation so the two never beat against each other.
    float wash = noise(vec2(p.x * 2.3, p.y * 1.9 - uTime * 0.06));
    float drift = noise(vec2(p.x * 0.9 + uTime * 0.045, p.y * 1.2));
    float slow = noise(vec2(p.y * 0.7, uTime * 0.031));

    // The graticule: hairlines ruled both ways, raised to a power so each is a
    // line rather than a wave. This is what makes the field a measuring surface
    // instead of a glow.
    float gx = pow(0.5 + 0.5 * cos(px.x * TAU / PITCH), 20.0);
    float gy = pow(0.5 + 0.5 * cos(px.y * TAU / PITCH), 20.0);
    float graticule = clamp(gx + gy, 0.0, 1.0);

    // The reader's own row. Where a node is taken, the rule at its height comes
    // up — the bench lighting along the wires being traced.
    float row = exp(-pow((p.y - uHoverY) / 0.10, 2.0)) * clamp(uHover, 0.0, 1.0);

    // The entry pulse: one wavefront down the plate, carried by the mount ramp
    // so it costs no uniform and cannot drift from the fade-in.
    float phase = clamp(uIntensity, 0.0, 1.0);
    float pulse = exp(-pow((p.y - phase) * 3.2, 2.0)) * (1.0 - phase);

    // A slow breath travelling across the plate, so a bench nobody is touching
    // is still alive. It is the term the motion floor is met by at rest, and it
    // is carried by both the plate and its rules rather than by the rules
    // alone: a graticule is a quarter of the lit pixels, so a breath confined
    // to it moved a quarter of the frame and the measured mean |dL| sat on the
    // floor rather than above it.
    float breath = 0.5 + 0.5 * sin(p.x * 2.1 - uTime * 0.9);

    // The plate reads at roughly a third of the ink's own weight: below that
    // the coverage floor (15% of the slot at +0.06 relative luminance over the
    // section's own ground, which lands around 45/255 grey) is met only on the
    // graticule, and a bench whose only visible structure is its ruling is a
    // grid, not a lit surface. The mask still stops the plate well short of
    // both rails of type.
    float base = plate * (0.30 + 0.12 * wash) * (0.86 + 0.18 * drift + 0.12 * breath);
    float rules = plate * graticule * (0.34 + 0.26 * breath + 0.34 * row + 0.16 * slow);

    float luma = base + rules + plate * (0.34 * pulse + 0.22 * row);

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.012;
    luma = clamp(luma, 0.0, 1.0);

    // Light only, and the light carried by alpha alone — the mistake that cost
    // AboutField its visibility the first time was ramping the colour toward
    // white *and* setting alpha to the same figure, which paints a fraction of
    // a fraction. Where the field is dark it paints nothing at all and the
    // section's ground shows through undisturbed.
    gl_FragColor = vec4(uLight, luma * clamp(uIntensity, 0.0, 1.0));

    // uInk participates in no branch above; it is kept in the signature because
    // every scene on this site takes its two colours from lib/palette.ts and a
    // field that quietly stopped reading one of them would be the first place a
    // palette drift could hide.
    gl_FragColor.rgb = mix(uInk, gl_FragColor.rgb, clamp(luma * 4.0, 0.0, 1.0));
  }
`;
