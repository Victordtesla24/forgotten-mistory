# art-direction

Findings: (1) Current site, read live on 2026-11-10 (HTML and CSS): Inter, Source Serif 4 and IBM Plex Mono at 10-13px for many labels, grey-on-black with a gold #c9a84c accent. The CSP header is img-src 'self' data: blob: https:, font-src 'self' data:, script-src 'self' 'unsafe-inline' 'unsafe-eval'. So data: URIs (inline noise, SVG) are allowed and Google fonts must go through next/font. Its sections are Hero, About (ten-dimension compass), Experience (to-scale timeline), Skills (calibration card), six featured repos, Contact. Its existing language is already 'instrument-like': calibration, to scale, measured vs simulated. (2) Patterns that read as sophisticated in the sites I opened: Linear derives themes from base, accent and contrast in LCH, deliberately reduces accent use, uses Inter Display for headings and regular Inter for text, and designs first in black/white opacities. Linear's page flow is announcement pill, headline plus real product UI, logo strip, three numbered pillars, big mockups, a changelog as dated rows, two named quotes, one bold number ('over 50,000 product teams') and a closing CTA. Stripe puts four large numerals in a row with small labels and uses case-study cards with a headline result. Vercel states metrics inside customer sentences instead of a stat grid. Raycast uses one physical metaphor (the keyboard) as a hero object, shows realistic UI mockups, and presents named testimonials and one crisp reliability figure. Brittany Chiang's site is a single quiet column of About, Experience, Projects and Writing, with numbered experience entries carrying date, role, one line and tags. 2026 trend write-ups (agency blogs, so weak evidence) say dark is a default identity, type is the content, bento is mainstream but contested, and grain and texture are common. (3) Platform status verified on 2026-11-10: scroll-driven animations are Baseline Newly available (web.dev, October 2026: Chrome, Safari and Firefox 159). View Transitions are Baseline per caniuse (Firefox 144+, Safari 18+, 93% usage). text-wrap: balance is at 89%. backdrop-filter is at 97%. WebGL2 is at 97%. @property is Baseline 2024. Relative colour syntax is at 88.5%. (4) Library versions from the npm registry on 2026-11-10: motion and framer-motion 14.12.0 (MIT), three 0.187.0, @react-three/fiber 9.8.2, drei 10.7.9, @paper-design/shaders-react 0.0.82 (Apache-2.0), @number-flow/react 0.6.2 (MIT), tailwindcss 4.3.5, next 16.4.6 (the brief says Next 15; do not upgrade mid-redesign), react 19.3.1. DECISION: ship Direction A, 'Calibrated Dark'. It is dark-first with a full light theme, Geist + Instrument Serif + Geist Mono, one cool blue accent plus one restrained amber, and a precision-ruler motif that reuses the owner's existing compass, to-scale timeline and calibration vocabulary. It gives the best readability and contrast for recruiters, reads as engineered rather than decorated, and the heavy visuals stay optional. Details are in recommendation 1.

## [must] 1. Art direction: ship 'Calibrated Dark' (A); keep B and C as fully specified alternates

**What:** THREE CANDIDATES. A) CALIBRATED DARK (ship). Mood: quiet, exact, instrument-grade; a senior delivery lead who also builds AI systems. Fonts: Geist (display and text, variable wght), Instrument Serif italic (one emphasised phrase per heading), Geist Mono (labels, numbers, tick scales). Dark tokens: bg #0b0d10 oklch(15.8% 0.007 258); surface #12151a oklch(19.5% 0.011 261); hairline #232830 oklch(27.5% 0.016 260); text #eceef1 oklch(94.8% 0.005 258); muted #9aa3b0 oklch(71.2% 0.022 257); accent #7c9cff oklch(71.2% 0.149 269); amber (proof and warnings only) #e8c27a oklch(83.2% 0.100 83). Light tokens: bg #f6f5f1; surface #ffffff; hairline #dcdad3; text #14161a; muted #566070; accent #2f4fd8; amber #8a5a00. Contrast I computed: dark text/bg 16.7:1, muted/bg 7.6, accent/bg 7.5, amber/bg 11.5; light text/bg 16.6, muted/bg 5.8, accent/bg 6.0, amber/bg 5.4. All pass AA for body text; hairlines are about 1.3:1 and decorative. Signature motif: a hairline measurement ruler (tick marks with mono numerals) that frames the hero and section heads, plus the existing ten-dimension compass redrawn as a precise SVG radar and the 16-year to-scale timeline as a tick-scaled axis. B) EDITORIAL LEDGER. Mood: warm, literary, trustworthy; a printed annual report. Fonts: Fraunces (variable: opsz, wght, SOFT, WONK) for display, Newsreader or Source Serif 4 for long text, Geist Mono for figures. Light-first tokens: bg #f4efe6 oklch(95.4% 0.013 82); surface #fbf8f2; line #ddd5c6; text #1b1a17 oklch(21.8% 0.006 92); muted #5d5850; accent vermilion #c2410c oklch(55.3% 0.174 38) (4.5:1 on bg, borderline AA, text only at 18px+ or bold); secondary green #1f4d3a. Dark variant: bg #14120f, text #f2ece0, muted #a39b8c, accent #ff7a45 (7.2:1), green #7fb89a. Motif: margin annotations and ledger rules with figure numbers (Fig. 1-9), like an annual report. C) AURORA GLASS. Mood: AI-lab, luminous, product-launch. Fonts: Bricolage Grotesque (opsz, wdth, wght) for display, Inter Tight for text, JetBrains Mono for labels. Dark tokens: bg #060b16 oklch(15.0% 0.026 263); surface #0d1424; line #1e2a44; text #e9eefb; muted #93a1bf; accent emerald #34d399 oklch(77.3% 0.153 163) (10.2:1); amber #f5b942. Light variant: bg #f3f6fb, text #0b1220, muted #4a5878, accent #047857 (5.1:1), amber #a16207 (about 4.5:1, bold text only). Motif: a slow mesh-gradient field behind frosted-glass bento tiles. WHY A: A is the only direction where the signature motif is data the owner already has (compass, scale, calibration), so it is meaningful rather than decorative. It stays legible with WebGL off, because the ruler is plain SVG and CSS. It matches the Linear/Vercel/Raycast discipline of one accent and neutral surfaces. B is beautiful but riskier for an AI-architecture positioning and needs a light-first QA pass. C leans on a gradient look that is already widespread and costs the most GPU.

**Why:** Hiring managers and business clients need fast legibility and a sense of rigour. A gives 7:1+ contrast, a type scale at least 16px (the current site uses 10-13px labels), and a motif tied to the owner's own claims about measurement.

**How:** Define tokens once in app/globals.css with Tailwind 4 CSS-first config: `@theme inline { --color-bg: var(--bg); ... }` and `:root{color-scheme:dark light}`. Put dark values on :root and light values under `[data-theme=light]` plus `@media (prefers-color-scheme: light){:root:not([data-theme=dark])}`. Use `light-dark()` or the CSS variable swap for the rest. Add a three-state theme toggle (system/dark/light) stored in localStorage, with an inline no-flash script (script-src allows 'unsafe-inline' today, but prefer a hashed or external file). Build the ruler as one reusable <Ruler/> SVG component (ticks every 10 units, mono labels) using currentColor at 40% opacity, with no JS.

**Libraries:** tailwindcss@4.3.5 (MIT), next/font/google (bundled with Next, MIT), geist 1.9.2 on npm is the Vercel package for the same OFL font; not needed if using next/font/google

**Licence:** Tailwind MIT; Geist SIL OFL 1.1 (verified in the vercel/geist-font repo); Instrument Serif, Fraunces, Bricolage Grotesque, Inter Tight, JetBrains Mono, Newsreader are in the Google Fonts catalogue (OFL assumed; licence files not opened).

**Cost/risk:** Zero runtime cost for the motif. The risk is design discipline: one accent only, and the amber reserved for proof and 'measured' markers. Test the light theme as a first-class theme, because recruiters on bright office screens often prefer it.

**Sources:** https://linear.app/now/how-we-redesigned-the-linear-ui https://linear.app https://github.com/vercel/geist-font https://forgotten-mistory.web.app/ https://tailwindcss.com (version from npm registry query)

## [must] 2. Typographic system: Geist + Instrument Serif accent + Geist Mono, self-hosted with next/font

**What:** Display and text in Geist (variable, wght 100-900). One italic Instrument Serif phrase per section heading (the 'Linear Inter Display for headings' move, with a serif for personality). Geist Mono for eyebrows, figures, dates, tags. Scale (fluid, 1.25-1.333 ratio): hero clamp(3rem, 1.6rem + 6vw, 6.5rem) / line-height 0.98 / tracking -0.04em / weight 500-600; h2 clamp(2rem, 1.3rem + 2.6vw, 3.5rem) / 1.05 / -0.03em; h3 1.25-1.5rem / 1.25 / -0.01em; body 1.0625rem (17px) / 1.6 / tracking 0 (add +0.01em on dark body for small sizes); eyebrow mono 0.75rem / uppercase / +0.08em. Max reading measure 62-68ch. Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs. Use `font-variant-numeric: tabular-nums` on all metrics and mono numerals.

**Why:** Linear (Inter Display for headings, Inter for body) and Vercel (Geist Core with heading/label/copy/mono classes) both separate roles rigorously. The current site's 10-13px labels and three competing families (Inter, Source Serif 4, IBM Plex Mono) are the main source of the 'audit document' feel. The serif accent adds warmth for a people-leader audience.

**How:** app/layout.tsx: `const geist = Geist({subsets:['latin'], variable:'--font-geist', display:'swap'}); const geistMono = Geist_Mono({subsets:['latin'], variable:'--font-geist-mono', display:'swap'}); const instrument = Instrument_Serif({subsets:['latin'], weight:'400', style:['normal','italic'], variable:'--font-serif', display:'swap'});` then put the three .variable classes on <html>. In globals.css: `@theme inline { --font-sans: var(--font-geist); --font-mono: var(--font-geist-mono); --font-serif: var(--font-serif); }`. Set preload:false on Instrument Serif and Geist Mono if they are below the fold so only Geist is preloaded for LCP. next/font downloads at build time and serves from your own origin, so font-src 'self' is satisfied. Keep adjustFontFallback at its default (true) to avoid CLS.

**Libraries:** next/font/google (Next 15), Geist, Geist Mono, Instrument Serif

**Licence:** Geist and Geist Mono: SIL OFL 1.1 (repo verified); Instrument Serif: OFL assumed (Google Fonts), file not opened.

**Cost/risk:** Three font families add roughly three requests; only Geist is critical. Actual file sizes are unverified. Instrument Serif has no weight axis (400 and 400 italic only), so never fake bold. If you want to cut a family, drop Instrument Serif and use Geist italics.

**Sources:** https://nextjs.org/docs/app/api-reference/components/font https://github.com/vercel/geist-font https://vercel.com/geist/typography https://linear.app/now/how-we-redesigned-the-linear-ui https://fonts.google.com/metadata/fonts (Geist, Geist Mono and Instrument Serif present; axes read from it)

## [must] 3. Colour and depth: oklch tokens, neutral surfaces, one accent, hairline borders, restrained glow

**What:** Generate surfaces from three inputs (base hue, accent, contrast) in oklch, as Linear does in LCH. Keep neutrals at hue about 258 and chroma <= 0.02. Elevation steps in dark mode: L 15.8% (bg), 19.5% (card), 23% (raised), with 1px borders of `color-mix(in oklch, white 8%, transparent)` and an inner top highlight `inset 0 1px 0 color-mix(in oklch, white 6%, transparent)`. Shadows tight and only on floating layers. Accent used only on links, focus rings, active states and one hero word. Add a faint noise layer (inline SVG feTurbulence at 3-4% opacity as a data: URI, which the live CSP allows) on the page background and the hero only, and a radial accent glow (accent at 12% opacity, 600px, blurred) behind the hero. Focus ring: 2px accent plus 2px offset, always visible.

**Why:** Linear explicitly reduced accent use for a 'neutral and timeless' look and prototyped in opacities of black and white first. Raycast keeps borders at roughly 6-10% white and a single sparse accent (third-party extraction, treat values as approximate). This is how the premium dark look is produced without gradients everywhere, and it keeps contrast high.

**How:** Tokens as CSS variables in oklch with a hex fallback line before them for the 12% of browsers without oklch relative colour (88.5% have relative colour syntax per caniuse; plain oklch() is older and wider). Derive hover and border colours with `color-mix(in oklch, var(--fg) 8%, transparent)`. Use `@media (prefers-contrast: more)` to raise border alpha to 30% and muted text to the fg token. Use `@media (forced-colors: active)` to drop glows and keep borders. Verify with an automated axe/Lighthouse pass plus a manual check of the muted/surface pair (7.2:1 dark, 6.4:1 light for A).

**Libraries:** tailwindcss@4.3.5 (CSS-first @theme), no runtime library needed

**Licence:** MIT (Tailwind); CSS only otherwise.

**Cost/risk:** backdrop-filter is at 97% support but blur on large areas is GPU-costly on low-end phones; use it only on the sticky nav and at most two cards, with a solid-colour fallback via @supports not (backdrop-filter: blur(1px)). Never put glow behind body text.

**Sources:** https://linear.app/now/how-we-redesigned-the-linear-ui https://design.hagicode.com/designs/raycast/DESIGN.md (third-party, approximate) https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/css-relative-colors.json https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/css-backdrop-filter.json

## [must] 4. Hero: typographic statement with a live 'evidence' object, not a full-screen 3D scene

**What:** Left-aligned 7/12-column hero. Eyebrow in mono ('Melbourne - Delivery leadership and AI architecture'). H1 in Geist 600 with one Instrument Serif italic phrase, for example 'I run delivery for programs that cannot slip, and build the AI that helps them.' Sub line of one sentence, then two buttons (primary 'See selected work', secondary 'Download CV') and one proof line in mono ('16 years - ATO, ANZ, NAB, Microsoft, Telstra - 38 public repos'). Right 5/12 columns: a framed 'evidence panel' (rounded-2xl, 1px hairline) containing the ten-dimension radar, which animates its polygon once on load (stroke-dashoffset, 900 ms) and shows 3 live-feeling figures. A hairline ruler runs along the hero's bottom edge. Portrait moves out of the hero into the About bento (see rec 9). On mobile the panel stacks under the CTAs and the radar is static.

**Why:** Linear leads with a clear headline plus real product UI; Raycast leads with one physical object tied to its message. For this owner the 'object' is the job-fit compass, which already exists on the live site. LCP stays text (fast), the visual is SVG (no WebGL dependency), and readability does not depend on any enhancement.

**How:** Server Component hero with the headline in static HTML. Radar as an inline SVG generated at build time from the ten dimension values (polygon points computed in TS). Animate with CSS (`@keyframes` on stroke-dashoffset, `@media (prefers-reduced-motion: reduce){animation:none}`), no JS. Optional WebGL backdrop is layered by rec 8 behind it. Preload only Geist. Keep hero image-free so LCP is the H1 text.

**Libraries:** none required (React 19 Server Components, inline SVG)

**Licence:** n/a

**Cost/risk:** Near zero. The risk is copy, not code: the headline must be a claim the owner can defend, and the radar scores must be labelled (self-assessed vs evidenced), consistent with the current site's measured/simulated markers.

**Sources:** https://linear.app https://www.raycast.com https://forgotten-mistory.web.app/ https://web.dev/articles/inp (INP thresholds: good <= 200 ms, poor > 500 ms)

## [must] 5. Proof system: figures strip, employer wordmarks, three outcome cards, honest evidence labels

**What:** Directly under the hero: a four-figure row (Stripe pattern) set in Geist Mono tabular numerals at 40-56px, label 13-14px below. Use only figures with a defensible source, for example 16 years, 5 enterprise employers, 38 public repos, and one measured delivery outcome (the ATO ~92% evidence-effort reduction on 200+ SIT scenarios from the current site). Under that, a text-wordmark strip of employers (ATO, ANZ, NAB, Microsoft, Telstra) in muted Geist at 15-16px, no logo images (avoids trademark and licence issues, no extra requests). Then three outcome cards (context - action - result - 'how it was measured') in the Linear 'numbered pillars' pattern (Fig 1.1, 1.2, 1.3). Each metric carries a small status chip ('Measured in production' / 'Measured, non-production' / 'Simulated') reusing the current site's calibration vocabulary. One or two named quotes if available, never invented.

**Why:** Stripe uses four big numerals plus case-study cards with a headline result; Vercel states metrics inside customer sentences; Linear uses one bold number and two named quotes. A delivery leader is judged on outcomes, so outcome-first cards beat a skills table. The status chips turn the owner's existing honesty into a trust signal.

**How:** Data in a typed `proof.ts` array; one <Stat/> and one <OutcomeCard/> component. Count-up with @number-flow/react (`<NumberFlow value={92} suffix='%' />`, respectMotionPreference defaults to true) triggered by IntersectionObserver or motion's useInView, firing once. Provide the final value in static HTML so it is readable without JS. Add `aria-label` text with the full sentence on each stat.

**Libraries:** @number-flow/react 0.6.2, motion 14.12.0 (useInView)

**Licence:** @number-flow/react MIT (npm registry); motion MIT.

**Cost/risk:** NumberFlow is about 25 KB unpacked (npm unpackedSize; gzipped size unverified). Skip it and use a CSS counter if the budget is tight. Biggest risk is unsubstantiated numbers: only publish figures the owner can source.

**Sources:** https://stripe.com https://vercel.com https://linear.app https://number-flow.barvian.me https://forgotten-mistory.web.app/

## [should] 6. Bento sections with spotlight hover, glow borders and consistent 12-column rhythm

**What:** Use bento only where content is heterogeneous: the 'What I do' block (delivery leadership / AI architecture / GitHub activity / stack / portrait / contact). 12-column grid, 8px base unit, section padding clamp(80px, 10vw, 160px), card gap 16-20px, card radius 20px, content padding 24-32px. Tile spans: 6+6, 4+4+4, 8+4, with at most two tile sizes per row. Interaction: a cursor-tracked spotlight (radial-gradient at --mx/--my CSS variables, 8% accent) and a border glow that brightens on hover; a conic-gradient 'beam' border on one hero-level card using a registered @property --angle animated 360deg over 8 s. Tiles are real links or buttons only when they act as such, with a visible focus ring.

**Why:** Bento is the mainstream 2025-2026 portfolio layout (agency trend write-ups list portfolio landing pages as a good fit), but one source warns of a backlash toward raw layouts, so use it with restraint. Linear's feature section is effectively a loose bento of mockups; Raycast uses card grids for extensions and developer features.

**How:** Spotlight: a single pointermove handler on the grid container sets --mx/--my on the hovered card (pointer: fine only; skip on touch). Beam: `@property --angle{syntax:'<angle>';inherits:false;initial-value:0deg}` + `animation: spin 8s linear infinite` on a pseudo-element with `mask` for the 1px ring; wrap in `@media (prefers-reduced-motion: no-preference)`. Fall back to a static 1px border where @property is unsupported (it is Baseline 2024, so rare).

**Libraries:** CSS only; optional motion 14.12.0 for entrance stagger

**Licence:** n/a / MIT

**Cost/risk:** A pointermove handler is cheap if it writes only two CSS variables (use rAF throttling). Animated conic masks repaint continuously; limit to one element and pause when off-screen (animation-play-state via IntersectionObserver). Do not copy Aceternity/Magic UI components without checking each component's licence (unverified).

**Sources:** https://developer.mozilla.org/en-US/docs/Web/CSS/@property https://fireart.studio/blog/the-best-web-design-trends/ https://www.raycast.com https://linear.app

## [must] 7. Motion system: motion 14 with LazyMotion, MotionConfig reducedMotion='user', plus native scroll-driven CSS

**What:** Two layers. (a) Entrances and layout (section fade-up 12-16px, 400-600 ms, easing cubic-bezier(0.22, 1, 0.36, 1), 60-80 ms stagger, once only) via motion's `m` component under LazyMotion. (b) Scroll-linked effects (reading-progress bar in the nav, ruler ticks sliding in, timeline bars growing as they enter view) with native CSS `animation-timeline: scroll()` / `view()` and `animation-range: entry 0% cover 40%`, because scroll-driven animations are now Baseline Newly available (Chrome, Safari, Firefox 159). Wrap in `@supports (animation-timeline: view())`, with the content fully visible by default (no opacity:0 in base CSS). Section-to-section state changes (e.g. role expand) use the View Transitions API where supported (Baseline, 93% usage).

**Why:** Native scroll-driven CSS runs off the main thread, which protects INP (good <= 200 ms), and removes a JS scroll library. The motion library gives a React-friendly API with documented reduced-motion behaviour: reducedMotion='user' disables transform and layout animations but keeps opacity and colour changes.

**How:** `import { LazyMotion, domAnimation, m, MotionConfig } from 'motion/react'` (package name is now `motion`; framer-motion 14.12.0 is the same release line, so the existing install keeps working but new imports should use motion/react). Wrap the app in `<MotionConfig reducedMotion='user'><LazyMotion features={domAnimation} strict>`. Replace `motion.div` with `m.div` everywhere (strict mode enforces it). For CSS scroll effects: `@media (prefers-reduced-motion: no-preference){ @supports (animation-timeline: view()) { .reveal{animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 35%;} } }`. Duration and distance rules: never animate layout properties; transform and opacity only.

**Libraries:** motion 14.12.0 (import from motion/react), native CSS scroll-driven animations, View Transitions API

**Licence:** motion MIT (repo and npm).

**Cost/risk:** Per motion.dev: the full `motion` component is about 43 KB minimum after tree shaking, while `m` under LazyMotion is just over 5 KB initial plus 24 KB for domAnimation (loaded async), so use LazyMotion. Scroll-driven CSS has no polyfill cost because content is visible by default. Risk: Firefox 159 is new, so older Firefox users get static content (acceptable).

**Sources:** https://motion.dev/docs/react-reduce-bundle-size https://motion.dev/docs/react-accessibility https://github.com/motiondivision/motion https://web.dev/blog/web-platform-10-2026 https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/view-transitions.json

## [should] 8. Optional WebGL layer: one lazy-loaded shader or R3F field behind the hero, with static fallback

**What:** One enhancement only. Preferred: a slow, low-contrast grain-and-mesh gradient backdrop (accent at 10-15% on the dark bg) rendered with @paper-design/shaders-react (zero-dependency canvas shaders, Apache-2.0). Alternative if you want a constellation: an R3F point field of about 400 instanced points forming the 'delivery graph' (employers and 38 repos as labelled nodes), idle when off-screen. The static fallback is a pre-rendered radial-gradient plus noise in CSS, used for no-WebGL, reduced-motion, save-data, and viewports under 640px.

**Why:** The brief asks for advanced visuals, but WebGL must not carry content. A background that degrades to CSS keeps LCP and readability intact, and the stack already has three/R3F installed. Paper Shaders is lighter than a full three.js scene for a background effect.

**How:** Client component loaded with `next/dynamic(() => import('./HeroField'), { ssr:false, loading: () => <StaticField/> })`, mounted only after `requestIdleCallback` and only when `matchMedia('(prefers-reduced-motion: no-preference)').matches`, `!navigator.connection?.saveData`, and WebGL2 is available (97% support). Pause with IntersectionObserver. For R3F: `<Canvas frameloop='demand' dpr={[1,1.5]} gl={{antialias:false, powerPreference:'low-power'}}>`, use instancedMesh (the R3F docs advise a few hundred draw calls at most and instancing), PerformanceMonitor to drop dpr on decline, call invalidate() only while visible. Mark the canvas aria-hidden and decorative. Test on a mid-range Android profile for INP.

**Libraries:** @paper-design/shaders-react 0.0.82, three 0.187.0 / @react-three/fiber 9.8.2 / @react-three/drei 10.7.9 (already installed), @react-three/postprocessing 3.2.2 (optional, skip on mobile)

**Licence:** Paper Shaders Apache-2.0 (README: commercial use without visible attribution); three, R3F, drei, postprocessing wrapper MIT; the underlying `postprocessing` library is Zlib (npm registry).

**Cost/risk:** Paper Shaders is pre-1.0 (0.0.82), so pin the exact version and wrap it in an error boundary. three alone is about 21 MB unpacked on npm but tree-shakes to far less; the shipped size is unverified, so measure with @next/bundle-analyzer. Budget: the lazy chunk should stay under about 150 KB gzipped (my target, not a sourced figure). GPU use continues while visible, so keep to one canvas.

**Sources:** https://github.com/paper-design/shaders https://r3f.docs.pmnd.rs/advanced/scaling-performance https://github.com/pmndrs/react-three-fiber https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json

## [should] 9. Section sequencing, nav and portrait treatment for a one-page portfolio

**What:** Order: Hero (statement + radar) -> Proof strip (figures + employers) -> Selected outcomes (3 cards) -> AI systems (6 featured repos as bento tiles with one schematic each and a 'stated limits' line) -> Experience (to-scale timeline, then an expandable list) -> Capabilities (condensed to a two-column list, not a 17-row table) -> About (portrait + short bio + how I work) -> Contact (one primary action: email or 20-minute call, with the Melbourne coffee line as a human note) -> Footer (privacy, terms, disclosure). Nav: a slim sticky bar with name, 5 anchors, theme toggle and a 'Contact' button, active section highlighted by IntersectionObserver. Portrait: 4:5 crop, rounded-2xl, 1px hairline, subtle accent-tinted duotone overlay at 8-10%, grain, no autoplay; any 'play' or voice feature is opt-in, never on load. Keep the synthetic-media disclosure visible next to the control.

**Why:** Linear's order is claim -> proof -> depth -> social proof -> CTA; Brittany Chiang's site shows the About/Experience/Projects/Writing order that recruiters scan. Moving the portrait out of the hero lets text and proof carry the first screen. An opt-in voice feature avoids WCAG 1.4.2 autoplay issues; the live site's Permissions-Policy allows microphone=(self), so keep that scoped to the assistant feature.

**How:** Single page.tsx composed of Server Component sections with ids, plus `scroll-margin-top` equal to nav height and `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`. Skip link as first focusable element. Use next/image with `images.unoptimized: true` (static export cannot use the default loader) and pre-sized WebP/AVIF files generated at build with sharp for the portrait, with explicit width/height to prevent CLS.

**Libraries:** next (static export), sharp (build-time image prep, Apache-2.0, not verified in this session)

**Licence:** MIT (Next); sharp Apache-2.0 (from memory, unverified).

**Cost/risk:** Low. The expandable timeline and tabs must use native <details> or proper ARIA (button + aria-expanded) so they work with keyboard and screen readers. Restraint on sections is the risk: more sections lower conversion, so merge or cut Skills first.

**Sources:** https://linear.app https://brittanychiang.com https://nextjs.org/docs/app/guides/static-exports https://forgotten-mistory.web.app/

## [must] 10. Performance and accessibility guardrails as part of the design system

**What:** Hard budgets: LCP < 2.5 s (H1 text as LCP, Geist preloaded, no hero image), CLS < 0.05 (explicit dimensions, adjustFontFallback, reserved height for the radar), INP <= 200 ms (web.dev 'good' threshold; no long tasks above 50 ms during scroll, lazy WebGL after idle). Accessibility: body 17px+, line-height 1.6, AA contrast for text (verified for A above), 3:1 for UI components, visible focus ring, 24px minimum target size (WCAG 2.2 AA 2.5.8), skip link, landmark roles, reduced-motion respected in all three layers (motion MotionConfig, CSS media query, WebGL gate), and the no-JS render shows all content (progressive enhancement). Add `@media (prefers-contrast: more)` and `forced-colors` handling.

**Why:** These are the owner's stated hard constraints. The current CSP already allows what is needed (self-hosted fonts, data: images), so the design can meet them without exceptions.

**How:** CI per deploy: Lighthouse CI (mobile profile, throttled), axe-core via Playwright on dark and light themes and with reduced-motion emulation, a no-WebGL run (launch Chromium with --disable-gpu or block webgl via init script), and a bundle report with @next/bundle-analyzer. Fail the build on regressions beyond the budgets above. Keep screenshots as artefacts so each deploy shows the visible UI change.

**Libraries:** @lhci/cli (Apache-2.0, from memory), @axe-core/playwright (MPL-2.0, from memory), @next/bundle-analyzer (MIT, from memory)

**Licence:** Licences for the three CI tools are recalled from memory and not verified in this session; all are free for commercial use to my knowledge.

**Cost/risk:** Minutes added to CI; worth it. Lab Lighthouse does not measure INP, so also test interactions manually or with Playwright traces.

**Sources:** https://web.dev/articles/inp https://nextjs.org/docs/app/guides/static-exports https://forgotten-mistory.web.app/ (live CSP header read 2026-11-10)

## [could] 11. Command palette and quiet micro-interactions (optional polish)

**What:** A Cmd/Ctrl+K palette (Linear, Vercel and Raycast all treat it as a signature) listing sections, Download CV, email, GitHub, theme toggle. Add a visible 'Search or jump (K)' hint in the nav so it is discoverable on desktop and hidden on touch. Micro-interactions: click-to-copy email with a 'Copied' state (as on rauno.me), link underlines that animate from the left, buttons with 1-2px translate on press, and tick-mark hover on timeline bars.

**Why:** It signals engineering craft to the technical half of the audience at low cost, and it doubles as a keyboard-first navigation path.

**How:** Build with the native <dialog> element plus a small filtered list (role='combobox'/'listbox' or a labelled menu) rather than a heavy dependency; or use the `cmdk` package if you prefer (licence and version not verified here). Trap focus, close on Escape, restore focus on close, and ensure every action is also reachable without the palette.

**Libraries:** native <dialog>, cmdk (optional, unverified)

**Licence:** cmdk: MIT to my knowledge, unverified.

**Cost/risk:** About 100-150 lines of code. Risk is accessibility: a hand-rolled combobox is easy to get wrong, so test with a screen reader or use the maintained library.

**Sources:** https://mcpservers.org/agent-skills/cloudflare/frontend-design-saas (third-party summary naming Cmd-K as a Linear/Vercel/Raycast pattern) https://rauno.me

## Avoid
- Full-screen interactive 3D worlds (Bruno Simon style) as the main experience: they win Awwwards (his portfolio appears with Portfolio Honors and Site of the Month on Awwwards listings), but they hurt LCP and INP on mobile and are hard to make accessible. This audience wants to scan outcomes in 60 seconds.
- Hosted visual builders and embeds (Spline, Unicorn Studio, Lottie CDN players, Framer embeds): third-party scripts conflict with script-src 'self' and the requirement that everything ships from npm at build time; they also add network dependency.
- GSAP as the default animation engine: the licence is Webflow's 'Standard no-charge' licence, not OSI open source, with a no-reverse-engineering clause, Webflow ownership of the IP, and terms Webflow can change (you can then only use versions released before the change). Free for commercial use per gsap.com, but it fails the 'free/open-source' bar. Native scroll-driven CSS plus motion (MIT) covers every effect in this brief.
- Lenis or other smooth-scroll hijacking: Lenis (MIT) honours prefers-reduced-motion by default, but it still wraps native scroll, adds main-thread work, and can interfere with anchor links and nested scrollers (the repo itself lists iframe and nested-container limits). Scroll-driven CSS is now Baseline, so it is not needed. Treat as optional and measure INP before adding.
- Tiny type and low-contrast 'audit document' styling (10-13px mono labels, grey-on-black, gold accent) as found on the current site: it fails readability on mobile and in bright rooms; raise the minimum to 12-13px for mono labels only and 16-17px for all reading text.
- Gradient-everything 'AI aurora' backdrops, heavy glassmorphism and bloom post-processing on mobile: costly on GPU and now a cliche (Direction C only works if contained to one hero field). The `postprocessing` library (Zlib licence) is heavy; skip it on phones.
- Neo-brutalist or 'raw HTML' counter-trend styling for this audience: one 2026 trend source explicitly advises skipping it where legibility and conversion matter.
- Custom cursors, cursor-following blobs and parallax on text: they hurt accessibility, add main-thread work, and add nothing for recruiters.
- Autoplaying voice or video greetings: violates WCAG 1.4.2-style expectations and surprises users; keep the cloned-voice and avatar features opt-in only with the disclosure adjacent.
- Content that exists only in WebGL or JS-driven reveals (opacity:0 in base CSS): breaks no-JS, no-WebGL and reduced-motion users. Base state must be fully visible.
- Logo images of employers (ATO, ANZ, NAB, Microsoft, Telstra): trademark and permission risk, extra requests, and inconsistent optical weights; use set text wordmarks and link to case-study text instead.
- Copy-pasting component-library snippets (Aceternity, Magic UI and similar) without checking each licence and its dependencies: licences and attribution rules vary, and many pull in extra animation libraries.

## Unverified
- Gzipped and actual shipped sizes of Geist, Geist Mono, Instrument Serif (per-subset woff2), @paper-design/shaders-react, @number-flow/react, and the R3F/three chunk after tree-shaking. Only npm unpackedSize and motion.dev's published sizes (43 KB motion, ~5 KB + 24 KB LazyMotion) were confirmed.
- The Instrument Serif OFL licence file and Bricolage, Fraunces, Inter Tight, JetBrains Mono, Newsreader licence files were not opened; they are Google Fonts catalogue entries (presence and axes confirmed from fonts.google.com/metadata/fonts) and I assume OFL.
- Exact release dates and changelogs for motion 14, R3F, three and Paper Shaders: the GitHub release pages were empty in the fetch; only the npm registry's version and time.modified were read. Paper Shaders is at 0.0.82, i.e. pre-1.0 with unknown API stability.
- Licences and versions of cmdk, sharp, @lhci/cli, @axe-core/playwright, @next/bundle-analyzer were not checked in this session.
- Whether next/font/google preloads only the first-used font file when several families are in the root layout; the docs say fonts in the root layout preload on all routes, so set preload:false for below-the-fold families.
- Firefox scroll-driven animation support details beyond the web.dev statement 'Firefox 159 ... Baseline Newly available'; the caniuse data file for it did not load, so exact usage percentage is unknown. Also unconfirmed: any bugs in Safari with animation-range on sticky elements.
- Specific colour, font and spacing values used by Linear, Vercel, Stripe, Raycast: the fetch tool could not read their CSS. Colour and tracking values attributed to Raycast come from a third-party AI-generated DESIGN.md that itself says its values are approximate. Linear's blog confirmed principles (LCH, three inputs, Inter Display) but gave no numeric values.
- Which Awwwards/Godly/Siteinspire/Land-book winners are dark/serif/bento: listing pages gave names and award dates (e.g. Cathy DOLLE Developer Award SOTD listing, Bruno Simon Site of the Month Jan 2026) but not visual detail, and godly.website redirected to recent.design, which I did not open. The pattern claims therefore rest on Linear, Stripe, Vercel, Raycast, Brittany Chiang, rauno.me and Josh Comeau pages I actually read.
- Contrast for the B and C accent colours at small sizes: B light accent #c2410c computes to about 4.5:1 and C light amber #a16207 to about 4.5:1 on their backgrounds, which is at the AA threshold with rounding; verify with a tool before use.
- The live CSP allows 'unsafe-inline' and 'unsafe-eval' for scripts (header read 2026-11-10), which differs from the brief's 'script-src self' statement; confirm with the owner whether firebase.json will be tightened, because an inline theme-init script and any eval-based library depend on it.
- Next.js 16.4.6 is the current registry version while the project is on 15; whether any Next 16 change affects output:'export', next/font or Tailwind 4 integration was not checked.

# motion-webgl

Verdict for a static-export Next 15 / React 19 portfolio under script-src 'self', checked against pages I opened (current date Nov 2026). (1) Scroll-driven animations are now Baseline Newly Available. web.dev's October 2026 roundup says Firefox 159 enabled them by default, and Chrome 115 and Safari 26 already had them. Same-document View Transitions have been Baseline Newly Available since 14 Oct 2025 (Firefox 144). So reveals, progress bars and light parallax should be native CSS with a reduced-motion guard, not JS. (2) GSAP is now free for commercial use under Webflow's 'no charge' licence, including SplitText and ScrollTrigger (not OSI-open-source; one 'competing visual animation builder' restriction). Use it only where CSS cannot do the job: headline splitting, pinned or scrubbed sequences, Flip. (3) WebGPU is still 'Limited availability' on MDN, so the hero must be WebGL2. The cheapest premium hero is paper-design/shaders (Apache-2.0, vanilla WebGL with no three.js, whole-package ~83 kB gzip per bundlephobia, speed defaults to 0, pauses off-screen). It has no webglcontextlost or reduced-motion handling, so wrap it. Keep R3F/three (three alone ~186 kB gzip) for one lazily mounted signature object, with all heavy code loaded after LCP. (4) Wrap every visual in one 'stage' component that handles lazy mount, off-screen pause, DPR cap, context-loss recovery, poster fallback and reduced-motion. (5) The live site currently uses one WebGL context per section, which should become a single shared canvas or CSS/DOM visuals. Costs, licences and fallbacks are given per recommendation. Everything I could not confirm from an opened page is listed under 'unverified'.

## [must] 1. Native CSS scroll-driven animations as the default reveal / progress / parallax layer

**What:** Use animation-timeline: view() for section and card reveals and scroll() for the reading-progress bar and subtle hero parallax, with animation-range (entry / cover / exit) to control timing. Only animate transform and opacity.

**Why:** It runs off the main thread, adds zero JS bytes and does not touch INP. As of Oct 2026 it is Baseline Newly Available (Chrome/Edge 115, Safari 26, Firefox 159). It also keeps content in the DOM and readable without JS or WebGL.

**How:** Gate everything in @supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) { ... } }. Outside that block, elements render fully visible, so unsupported or reduced-motion users get the final state with no hidden content.

Pattern from the Chrome docs: @keyframes reveal { from { opacity:0; transform: translateY(40px) } to { opacity:1; transform:none } } .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }

The animation-timeline declaration must come after the animation shorthand, and animation-duration stays auto. Ranges use the untransformed box, so a translated element does not shift its own trigger point.

Progress bar: .progress { transform-origin:0 50%; animation: grow linear both; animation-timeline: scroll(root block); }.

Tune ranges with the Bramus visualizers at scroll-driven-animations.style (Apache-2.0 site). Its polyfill is flackr/scroll-timeline, not needed in 2026 except for older browsers; prefer the @supports fallback.

Tailwind 4: add the keyframes in @theme and use arbitrary utilities or a small CSS file.

With Lenis the page still uses native scroll, so these timelines keep working (Lenis README: it wraps native scroll).

**Libraries:** No library (platform CSS), scroll-driven-animations.style (demos/tools only)

**Licence:** Platform feature; reference site is Apache-2.0

**Cost/risk:** Cost: 0 kB JS, compositor-friendly. Risk: older iOS/Firefox versions fall back to static content (acceptable). The design must not depend on exact scrub feel. Pinned or sequenced choreography is awkward in pure CSS, so use GSAP for that (rec 2).

**Sources:** https://web.dev/blog/web-platform-10-2026 https://developer.chrome.com/docs/css-ui/scroll-driven-animations https://scroll-driven-animations.style/ https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline https://web.dev/articles/cls

## [must] 2. GSAP 3.15 + @gsap/react (ScrollTrigger, SplitText, Flip) for headline reveals and pinned sequences

**What:** Use GSAP only for what CSS cannot do: SplitText headline reveals (lines masked, rising), scrubbed or pinned storytelling for the hero-to-about hand-off, Flip for filter/reorder layout moves. Register only the plugins you use.

**Why:** GSAP is now free including commercial use and the former Club plugins (SplitText, MorphSVG), under the Standard 'no charge' licence. The only prohibited use is shipping GSAP inside a no-code visual animation builder that competes with Webflow, which a personal portfolio is not. SplitText 3.13+ has autoSplit, onSplit, mask and automatic aria-label with aria-hidden children. useGSAP is SSR-safe in Next 'use client' components and reverts all tweens, ScrollTriggers and SplitText on unmount.

**How:** npm i gsap @gsap/react. In a 'use client' component: gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText).

useGSAP(() => { const mm = gsap.matchMedia(); mm.add({ ok: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => { if (ctx.conditions.reduce) { gsap.set(targets, {opacity:1, clearProps:'all'}); return; } SplitText.create('.h1', { type:'lines', mask:'lines', autoSplit:true, aria:'auto', onSplit: (self) => gsap.from(self.lines, { yPercent:110, stagger:.08, duration:.9, ease:'power4.out' }) }); }); }, { scope: ref })

matchMedia auto-reverts when the preference flips, and the docs say not to call context.revert() inside the cleanup.

SplitText default aria:'auto' hides nested links from screen readers. For headlines containing links use aria:'none' plus an sr-only duplicate.

Wait for document.fonts.ready (autoSplit also re-splits on font load) so the split never measures fallback-font lines, and keep the h1 server-rendered so the LCP text paints without JS.

ScrollTrigger: use scrub with a number (e.g. 0.6) only on transform or opacity. Use pin sparingly (one hero sequence, desktop only via matchMedia). Use ScrollTrigger.batch for card stagger. Prefer gsap.matchMedia over the deprecated ScrollTrigger.matchMedia. Import plugins individually (gsap/ScrollTrigger, gsap/SplitText) to keep the bundle small.

**Libraries:** gsap@3.15.1, @gsap/react@2.1.2

**Licence:** GSAP Standard 'no charge' licence (gsap.com/standard-license): free for commercial use, Webflow-owned, NOT OSI open source. Licence terms can be amended; the licence text says you may keep using earlier versions under the terms that applied to them. @gsap/react also points at the same licence.

**Cost/risk:** Bundlephobia (gsap@3.15.1 main entry): ~27 kB gzip core, plus ScrollTrigger and SplitText (not measured). Main-thread JS. Risks: licence is proprietary and revocable on breach; SplitText on long text bloats the DOM (limit to headlines); the 6.27 MB npm unpackedSize is irrelevant when imported per plugin.

**Sources:** https://gsap.com/pricing/ https://gsap.com/standard-license/ https://github.com/greensock/GSAP https://gsap.com/docs/v3/Plugins/SplitText/ https://gsap.com/resources/React/ https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ https://gsap.com/docs/v3/Plugins/ScrollTrigger/ https://registry.npmjs.org/gsap/latest https://registry.npmjs.org/@gsap/react/latest https://bundlephobia.com/api/size?package=gsap@3.15.1

## [must] 3. A single 'VisualStage' wrapper that enforces the performance and robustness rules for every WebGL/canvas visual

**What:** One reusable client component that owns lazy mounting, off-screen pausing, DPR capping, context-loss recovery, static poster fallback and reduced-motion behaviour. Every shader or R3F visual goes inside it, so no visual can bypass the rules.

**Why:** The brief requires LCP < 2.5 s, CLS < 0.05, INP good, reduced-motion support and readability without WebGL. Canvas is never the LCP element, so the LCP must be real DOM text or a poster image in the static HTML. The current site reportedly runs one WebGL context per section, which wastes GPU memory and risks hitting browser context limits.

**How:** 1) Poster: render the section as plain HTML/CSS (CSS gradient or a pre-rendered AVIF/WebP of the shader, sized with aspect-ratio so CLS is 0). Never lazy-load the LCP image and use fetchpriority=high if the poster is the LCP.

2) Mount gate: a client component with an IntersectionObserver (rootMargin ~200px), requestIdleCallback after the load event, and a capability check (try canvas.getContext('webgl2'); skip if navigator.connection.saveData or the viewport is below ~480px for heavy scenes). Then const Scene = dynamic(() => import('./Scene'), { ssr:false }) inside the 'use client' file. next/dynamic ssr:false is only allowed in Client Components. Fade the canvas in over the poster to avoid a visible swap.

3) Pause: when the stage is off-screen or document.hidden, stop the loop. For R3F use frameloop='demand' (or 'never') toggled by the IO flag. paper-design shaders already pause via IO and visibilitychange.

4) DPR: cap at [1, 1.5] (R3F Canvas dpr={[1,1.5]}). Add drei PerformanceMonitor flipflops={3} onFallback={() => setDpr(1)}. For paper shaders use maxPixelCount.

5) Context loss: canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); show poster }) and 'webglcontextrestored' to rebuild resources or remount (key bump). Test with WEBGL_lose_context.loseContext()/restoreContext(). Neither paper shaders nor R3F's documented API handles this for you (see unverified).

6) Reduced motion: matchMedia('(prefers-reduced-motion: reduce)') then render one static frame (paper: speed=0, a fixed frame; R3F: frameloop='never' plus one invalidate) or keep only the poster.

7) R3F fallback prop: Canvas has a fallback prop that renders DOM when WebGL is unsupported, so make it the same poster.

8) One context: use a single shared Canvas with drei <View> regions (scissor-based, tracks DOM elements) instead of one Canvas per section, or use CSS for the lesser sections.

**Libraries:** @react-three/fiber@9.8.2, @react-three/drei@10.7.9 (PerformanceMonitor, AdaptiveDpr, View, Preload), next/dynamic

**Licence:** MIT (R3F, drei); Next.js MIT

**Cost/risk:** ~1 small component of logic. Risk: nothing is automatic. If any visual is mounted outside the wrapper it bypasses the budget, so enforce via lint or code review. Poster and canvas must match visually to avoid a pop.

**Sources:** https://r3f.docs.pmnd.rs/advanced/scaling-performance https://r3f.docs.pmnd.rs/api/canvas https://drei.docs.pmnd.rs/performances/performance-monitor https://drei.docs.pmnd.rs/portals/view https://drei.docs.pmnd.rs/performances/adaptive-dpr https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-mount.ts https://web.dev/articles/optimize-lcp https://nextjs.org/docs/app/guides/lazy-loading

## [must] 4. Signature hero: paper-design/shaders MeshGradient or GrainGradient (vanilla WebGL, no three.js)

**What:** Replace the text-dense dark hero with a large-type hero over a slow, grainy mesh-gradient field in a restrained brand palette (e.g. deep ink to one warm accent), using @paper-design/shaders-react. Optionally add a second layer such as halftone or dithering effects for texture.

**Why:** It is a premium, 2025/26-look effect (grain, mesh, swirl) that costs one fragment shader on one quad, far cheaper than a three.js scene. The package is Apache-2.0 (no attribution required, keep LICENSE and NOTICE). It has React wrappers, an SSR-friendly always-rendered div and a speed prop that defaults to 0 (static). Its mount code pauses via IntersectionObserver and visibilitychange, stops the rAF entirely at speed 0, and limits pixel count (default 1920*1080*4). The shader catalogue is broad (mesh gradient, grain gradient, dithering, fluted glass, liquid metal, god rays, metaballs, neuro noise, etc.).

**How:** npm i @paper-design/shaders-react@0.0.82 (pin exactly: README warns of breaking changes under 0.0.x; 0.0.81 broke Paper Texture's API).

In VisualStage (rec 3), above a CSS-gradient poster: <MeshGradient colors={['#0b1020','#1b2a6b','#e8a87c','#f4efe6']} distortion={0.8} swirl={0.1} speed={reduced ? 0 : 0.25} style={{position:'absolute', inset:0}} maxPixelCount={1280*720} />.

With speed={0} the rAF stops and there is no recurring cost, so the same component serves as the reduced-motion/static variant. Put a semi-opaque scrim or colour-mix overlay under text so body copy stays at least 4.5:1 contrast. Test in both the static and animated state, since large gradients shift contrast.

Set aria-hidden='true' and no focusable content in the canvas layer. Add your own prefers-reduced-motion check, because the library has no reduced-motion handling and no webglcontextlost handler (both verified in source), so use rec 3 for those.

Pre-render a poster by screenshotting the shader at speed 0 (AVIF) for the LCP image and the no-WebGL fallback.

**Libraries:** @paper-design/shaders-react@0.0.82, @paper-design/shaders@0.0.82

**Licence:** Apache-2.0 (relicensed at 0.0.77, with LICENSE and NOTICE in every package)

**Cost/risk:** Bundlephobia for the whole shaders-react entry: 275 kB min / ~83 kB gzip (npm unpackedSize 421 KB). Import only the shader you use and verify after tree-shaking in your own build, so load it lazily after LCP. Per-frame GPU cost is one full-screen fragment shader (cap pixel count on mobile). Risk: pre-1.0 API churn (pin the version and read the CHANGELOG); no built-in context-loss or reduced-motion handling.

**Sources:** https://github.com/paper-design/shaders https://shaders.paper.design/ https://raw.githubusercontent.com/paper-design/shaders/main/CHANGELOG.md https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders-react/src/shader-mount.tsx https://raw.githubusercontent.com/paper-design/shaders/main/packages/shaders/src/shader-mount.ts https://registry.npmjs.org/@paper-design/shaders-react/latest https://bundlephobia.com/api/size?package=@paper-design/shaders-react@0.0.82

## [should] 5. Motion for React (package 'motion') with LazyMotion for state-driven UI motion and layout animation

**What:** Use Motion (formerly Framer Motion; import from 'motion/react') for what is state-driven: project-filter AnimatePresence, layout animations on the timeline selector, drawer/dialog presence, number counters, and the spring physics behind magnetic and spotlight interactions. Do not use it for scroll reveals (rec 1) or text splitting (rec 2).

**Why:** It is already installed, MIT, and supports React 18/19 (motion@14.12.0 peers react ^18 || ^19). Bundle can be cut from ~43 kB (the 'motion' component, impossible to tree-shake below that) to just over 5 kB initial with LazyMotion plus the 'm' component. MotionConfig reducedMotion='user' automatically disables transform and layout animations for reduced-motion users while keeping opacity and colour animations.

**How:** Migrate imports from 'framer-motion' to 'motion/react'. Root providers: <MotionConfig reducedMotion='user'><LazyMotion features={domAnimation} strict>...</LazyMotion></MotionConfig>. Use <m.div> everywhere (strict mode errors if someone imports motion.div).

For reduced-motion users who still need feedback, use useReducedMotion() to swap a slide for an opacity fade, as the Motion accessibility docs describe. Use domMax only if you need layout animations or drag. Use useScroll only for the few cases where JS-driven scroll progress is required, otherwise CSS timelines.

For imperative one-offs use useAnimate in its mini (3.3 kB) or hybrid (23 kB) form.

**Libraries:** motion@14.12.0

**Licence:** MIT

**Cost/risk:** 43 kB vs ~5 kB initial (+ feature bundle) per Motion docs. Main-thread JS for springs. Risk: a codemod import rename; mixing GSAP and Motion on the same element causes style fights, so give each library separate elements or properties. Layout animations and Next route transitions can fight each other, so keep layout animation inside components.

**Sources:** https://motion.dev/docs/react https://motion.dev/docs/react-reduce-bundle-size https://motion.dev/docs/react-accessibility https://github.com/motiondivision/motion https://registry.npmjs.org/motion/latest

## [should] 6. Lenis 1.3 smooth scroll, optional and light-touch

**What:** Add Lenis (MIT, native-scroll based) via lenis/react <ReactLenis root /> for inertia on wheel scroll, with the GSAP ticker sync if ScrollTrigger is used. Keep it subtle (lerp ~0.1) or skip it on touch devices.

**Why:** Lenis wraps native browser scroll, so position:sticky, anchor links, find-in-page and most accessibility behaviour keep working, and CSS scroll-driven animations keep working too. It defaults respectReducedMotion to true (smoothing off, scrollTo/anchors jump instantly) and re-evaluates when the preference changes. Small footprint.

**How:** npm i lenis. <ReactLenis root options={{ lerp: 0.1, autoRaf: false }} ref={lenisRef} /> in a client Providers component, and drive it from the GSAP ticker: gsap.ticker.add(t => lenisRef.current?.lenis?.raf(t * 1000)); gsap.ticker.lagSmoothing(0); lenis.on('scroll', ScrollTrigger.update). Remove the ticker callback on cleanup.

If not using GSAP, leave autoRaf at its default. Known limits from the README: no CSS scroll-snap (use lenis/snap), smoothing stops over iframes, touch quirks with syncTouch on old iOS. Leave syncTouch off so touch devices scroll natively.

Never combine with ScrollTrigger.normalizeScroll (double JS scroll handling) or ScrollSmoother (two smoothers).

After route or content-height changes call lenis.resize() and ScrollTrigger.refresh().

**Libraries:** lenis@1.3.27

**Licence:** MIT

**Cost/risk:** Bundlephobia: 5.4 kB gzip (18.9 kB min). Main-thread rAF loop while scrolling. Risk: scroll hijack feel is divisive; test with keyboard (Space/PageDown/Home/End), in-page anchors with fixed header offset, and screen readers. If the added smoothness does not clearly improve the design, omit it. The design must not depend on it.

**Sources:** https://github.com/darkroomengineering/lenis https://raw.githubusercontent.com/darkroomengineering/lenis/main/packages/react/README.md https://registry.npmjs.org/lenis/latest https://bundlephobia.com/api/size?package=lenis@1.3.27

## [should] 7. One lazily mounted R3F signature object (glass/refraction) with minimal post-processing, desktop-first

**What:** A single hero-adjacent 3D element, for example a faceted glass or metal knot/blob that tilts toward the pointer, inside the shared canvas from rec 3. Use drei MeshTransmissionMaterial for glass, Environment with Lightformers (procedural, no HDR download), Float for idle drift, and at most Bloom plus Noise via @react-three/postprocessing. On mobile or low-power devices, show the shader hero (rec 4) only.

**Why:** R3F 9.8.2 and drei 10.7.9 are on the stack's React 19 line (R3F peers react >=19 <19.4; drei peers react ^19, fiber ^9). This gives the 'glass / refraction / post-processing' signature the brief asks for, but only where the hardware can afford it.

**How:** Canvas props: dpr={[1,1.5]} frameloop={visible ? 'always' : 'never'} gl={{ antialias:false, powerPreference:'high-performance' }} camera fov ~35. For glass: <MeshTransmissionMaterial samples={4} resolution={512} backside={false} thickness={0.6} roughness={0.1} chromaticAberration={0.04} /> (drei doc: default samples 6, resolution fullscreen, 'additional render pass of the scene'; lower both).

Wrap in <PerformanceMonitor flipflops={3} onFallback={...}> and on fallback swap to MeshPhysicalMaterial (no transmission) or unmount to poster.

Use <Environment> with <Lightformer> children, not a remote HDR (img-src https is allowed, but fetch/connect rules may not be, and it adds a request). Post: <EffectComposer multisampling={0}><Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.9} /><Noise opacity={0.04} /></EffectComposer>, desktop only, and merge effects into one pass (postprocessing's EffectPass does this). Pointer interaction: damp rotation toward the pointer in useFrame; skip on (pointer: coarse).

Geometry: procedural (TorusKnot/Icosahedron) to avoid GLTF/Draco; if a GLTF is later needed, note that the Draco decoder uses workers and may need worker-src (unverified), so prefer Meshopt or uncompressed.

Dispose via R3F's auto-disposal; pass dispose={null} only for shared assets.

**Libraries:** three@0.187.0, @react-three/fiber@9.8.2, @react-three/drei@10.7.9, @react-three/postprocessing@3.2.2, postprocessing@^6.36

**Licence:** MIT (three, R3F, drei, @react-three/postprocessing); postprocessing is Zlib

**Cost/risk:** Heaviest item. three.js alone is ~186 kB gzip on bundlephobia (full import; tree-shaking helps but R3F + drei + postprocessing add more), so it must be a separate async chunk loaded after LCP and idle. GPU: transmission re-renders the scene (samples and resolution matter), post-processing adds full-screen passes. Mobile: skip transmission, post and heavy meshes. Risk: peer-dep window (R3F react <19.4), context loss, battery drain. Only ship it if the shader hero alone doesn't deliver the wow.

**Sources:** https://registry.npmjs.org/@react-three/fiber/latest https://registry.npmjs.org/@react-three/drei/latest https://registry.npmjs.org/@react-three/postprocessing/latest https://registry.npmjs.org/three/latest https://drei.docs.pmnd.rs/shaders/mesh-transmission-material https://github.com/pmndrs/postprocessing https://github.com/pmndrs/drei https://bundlephobia.com/api/size?package=three@0.187.0 https://r3f.docs.pmnd.rs/api/canvas

## [should] 8. Cursor-reactive interactions: magnetic CTAs, spotlight cards, tilt, all pointer-fine only

**What:** Magnetic primary buttons (translate toward the pointer, spring back), a spotlight/glow on project cards that follows the pointer (radial-gradient from --mx/--my CSS variables), and gentle 3D tilt on the portrait. Enable only for (hover: hover) and (pointer: fine); keep the native cursor.

**Why:** These micro-interactions are what read as 'crafted' to hiring managers. They are cheap, framework-agnostic and degrade to plain hover/focus styles. They must not be the only way to discover anything, and they must be disabled for reduced-motion users.

**How:** Spotlight: one pointermove listener per card (rAF-throttled) writes style.setProperty('--mx', x+'px') and '--my'; CSS: background: radial-gradient(240px circle at var(--mx) var(--my), color-mix(in oklab, var(--accent) 25%, transparent), transparent 70%) in an ::before layer with pointer-events:none. Also apply the same glow on :focus-visible, centred, so keyboard users get an equivalent.

Magnetic: with Motion, useMotionValue + useSpring (stiffness ~150, damping ~15, mass ~0.1), onPointerMove sets x/y = (pointer - centre) * 0.25 limited to ~12 px, onPointerLeave resets to 0. Do not move the element's hit-target far enough to cause missed clicks (WCAG 2.5.8 target size).

Guard with if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches || useReducedMotion()) return. Under MotionConfig reducedMotion='user' transform animations are already disabled for such users (per Motion docs).

Never hide information behind hover only, and never replace the system cursor with a custom one.

**Libraries:** motion@14.12.0 (useMotionValue, useSpring), plain CSS custom properties

**Licence:** MIT (Motion); CSS technique is platform

**Cost/risk:** Negligible bytes. pointermove handlers must be passive and rAF-throttled. Risk: INP regressions if handlers read layout (cache getBoundingClientRect on pointerenter, not on every move); WCAG 2.3.3 (Animation from Interactions, AAA) recommends the ability to turn off non-essential interaction motion, which reduced-motion gating satisfies. No primary source for the spotlight CSS recipe itself (see unverified).

**Sources:** https://motion.dev/docs/react-accessibility https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html https://github.com/magicuidesign/magicui

## [should] 9. View Transitions for same-page state changes (theme toggle, project detail morph, filter reorder)

**What:** Use same-document view transitions to morph a project card into its detail panel, crossfade the theme change and animate filter reorders. For a one-page site, skip route transitions and anything cross-document.

**Why:** Same-document view transitions have been Baseline Newly Available since 14 Oct 2025 (Firefox 144, joining Chromium and Safari), so they are production-safe with feature detection. They need no library, run in the compositor and fall back to an instant update.

**How:** Plain approach (no framework coupling): function go(update){ if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update(); document.startViewTransition(() => flushSync(update)); }. Name the participants with view-transition-name (or view-transition-name: match-element / view-transition-class for groups, both in Firefox 144 per web.dev).

Style with ::view-transition-group(.morph) { animation-duration: 400ms } and always include @media (prefers-reduced-motion: reduce){ ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*){ animation: none !important } }.

Add ::view-transition { pointer-events: none } so clicks during a transition are not swallowed (Next.js guide).

React's <ViewTransition> component (React 19.3, Next.js 'View transitions' guide, last updated 2026-10-15) is the declarative option for Next route changes, but it only fires inside Transitions, Suspense or useDeferredValue, and React does not apply reduced-motion for you. Confirm it exists in your installed React/Next version before depending on it (see unverified).

**Libraries:** Browser API: document.startViewTransition, react@19.3 <ViewTransition> (optional, check version)

**Licence:** Platform API; React MIT

**Cost/risk:** 0 kB for the native API. Risks: snapshot of large elements can cost frames; names must be unique at transition time; hit-testing skips named participants during the transition so avoid naming things users click rapidly. Cross-document transitions were not verified for Firefox.

**Sources:** https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API https://nextjs.org/docs/app/guides/view-transitions https://react.dev/reference/react/ViewTransition

## [should] 10. Marquee and parallax, done tastefully and accessibly

**What:** One CSS-only logo/employer marquee (ATO, ANZ, NAB, Microsoft, Telstra) with a pause control, and at most one or two parallax layers (hero background and portrait) with small travel (about 24 to 40 px).

**Why:** Both are easy to overdo and are classic accessibility failures. WCAG 2.2.2 requires a pause/stop/hide mechanism for auto-moving content that lasts over 5 seconds and runs alongside other content. WCAG 2.3.3 calls out parallax as non-essential motion users should be able to turn off, while content moving into view on scroll is treated as essential.

**How:** Marquee: a duplicated track in a flex row with animation: marquee 40s linear infinite (transform: translateX(-50%)), duplicate set marked aria-hidden='true', and a real <button aria-pressed> 'Pause' toggling animation-play-state. Also pause on :hover and :focus-within, and under prefers-reduced-motion show a static wrapped row (flex-wrap) with no animation. Edge masks with mask-image: linear-gradient(...) and no JS.

Parallax: implement as scroll-driven CSS (rec 1): animation: drift linear both; animation-timeline: view(); with @keyframes drift { from { transform: translateY(-20px) } to { transform: translateY(20px) } }, only inside @media (prefers-reduced-motion: no-preference) and @supports. No fixed-attachment backgrounds, which are janky on iOS. Avoid parallax on text blocks.

**Libraries:** No library (CSS)

**Licence:** Platform CSS

**Cost/risk:** 0 kB. Risks: marquees that never pause fail WCAG 2.2.2; large travel plus blur filters cause paint cost; a 'tasteful' budget means one marquee and one parallax layer per page.

**Sources:** https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html https://developer.chrome.com/docs/css-ui/scroll-driven-animations

## [could] 11. Optional GPU particle field: GPUComputationRenderer (WebGL2-safe) rather than WebGPU compute

**What:** If a particle/noise-field signature is wanted instead of or in addition to the shader gradient, build a flow-field of roughly 16k to 65k points with three's GPUComputationRenderer (ping-pong float textures) that is repelled by the pointer, rendered as THREE.Points with a custom ShaderMaterial. Use it only on capable desktops.

**Why:** It works on WebGL2, which is universally available, while WebGPU is still tagged 'Limited availability' on MDN. web.dev's Nov 2025 post limits it to Windows/Chromium plus Safari 26 and Firefox 141 (Windows) and 145 (Apple-silicon macOS), with Linux, Android and Intel Macs 'in progress'. three.js ships the addon and a documented workflow, and the Codrops GPGPU tutorial and the three.js webgpu_compute_particles example show the pattern.

**How:** import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'. Create gpu = new GPUComputationRenderer(size, size, renderer) with size=128 (16,384 particles) on desktop and 64 on mid-range. gpu.setDataType(THREE.HalfFloatType) for mobile-friendlier bandwidth. addVariable('texturePosition', fragmentShader, initialTexture); setVariableDependencies(v, [v]); add uniforms uPointer/uTime on v.material.uniforms; check gpu.init() returns null. Each frame: gpu.compute(); pointsMaterial.uniforms.uPositions.value = gpu.getCurrentRenderTarget(v).texture.

Run only when visible (rec 3), and under reduced motion render the field at time 0 as a static dot pattern.

If you want WebGPU compute later, use WebGPURenderer + TSL with its automatic WebGL2 fallback, but compute shaders will not run on the WebGL2 backend (a third-party article's claim, unverified), so you would still need this fallback path.

Simplest alternative: a vertex-shader-only Points field (noise displacement in the vertex shader, no FBO) is about 10x less code and enough for a hero.

**Libraries:** three@0.187.0 (three/addons/misc/GPUComputationRenderer.js), @react-three/fiber@9.8.2

**Licence:** MIT

**Cost/risk:** GPU: 16k points is trivial on desktop, 65k+ with additive blending and DPR 2 can stall integrated mobile GPUs. Needs float or half-float render targets (EXT_color_buffer_float, normally available on WebGL2 but test). Risk: medium complexity, the heaviest to tune. Treat it as a 'could' after rec 4 and 7 ship.

**Sources:** https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_particles.html https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API https://web.dev/blog/webgpu-supported-major-browsers

## [could] 12. Repos and libraries to copy patterns from (read the code, do not blindly install)

**What:** Reference list of codebases that show the patterns above: paper-design/shaders (shader mount, IO pause, pixel-count cap), darkroomengineering/satus and lenis (production Next 16 + Lenis + opt-in R3F WebGL, CSP, asset-weight budgets, Playwright a11y tests), pmndrs/drei and react-three-fiber (View, PerformanceMonitor, AdaptiveDpr), mrdoob/three.js examples (GPUComputationRenderer, WebGPU compute), oframe/ogl (minimal WebGL), shadergradient/shadergradient (shader gradient on R3F), DavidHDev/react-bits and magicuidesign/magicui (copy-paste animated components), and scroll-driven-animations.style (demo source).

**Why:** All are permissively licensed (with one caveat) and expose small, readable implementations, so each effect can be rebuilt in-house and audited for a11y and CSP instead of adding runtime dependencies.

**How:** Use as references:
- paper-design/shaders: Apache-2.0, 3.9k stars, packages/shaders/src/shader-mount.ts for the visibility/pixel-count pattern.
- darkroomengineering/satus: MIT, 1.0k stars, Next 16 + React 19 + Tailwind v4, Lenis/Tempus, R3F gated behind a feature flag, enforced CSP/security headers, asset-weight budgets and Playwright accessibility tests. Copy the CI budget and a11y gate ideas.
- darkroomengineering/lenis: MIT, 17.2k stars.
- pmndrs/react-three-fiber (33.6k stars, MIT) and drei (10.1k stars, MIT).
- mrdoob/three.js (118k stars, MIT).
- oframe/ogl: Unlicense, 4.8k stars, 29 kB minzipped total (core 8 + math 6 + extras 15), a lighter route for a single custom fragment-shader hero if paper shaders is not flexible enough.
- shadergradient/ruucm: MIT, @shadergradient/react 2.4.20 has lazyLoad/threshold/pixelDensity props but pulls in R3F + three + camera-controls and optional env maps, so it is heavier than paper shaders; use as inspiration for the look.
- DavidHDev/react-bits: 51.6k stars, 'MIT + Commons Clause' (free for personal/commercial use but not resale; not OSI), 215+ components incl. SplitText, Liquid Chrome and Ballpit; good for ideas, copy by shadcn/jsrepo.
- magicuidesign/magicui: MIT, 23.2k stars.
Audit any copied component for: pointer/keyboard parity, reduced-motion, hidden duplicate text for screen readers, no CDN fetches, and no Google Fonts or HDRs (CSP font-src 'self').

**Libraries:** @paper-design/shaders-react, ogl@1.0.11, @shadergradient/react@2.4.20, maath (pmndrs, MIT), react-bits (copy-paste), magicui (copy-paste)

**Licence:** Apache-2.0 (paper shaders); MIT (satus, lenis, three, R3F, drei, magicui, shadergradient, maath); Unlicense (ogl); MIT + Commons Clause (react-bits)

**Cost/risk:** Reading is free. Risk is in dependency creep: copy 50-200 lines per effect, not whole packages. React Bits' Commons Clause forbids selling the software itself, fine for a personal site but record it in a third-party licence file.

**Sources:** https://github.com/paper-design/shaders https://github.com/darkroomengineering/satus https://github.com/darkroomengineering/lenis https://github.com/pmndrs/react-three-fiber https://github.com/pmndrs/drei https://github.com/mrdoob/three.js https://github.com/oframe/ogl https://raw.githubusercontent.com/ruucm/shadergradient/HEAD/README.md https://github.com/DavidHDev/react-bits https://github.com/magicuidesign/magicui https://github.com/pmndrs/maath

## Avoid
- WebGPU / TSL as the primary renderer or WebGPU-only compute: MDN still marks WebGPU 'Limited availability' (Nov 2026). web.dev (Nov 2025) lists Firefox only on Windows (141) and Apple-silicon macOS (145), and Linux/Android/Intel Macs as 'in progress'. A forum thread reports Firefox 145 breaking three.js WebGPU/TSL, seen only as a search snippet. Use WebGL2 and add WebGPU later behind detection.
- drei <Text> / troika-three-text: its README says font parsing runs in a web worker that a restrictive CSP can block (workaround: configureTextBuilder({ useWorker:false })). The default font and the Unicode fallback fonts load from CDNs (Google Fonts, jsDelivr), which violates the font-src 'self' and script-src 'self' constraints, and .woff2 is unsupported. Use DOM text (self-hosted via next/font) for all copy, and never put readable content in a canvas (it is also invisible to screen readers).
- Unicorn Studio embeds: the official docs load a proprietary UMD script from cdn.jsdelivr.net, which the script-src 'self' CSP blocks. The self-host path (sdkUrl) is not covered by the official docs, and a community wrapper's maintainers warn it may violate the terms of service. The licence is not stated on the embed page, and scenes live in a third-party tool.
- One <Canvas> per section (as the live site reportedly does): multiplies GPU memory and browser context limits (each context has its own resources) and makes context-loss storms more likely. Use one shared Canvas with drei <View>, or one WebGL surface plus CSS visuals elsewhere.
- ShaderGradient as the hero by default: MIT and attractive, but it runs through R3F + three + camera-controls and optional environment maps (pixelDensity/lazyLoad props exist). That pays the three.js cost (~186 kB gzip for three alone) for what paper-design/shaders does with one fragment shader. Use it only as visual reference.
- Two smooth-scroll systems at once (Lenis + ScrollSmoother, or Lenis + ScrollTrigger.normalizeScroll): double JS scroll handling causes jank and drift. Pick Lenis, or no smoothing at all.
- Scroll-jacking and long pinned sequences: block native scrolling expectations, harm keyboard and screen-reader users and make INP unpredictable. Allow at most one short pinned moment, desktop only, with a normal-flow fallback.
- Custom cursors that replace the system cursor, hover-only content, and large magnetic offsets: fail keyboard/touch parity and target-size expectations. Keep the native cursor and add effects as enhancement under (hover:hover) and (pointer:fine).
- Full-screen MeshTransmissionMaterial, SSAO, depth of field or many-pass post-processing on mobile: drei documents transmission as 'an additional render pass of the scene'. Disable on small/coarse-pointer devices or when PerformanceMonitor declines.
- The legacy 'framer-motion' import path and the full <motion.*> component everywhere: Motion docs say the motion component cannot be tree-shaken below ~43 kB. Use 'motion/react' with LazyMotion and m.* (~5 kB initial).
- Installing react-bits or magicui wholesale: React Bits is 'MIT + Commons Clause' (not OSI), many effects are canvas-based and untested for reduced motion, CSP or screen readers. Copy and audit individual components instead.
- Remote assets at runtime: HDR environment maps (e.g. drei Environment presets), Draco decoders from CDNs, Google Fonts, Lottie CDN players. They conflict with the CSP or add requests on the critical path; self-host or generate procedurally (Lightformers).
- Animating layout properties (width/height/top/left) or large filters (blur on full-width elements) for reveals: causes layout shift and paint cost. Animate transform and opacity only (web.dev CLS guidance).

## Unverified
- Firefox 159 shipping scroll-driven animations by default is stated by web.dev's Oct 2026 roundup and the Chrome docs badge (Firefox 159, Safari 26), but I could not read MDN's per-browser compatibility table (it was stripped from the fetch). An earlier third-party article said Firefox 152 still had it behind a flag. Verify on caniuse/MDN before dropping the fallback.
- Cross-document (MPA) view transitions in Firefox were not confirmed; web.dev's post covers same-document only. MDN's browser-support statements in my fetch were not from the rendered compat tables.
- Whether the project's installed React/Next versions include <ViewTransition> (Next's guide says React 19.3 does and requires no config, and shows examples pinned to 19.3.0-canary). On Next 15 the component may need a canary or experimental flag. Not tested.
- Bundle sizes: figures from bundlephobia's API are for the package entry (gsap 27.4 kB gzip, lenis 5.5 kB, shaders-react 83 kB, three 185.7 kB) and are not tree-shaken results from this project's build. ScrollTrigger and SplitText sizes were not obtained (bundlephobia 404 for the subpath). Measure with next build / bundle analyzer.
- Whether @react-three/fiber 9 handles webglcontextlost internally: the Canvas docs I read do not mention it (they only suggest an error boundary for WebGL crashes), so I recommend adding listeners yourself. I did not test R3F's behaviour. Likewise paper-design shaders' lack of a context-loss handler and reduced-motion handling is confirmed only for shader-mount.ts on main at fetch time.
- React Bits internals (use of ogl, a11y behaviour of individual components) and Magic UI's dependency on motion were not confirmed from repo pages.
- The spotlight-card and magnetic-button recipes (CSS custom properties plus useSpring) are standard techniques that I described from engineering knowledge. I found no primary source page that documents them.
- Draco/GLTF decoder worker needing worker-src under the CSP: not verified. Avoided by using procedural geometry.
- Next.js static export (output:'export') with script-src 'self': Next injects inline hydration scripts that a strict CSP blocks without hashes/nonces/'unsafe-inline'. A web search returned no verified current recipe (community suggestions: post-build rewrite to external files, or hashes). Confirm how the live site already passes its CSP before adding anything that injects inline scripts.
- Claim from a third-party blog that code using compute shaders will not run when WebGPURenderer falls back to its WebGL2 backend: not checked against official three.js docs (the manual URLs I tried returned 404). A May 2026 article saying three r182 made WebGPURenderer 'recommended' also went unconfirmed.
- Codrops articles (Shader.se WebGPU pipeline, GPGPU 'Dreamy Particle Effect', Shopify Spring '26 case study) are known only from search results, because direct fetches returned 403, so I did not rely on or cite them as opened sources.
- Unicorn Studio licence and pricing terms were not shown on pages I could read; the CDN-script claim comes from its embed docs (v2.5.2 jsDelivr URL) and community wrapper notes about blob-URL bundling in some versions.
- Lenis and INP impact, and GSAP ScrollTrigger plus CSS scroll-driven animation interplay on iOS Safari, were not measured. Test on real devices.
- Per-browser WebGL context limits (often cited as ~16 desktop, fewer on mobile) were not verified from a page I read.

# data-viz

Research on 2026-11-10: opened primary pages (GitHub API, npm registry, bundlephobia, MDN, web.dev, WebKit, Next.js docs, Firebase docs, W3C WAI, the live site and its response headers). Core conclusion: this stack should be mostly server-rendered plain SVG with d3 maths modules (scale, shape, force) for the data visuals. Layer CSS scroll-driven animations (now Baseline Newly available) and a lazily-loaded Motion for polish. Use NumberFlow for counters. Make the AI assistant the one rich client island, using the Cloud Run chat backend the site already allows in its CSP. Use WebGL (cobe globe) sparingly and only as optional decoration. Charting suites (Recharts, ECharts, Plot) are too heavy for 4 to 5 simple charts. Two findings change the plan. (1) The live site's real CSP header is looser than the brief: script-src has 'unsafe-inline' and 'unsafe-eval', and connect-src already allows api.github.com, generativelanguage.googleapis.com and an existing Cloud Run chat endpoint (minivicchat). Going to script-src 'self' needs Next's experimental SRI, because a static export cannot use nonces. (2) The live page already has an equal-radius compass, a proportional 8-role timeline, a capability table with evidence-status circles, schematic plates and an 'Ask Mini Vic' session. The job is to upgrade those into real, interactive, accessible visuals, not invent new ones.

## [must] 1. To-scale career timeline: server-rendered SVG with d3-scale + d3-shape

**What:** Replace the current proportional bars with a swim-lane timeline from May 2010 to Nov 2026 on one shared time axis. One lane per employer or track (delivery leadership vs AI architecture). The 8 roles are bars whose widths come from scaleUtc. Add year ticks, a 'today' marker and a scroll-linked cursor. Clicking or focusing a bar opens a detail panel with role, dates, 1-2 evidence metrics and a link to the matching chat prompt.

**Why:** This is pure maths plus markup, so it runs in a React Server Component at build time. It ships as static HTML with zero client JS, which protects LCP and CLS (the SVG gets fixed width/height and a viewBox). The live site already has a proportional timeline, so this is a visible upgrade (axis, lanes, overlap, interaction) rather than a rewrite. d3 is ISC, 113,896 stars, v7.9.2 released 2026-11-03.

**How:** npm i d3-scale d3-shape d3-array (import only the modules, never the 'd3' umbrella). In the server component: const x = scaleUtc().domain([new Date('2010-05-01'), new Date('2026-11-10')]).range([0, W]); x.ticks(utcYear.every(1)) for the axis (the d3-scale time docs confirm ticks() and nice()). Render <svg viewBox> with <g> per lane and <rect x={x(start)} width={x(end)-x(start)} rx> per role. Make each role a real <a href='#role-anz'> or <button> so keyboard and screen-reader users get focus and Enter. Put the roles in a visually-hidden <ol> or <table> (employer, title, start, end, duration) inside <figure><figcaption> as the long text alternative. Keep a short alt via role='img' + aria-labelledby on the SVG only when the SVG is non-interactive. Per W3C WAI complex images, use figure/figcaption with a data table, not aria-describedby, because aria-describedby flattens tables into one paragraph. Reveal: CSS animation-timeline: view() with animation-range (see recommendation 2) to scale bars from scaleX(0) with transform-origin left. On mobile (<640px) switch to a vertical layout with the same scale (height = time) rather than horizontal scrolling. Reduced motion: render bars fully drawn with no animation.

**Libraries:** d3-scale 4.0.2 (ISC, 16.0 kB gzip as measured by bundlephobia for the whole module; less after tree-shaking), d3-shape 3.2.0 (ISC, 5.7 kB gzip bundlephobia), d3-array (ISC)

**Licence:** ISC (d3 repo licence verified via GitHub API; d3-scale and d3-shape follow the d3 org licence, see unverified)

**Cost/risk:** Near-zero runtime cost if the scale is computed on the server (no scale code reaches the client). Main risk is the overlapping dates (Aug 2011 to Nov 2014 etc.), which need explicit lane-assignment logic. Evidence metrics shown on the timeline are self-reported, as the live site already admits, so keep the provenance label on each one.

**Sources:** https://d3js.org/d3-scale/time https://api.github.com/repos/d3/d3 https://api.github.com/repos/d3/d3/releases/latest https://bundlephobia.com/api/size?package=d3-scale@4.0.2 https://bundlephobia.com/api/size?package=d3-shape@3.2.0 https://www.w3.org/WAI/tutorials/images/complex/ https://nextjs.org/docs/app/guides/static-exports https://www.react-graph-gallery.com/ https://forgotten-mistory.web.app/

## [must] 2. CSS scroll-driven animations as the default reveal / progress engine

**What:** Use animation-timeline: view() for section reveals, timeline bar growth, metric bars and diagram step highlighting. Use animation-timeline: scroll(root) for a top reading-progress bar and sticky-nav state. All of it is CSS, with no scroll listeners and no JS animation library on the critical path.

**Why:** MDN's animation-timeline page states 'Baseline 2026, Newly available' and that since October 2026 it works across the latest browsers. web.dev's October 2026 roundup says Firefox 159 enabled it by default and that, with Chrome and Safari, scroll-driven animations are Baseline Newly available. Safari support began in Safari 26 per the WebKit guide. It runs off the main thread, which suits good INP, and is a pure static-export fit.

**How:** @media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) { .reveal { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; } } } with @keyframes rise { from { opacity:0; transform: translateY(24px) } to { opacity:1; transform:none } }. Put 'animation-timeline' AFTER the 'animation' shorthand (MDN: the shorthand resets it to auto). Use animation-range (e.g. 0% 50%, from the WebKit guide) so content settles before it is read. Content must be fully visible and readable by default, so the animation is enhancement only and the no-support or reduced-motion fallback is the static final state. Do not animate anything that carries text smaller than the viewport. Avoid large parallax or zoom (WebKit guide notes wide-field motion triggers discomfort more than a small progress bar). Optional: Chrome's scroll-triggered animations (timeline-trigger / animation-trigger) are slated for Chrome 145 and the spec is a draft, so treat them as progressive enhancement behind @supports only.

**Libraries:** Platform CSS (no package)

**Licence:** N/A (web platform feature)

**Cost/risk:** 0 kB JS. Risk: older browsers show the static state (acceptable by design). Keep an eye on per-browser version numbers; the MDN compatibility table was truncated in my fetch, so exact versions rest on web.dev (Firefox 159) and WebKit (Safari 26). Scroll-driven animations only move while scrolling, so WCAG 2.2.2 (auto-moving content over 5 s) is not triggered, but any ambient looping animation still needs a pause control.

**Sources:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline https://web.dev/blog/web-platform-10-2026 https://www.webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ https://developer.chrome.com/blog/scroll-triggered-animations https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html

## [must] 3. Motion (the `motion` package) with LazyMotion for interactive choreography and SVG path drawing

**What:** Use Motion only where CSS cannot do the job: stateful interactions (selecting a role, expanding a case study), SVG path drawing for diagrams, shared-element transitions in the role detail panel, and useInView-triggered counters. Wrap the app in MotionConfig reducedMotion='user'.

**Why:** framer-motion is already installed. The `motion` npm package (v14.12.0, MIT) is the same engine (it depends on framer-motion 14.12.0), imports from 'motion/react', and supports React ^18 || ^19. Motion's own docs say the initial render with `m` + LazyMotion is just over 5 kB, versus about 43 kB for the full `motion` component, so you can keep the bundle small.

**How:** Swap imports to 'motion/react'. Root client provider: <MotionConfig reducedMotion='user'><LazyMotion features={() => import('./features').then(m => m.default)} strict>...</LazyMotion></MotionConfig>, where features.ts exports domAnimation (24 kB, covers animations, variants, exit, hover/tap/focus) or domMax (38 kB) only if you need layout animation or drag. Use <m.div>, never <motion.div>, inside LazyMotion (strict mode throws if you slip). SVG draw: <m.path d={d} initial={{pathLength:0}} whileInView={{pathLength:1}} viewport={{once:true, margin:'-20%'}} />; pathLength/pathSpacing/pathOffset are 0-1 values and work on path, circle, line, polyline, rect. For one-off effects use useAnimate's mini version (3.3 kB, WAAPI only). Reduced motion: MotionConfig disables transform and layout animations but still allows opacity and colour changes, which Motion's accessibility docs state. Use useReducedMotion() to swap slide-ins for fades and to set parallax y to a fixed 0. In Next.js App Router, use 'motion/react-client' in Server Components to reduce client JS.

**Libraries:** motion 14.12.0, framer-motion 14.12.0 (dependency of motion)

**Licence:** MIT

**Cost/risk:** About 5 kB initial + 24 kB lazy features (Motion's figures, Rollup builds; Webpack may be slightly larger). Bundlephobia shows 63 kB gzip for the un-tree-shaken package, which Motion's docs tell you to ignore. Risk is over-use: JS-driven reveals on every card will hurt INP, so default to recommendation 2 and reach for Motion only for stateful UI.

**Sources:** https://registry.npmjs.org/motion/latest https://motion.dev/docs/react-reduce-bundle-size https://motion.dev/docs/react-accessibility https://motion.dev/docs/react-svg-animation https://motion.dev/docs/react-installation https://api.github.com/repos/motiondivision/motion https://bundlephobia.com/api/size?package=motion@14.12.0

## [must] 4. Headline impact metrics: NumberFlow counters, SVG sparklines and before/after bars with provenance badges

**What:** A metrics band with four cards: ~92% evidence-effort reduction (3 h to 15 min per scenario, 200+ SIT/E2E scenarios), $5M+ portfolio across 5+ squads, 10,000+ concurrent devices at P95 under 200 ms, and 38% fewer simulated error-budget breaches. Each card has an animated number, a tiny SVG sparkline or before/after bar, and a badge saying 'self-reported' or 'simulated'. The numbers come from the existing page copy.

**Why:** Recruiters scan numbers first. Before/after bars (3 h vs 15 min) communicate the 92% claim at a glance, and a provenance badge keeps the metrics credible (the live site already marks the 38% as simulated). @number-flow/react is a purpose-built animated number component: React ^18||^19, MIT, about 6.3 kB gzip.

**How:** npm i @number-flow/react. <NumberFlow value={inView ? 92 : 0} suffix='%' format={{maximumFractionDigits:0}} />, with inView from Motion's useInView (once). Its respectMotionPreference prop defaults to true, so it honours prefers-reduced-motion. SSR rule: render the FINAL value in the server HTML (value={92}) and animate from 0 only after hydration if motion is allowed, so crawlers, no-JS users and CLS are not affected; its SSR output is not documented, so test it (see unverified). Add aria-label='92 percent reduction in evidence effort' on the card wrapper so assistive tech does not read intermediate digits. Sparkline: d3-shape line() + scaleLinear in a server component, emitted as <svg role='img' aria-label='Trend: ...'><path/></svg>. Before/after bars: two <rect> in an <svg> or two <div>s with width as a percentage, plus a visible text equivalent ('3 h to 15 min'). Use colour plus labels, never colour alone. CSP note: NumberFlow injects inline <style>; its docs describe a nonce prop and exporting the styles as strings so you can hash them, which matters if you tighten style-src.

**Libraries:** @number-flow/react 0.6.2, d3-shape 3.2.0

**Licence:** MIT (@number-flow/react, 7,792 stars, last push 2026-09-20); d3-shape ISC

**Cost/risk:** About 6 kB gzip. Risk: animating digits for 4 metrics is easy to overdo; trigger once on view and keep durations under 1 s. Honesty risk is bigger than technical risk, so never present self-reported figures as audited.

**Sources:** https://number-flow.barvian.me/ https://registry.npmjs.org/@number-flow/react/latest https://bundlephobia.com/api/size?package=@number-flow/react@0.6.2 https://api.github.com/repos/barvian/number-flow https://forgotten-mistory.web.app/

## [must] 5. First-class AI assistant panel using the existing Cloud Run backend, AI SDK useChat and an accessible chat log

**What:** Promote 'Ask Mini Vic' into a persistent assistant: a floating launcher plus a docked side panel on desktop and a bottom sheet on mobile. Include 4-6 suggested questions ('What did you deliver at ANZ?', 'Show AI projects'), streaming answers, a Stop button and evidence chips that deep-link and scroll to the timeline role or project card the answer cites. Show the model-likeness and cloned-voice notices the site already carries.

**Why:** The live CSP's connect-src already allows https://minivicchat-hjdyjsrzvq-uc.a.run.app, generativelanguage.googleapis.com and *.googleapis.com, so a streaming chat backend exists and the front end can call it directly from a static export. The Vercel AI SDK's useChat accepts a custom endpoint, which the docs show via DefaultChatTransport({api}). The UI is the part that makes it feel first-class.

**How:** Option A (lowest risk): npm i ai @ai-sdk/react; const {messages, sendMessage, status, stop} = useChat({transport: new DefaultChatTransport({api: CHAT_URL})}); render message.parts. If the existing endpoint streams plain text, use TextStreamChatTransport instead (the docs note tool calls and usage are unavailable on it). Option B: assistant-ui (MIT, 13,044 stars, pushed 2026-11-10) for ready-made, composable primitives, supporting AI SDK or 'your own server' runtimes; I could not confirm static-export compatibility from its docs page, so prototype it first. Accessibility: wrap messages in <div role='log' aria-labelledby='chat-title'>; MDN says log has implicit aria-live=polite and aria-atomic=false, so append-only and do not set aria-atomic=true. Do not stream token-by-token into the live region: buffer and set the completed message (or a throttled sentence-level update) so screen readers are not flooded. Panel is a labelled <dialog> or role='complementary' with focus trap only in modal mobile mode, Esc closes, focus returns to the launcher, and a visible text input with associated <label>. Honour reduced motion (no typing shimmer, instant panel). Rate-limit and add abuse protection server side. Static-export note: Next Server Actions and rewrites are unsupported, so call the backend by absolute URL or via a Firebase Hosting rewrite to Cloud Run (same origin, Hosting enforces a 60 s request timeout; streaming behaviour is not documented, so test it).

**Libraries:** ai + @ai-sdk/react (Vercel AI SDK), assistant-ui (optional)

**Licence:** Vercel AI SDK: Apache-2.0 (LICENSE file read; GitHub API reports 'Other/NOASSERTION', 27,856 stars). assistant-ui: MIT.

**Cost/risk:** AI SDK adds client JS only to the lazily-loaded panel (load it with next/dynamic after first interaction so it does not touch LCP). Alternative Firebase AI Logic (client SDK straight to Gemini; free tier on Gemini Developer API) enforces App Check by default and needs a production attestation provider such as reCAPTCHA Enterprise, which very likely loads Google-hosted script and would conflict with script-src 'self' (inference, unverified), so prefer the existing Cloud Run endpoint. Costs and abuse are real: add per-IP limits and a monthly cap. Voice cloning and face likeness raise disclosure obligations; keep the on-page notice.

**Sources:** https://forgotten-mistory.web.app/ https://ai-sdk.dev/docs/ai-sdk-ui/chatbot https://raw.githubusercontent.com/vercel/ai/main/LICENSE https://api.github.com/repos/vercel/ai https://www.assistant-ui.com/docs https://api.github.com/repos/assistant-ui/assistant-ui https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role https://firebase.google.com/docs/ai-logic/get-started https://firebase.google.com/docs/hosting/functions https://nextjs.org/docs/app/guides/static-exports https://github.com/medevs/smart-portfolio

## [should] 6. Skills / capability constellation: force layout pre-computed at build time and rendered as static SVG

**What:** Turn the 17-row capability table into a constellation. Nodes are capabilities (Delivery, Agile, AI/LLM, Multi-agent, Cloud, QA/Automation, WebGL and so on), grouped by domain, with edges showing which employers or projects evidenced them. Node size is the number of evidence items, not 'proficiency'. Node fill/shape encodes the existing evidence status (measured in production, measured outside production, in progress). Hover or focus highlights the connected employers and projects.

**Why:** d3-force documents the static pattern: simulation.stop() then simulation.tick(300) computes a layout synchronously with no animation timer. Run that inside a Server Component, so the client receives final x/y as plain SVG with zero physics JS and no layout shift. That avoids the usual 60 kB canvas graph runtime. It also fits the audience: it shows breadth and links skills to evidence rather than bars.

**How:** npm i d3-force. In the server component: const sim = forceSimulation(nodes).force('link', forceLink(links).id(d=>d.id).distance(60)).force('charge', forceManyBody().strength(-120)).force('collide', forceCollide(r)).force('x', forceX(cx).strength(0.05)).force('y', forceY(cy).strength(0.05)).stop(); sim.tick(300); then render <circle cx cy r> and <line>. Seed positions (e.g. place each domain on a ring) so builds are deterministic. Interaction: a tiny client island toggles a data-active attribute on hover/focus; CSS dims non-neighbours. Accessibility: every node is a focusable <button> or <a> inside <svg> (or an HTML overlay) with aria-label 'Prompt engineering, evidenced in 3 projects'. Provide the same data as a grouped list or matrix (recommendation 7) and a 'Show as list' toggle, because force graphs are hard for screen readers and for keyboard users. Reduced motion: no drift or wobble. Optional enhancement: slow idle drift using CSS transforms only, paused on prefers-reduced-motion and on hover, with a pause button if it runs over 5 s (WCAG 2.2.2). react-force-graph-2d (MIT, v1.29.2, 59.8 kB gzip, canvas, d3-force-3d) is only worth it if you need drag and zoom on a large graph; its README does not address accessibility, and with ~17-40 nodes static SVG is better.

**Libraries:** d3-force (ISC family, 5.7 kB gzip on the build machine only if run at build time; ships 0 kB when pre-computed), react-force-graph-2d 1.29.2 (optional)

**Licence:** d3-force: ISC (d3 org); react-force-graph: MIT (3,359 stars, pushed 2026-09-29)

**Cost/risk:** Pre-computed: near zero client cost. Risk: static layouts do not respond to window resize, so use a viewBox and let it scale, and re-layout per breakpoint at build time if the mobile aspect ratio differs a lot. Do not use the 3D or VR variants for this (see avoid).

**Sources:** https://d3js.org/d3-force/simulation https://registry.npmjs.org/react-force-graph-2d/latest https://github.com/vasturiano/react-force-graph https://vasturiano.github.io/react-force-graph/ https://api.github.com/repos/vasturiano/react-force-graph https://bundlephobia.com/api/size?package=d3-force@3.0.0 https://bundlephobia.com/api/size?package=react-force-graph-2d@1.29.2 https://www.w3.org/WAI/tutorials/images/complex/ https://forgotten-mistory.web.app/

## [should] 7. Evidence matrix instead of proficiency bars (capability x employer/project heat grid)

**What:** A grid with capabilities as rows and the 8 employers plus key projects as columns. A filled cell means evidence exists, with three visual states matching the existing status circles (measured in production, measured outside production, in progress). Selecting a cell opens the evidence text and source. Rows can be sorted or filtered by audience (Hiring manager vs Business client).

**Why:** It answers the brief's 'no meaningless proficiency bars' directly and it is the most screen-reader-friendly of the skills views, because it is a genuine table. It also reuses the data and the semantics (evidence, source, status) already on the live capability table, so it is an upgrade, not new content.

**How:** Render a real <table> with <th scope='row'> and <th scope='col'> and CSS-style the cells as a heat grid (position: sticky for the first column and header). Cell content is a visually hidden status word ('Measured in production') plus an icon whose shape differs by status (filled, half, empty circle) so colour is not the only signal. Hover and focus show the evidence in a popover implemented with the native Popover API or a <details>; keep it keyboard operable. Filter chips are <button aria-pressed>. Mobile: collapse to cards per capability with the employers listed, no sideways scroll. Animation: CSS view() fade of rows, none under reduced motion. If a band or colour scale is wanted, use d3-scale scaleBand/scaleOrdinal on the server.

**Libraries:** d3-scale 4.0.2 (optional, server-side), Native HTML table and Popover API

**Licence:** ISC (d3-scale); platform HTML otherwise

**Cost/risk:** 0 kB client JS apart from the filter chips (small client island). Risk is content curation: each cell needs honest evidence, so leave cells empty rather than padding them.

**Sources:** https://forgotten-mistory.web.app/ https://www.w3.org/WAI/tutorials/images/complex/ https://d3js.org/d3-scale/time https://www.react-graph-gallery.com/

## [should] 8. Project case studies: hand-authored animated SVG flow diagrams with a step-through walkthrough

**What:** For each of the six repos (aether-job-career-agent, ralph-loop-infinite, prompt-reconstruction-engine, and so on) draw the mechanism as an SVG: nodes and arrows for the agent loop, with a 'Step 1 of 5' control. Each step highlights one node and edge, draws the connecting line, and shows a caption. Clearly label each as a schematic, as the live site already does.

**Why:** Hand-drawn SVG plus Motion's pathLength is the lightest way to get an animated architecture diagram, and it is fully static-export compatible. Heavy node-editor libraries solve a different problem (interactive editing).

**How:** Define each diagram as data ({nodes:[{id,x,y,label}], edges:[{from,to}], steps:[{highlight:[ids], caption}]}) and render with one <Diagram> component. Edges are <m.path pathLength> (Motion, recommendation 3) animated from 0 to 1 when the step becomes active. Step control is a real <button> pair ('Previous', 'Next') plus keyboard arrow keys, with aria-live='polite' on the caption (not on the SVG) so each step is announced once. Scroll-linked alternative: pin the diagram with position: sticky and drive step changes with CSS view timelines on the step captions (see recommendation 2); scrollama (MIT, 6,014 stars) is the JS option but its last push was 2025-11-13, so prefer CSS or a 30-line IntersectionObserver. Text alternative: an ordered list of the same steps rendered in HTML for screen readers and for the no-JS and reduced-motion state, where all edges are shown fully drawn.

**Libraries:** motion 14.12.0, SVG (no library), scrollama (optional, MIT)

**Licence:** MIT (motion, scrollama)

**Cost/risk:** Authoring cost is the real expense (6 diagrams). Bundle cost is small because the Motion features are already loaded. @xyflow/react (React Flow) is NOT recommended for this (see avoid).

**Sources:** https://motion.dev/docs/react-svg-animation https://motion.dev/docs/react-reduce-bundle-size https://api.github.com/repos/russellgoldenberg/scrollama https://www.webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/ https://www.w3.org/WAI/tutorials/images/complex/ https://forgotten-mistory.web.app/

## [should] 9. GitHub activity and repository stats fetched at build time, with a contribution heatmap

**What:** A 'Keeping me busy' panel that shows live-from-build stats for the public repos (stars, primary language, last-push date, open-source licence) and a 12-month contribution heatmap. Each card links to the repo. A 'Data as of <build date>' stamp keeps it honest.

**Why:** Next's static export runs Server Components at build time, so a fetch to the GitHub API happens during `next build` and the result is baked into the HTML (confirmed in the Next static-export docs). No runtime API calls, no rate-limit exposure for visitors, and nothing to fail on the client. react-activity-calendar renders heatmaps with SSR support.

**How:** In a Server Component: const repos = await fetch('https://api.github.com/users/<login>/repos?per_page=100&sort=pushed', {headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}}).then(r=>r.json()). Unauthenticated REST is 60 req/h per IP, authenticated 5,000/h, and GITHUB_TOKEN in Actions 1,000/h per repo (GitHub docs), which is plenty for one build. Commit a fallback data/github.json snapshot and use it if the fetch fails, so a rate limit never breaks a deploy. Rebuild nightly through a scheduled GitHub Actions workflow to refresh the numbers (standard practice; not verified here). Heatmap: npm i react-activity-calendar; data is [{date,count,level}] with levels 0-4; the contribution data itself needs the GraphQL API with a token (not confirmed, see unverified), so otherwise derive the activity from repo push dates. Accessibility: give the heatmap a text summary ('1,284 contributions in the last year, busiest month March') and a <table> or <details> fallback; do not rely on colour alone. Reduced motion: no cell cascade animation. The live CSP already allows api.github.com in connect-src, so a client-side refresh is possible but unnecessary.

**Libraries:** react-activity-calendar 3.2.1, Native fetch in Server Components

**Licence:** MIT (react-activity-calendar, 600 stars, pushed 2026-11-09; peer React ^18||^19; depends on date-fns and @floating-ui/react)

**Cost/risk:** Zero visitor-side API cost. Risk is stale data between rebuilds (show the build date) and token handling (store as a CI secret and never expose it in the bundle).

**Sources:** https://nextjs.org/docs/app/guides/static-exports https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api https://registry.npmjs.org/react-activity-calendar/latest https://api.github.com/repos/grubersjoe/react-activity-calendar https://github.com/grubersjoe/react-activity-calendar https://forgotten-mistory.web.app/

## [must] 10. Make the static export CSP-clean: Next experimental SRI instead of 'unsafe-inline'

**What:** Align the real header with the stated policy. The live CSP currently has script-src 'self' 'unsafe-inline' 'unsafe-eval' and style-src 'unsafe-inline'. Move to script-src 'self' using hash-based Subresource Integrity, and keep connect-src limited to the chat and GitHub origins that are really used.

**Why:** Next's CSP docs say nonces require dynamic rendering (static pages are generated with no request headers), so nonces are incompatible with output: 'export'. Next's experimental SRI generates hashes of JS at build time and lets you keep static generation with script-src 'self'. This matters for the visuals because every inline script or style injected by an animation or chart library is a CSP risk.

**How:** next.config.js: experimental: { sri: { algorithm: 'sha256' } } and the Next doc's SRI CSP (script-src 'self'; style-src 'self'). Because static export does not support the headers() config (listed as unsupported), set the CSP in firebase.json hosting headers instead. Build and test in a real browser: Next also emits inline bootstrap scripts, so verify the console shows no CSP violations (the docs say SRI works with static generation; whether it also covers the inline __next_f payload scripts in an export is not confirmed, see unverified), and fall back to keeping 'unsafe-inline' for scripts only if violations remain. Remove 'unsafe-eval' (the docs say React does not need it in production). Keep fonts via next/font (self-hosted) and any WebGL shader code as strings, not eval. Third-party libraries to check for inline style injection: NumberFlow (offers a nonce prop and exportable style strings), Motion (inline style attributes are fine under style-src-attr), cobe (none, canvas only).

**Libraries:** next (experimental.sri)

**Licence:** MIT (Next.js)

**Cost/risk:** Experimental flag, so it may change, and a mistaken policy blanks the page. Mitigate with a preview-channel deploy and a Playwright check that fails on any CSP violation. Security payoff is real for a personal site but is secondary to shipping the visuals.

**Sources:** https://nextjs.org/docs/app/guides/content-security-policy https://nextjs.org/docs/app/guides/static-exports https://number-flow.barvian.me/

## [could] 11. Optional hero globe with cobe (WebGL) and a static fallback

**What:** A small, dark, interactive globe in the hero or contact area with markers for Melbourne and any real client or employer cities, plus an arc or two. Drag to rotate. Make it decorative-plus: the real content is the text beside it.

**Why:** cobe is a 5 KB WebGL globe with no dependencies (13,004 B minified, 5,931 B gzip measured). It is much lighter than a three.js scene, since three 0.185 alone is 182 kB gzip on bundlephobia. v2 adds markers and arcs with ids, and CSS-anchor-positioned DOM labels with a visibility variable, so the labels are real, accessible HTML. This delivers the 'advanced visualisation' wow without hurting mobile LCP, if lazy-loaded.

**How:** npm i cobe. In a client component: const globe = createGlobe(canvas, {devicePixelRatio: Math.min(devicePixelRatio, 2), width, height, phi, theta: 0.3, dark: 1, diffuse: 1.2, mapSamples: 16000, mapBrightness: 6, baseColor, markerColor, glowColor, markers:[{location:[-37.81,144.96], size:0.06, id:'mel'}], onRender: s => { s.phi = phi; }}); call globe.destroy() on unmount. Lazy-load with next/dynamic and an IntersectionObserver so it only initialises when near the viewport; below it render a CSS-only poster (radial gradient + SVG dots) so LCP never waits on WebGL. Feature-detect WebGL (try canvas.getContext('webgl')); if unavailable or prefers-reduced-motion is set, show the poster or a single non-rotating frame (do not run the rAF loop). Auto-rotate longer than 5 s needs a pause control (WCAG 2.2.2) or stop it after the first few seconds and on hover/focus. Canvas gets role='img' with aria-label describing it, and the markers are listed as text. Only add this if it carries real information (for example named client geographies); because the career is Melbourne-centric, a globe with one dot is decoration. If you want GPU tiering, @pmndrs/detect-gpu (MIT) works, but self-host its benchmark JSON (default fetch is from unpkg, which the CSP blocks) and note its upstream data source (gfxbench) stopped updating in Dec 2025.

**Libraries:** cobe 2.0.1, @pmndrs/detect-gpu (optional)

**Licence:** MIT (cobe, 6,055 stars, pushed 2026-09-22; detect-gpu MIT)

**Cost/risk:** About 6 kB gzip, one WebGL context, continuous GPU use while animating; pause offscreen. Risk is meaningless decoration; skip it if the data is not real. If a richer 3D scene is ever wanted, @react-three/fiber 9.8.2 (MIT) works but adds roughly 180 kB gzip for three, so lazy-load it behind a user action only.

**Sources:** https://github.com/shuding/cobe https://cobe.vercel.app/ https://registry.npmjs.org/cobe/latest https://bundlephobia.com/api/size?package=cobe@2.0.1 https://bundlephobia.com/api/size?package=three@0.185.0 https://api.github.com/repos/shuding/cobe https://api.github.com/repos/pmndrs/react-three-fiber/releases/latest https://github.com/pmndrs/detect-gpu https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html

## Avoid
- Recharts 3.10.1 for the 4 to 5 simple visuals: 149.9 kB gzip (bundlephobia, un-tree-shaken) for what plain SVG + d3-shape does in a few kB. Its accessibility layer (accessibilityLayer, arrow-key navigation) exists, but a GitHub discussion reports VoiceOver axis problems that were unresolved in what I read. I did not find Recharts 3 accessibility docs.
- Apache ECharts 6.1.0: Apache-2.0 and capable, but 368 kB gzip full bundle (bundlephobia) and canvas rendering by default, which means poor text alternatives. Overkill for a portfolio.
- Observable Plot client-side: ISC and elegant, but 127 kB gzip for 0.6.19 (bundlephobia) and it builds DOM in the browser, so it fights static export and LCP. Fine for exploratory notebooks, not this page. (Running it at build time would need a DOM shim, which I did not verify.)
- react-force-graph-3d / -vr / -ar for the skills map: three.js plus WebGL, no documented accessibility, harder to keep readable without WebGL, and a 3D force graph of about 17 to 40 nodes is a gimmick that hurts mobile. The README addresses canvas and WebGL only.
- @xyflow/react (React Flow) for case-study diagrams: MIT, but about 60 kB gzip, built for editable node editors, and the on-canvas attribution may only be removed with a React Flow Pro subscription (from $169/month per its own page). Hand-authored SVG is lighter and fully controllable.
- GSAP as the main animation layer: now free for commercial use, but its licence is proprietary with Prohibited Uses (it is not described as open source), which conflicts with the 'free/open-source licence' rule, and Motion plus CSS scroll-driven animations already cover the need.
- Firebase AI Logic with App Check reCAPTCHA directly from the browser: App Check is enforced by default and needs a production attestation provider; reCAPTCHA Enterprise almost certainly loads Google-hosted scripts, which clash with script-src 'self' (inferred, not verified). Use the existing Cloud Run endpoint.
- Nonce-based CSP (Next proxy.ts + nonces): Next's docs say nonces force dynamic rendering for all pages, which is incompatible with output: 'export' and CDN-cached static hosting.
- Scroll-jacking or smooth-scroll hijack libraries and long pinned scrollytelling over the entire page: fails keyboard and reduced-motion expectations and risks INP; use native scroll with CSS view()/scroll() timelines.
- Skill percentage bars, radar charts of self-scored skills, and star ratings: meaningless without evidence, and the live site already moved away from them. Use the evidence matrix and constellation.
- Auto-playing looping ambient animation (rotating globe, drifting particles) with no pause control: fails WCAG 2.2.2 when it runs more than 5 seconds alongside other content.
- Loading detect-gpu benchmark data, fonts or libraries from unpkg/jsDelivr at runtime: blocked by the CSP (font-src 'self', script-src 'self') and its default benchmark URL is on unpkg. Self-host or skip.
- Unmaintained timeline and graph packages (for example d3-sankey, last pushed 2023-11-13 and BSD-3-Clause, is fine for static layout but check whether you need Sankey at all; there is no flow data worth a Sankey in this career story).

## Unverified
- Exact per-browser versions for scroll-driven animations: MDN's compatibility table was truncated in my fetch. I only confirmed MDN's 'Baseline 2026 Newly available' wording, web.dev's Firefox 159 statement, and WebKit's Safari 26 note. The 'threaded in Safari 26.4' detail came from a search snippet, not a page I opened.
- Chrome 145 shipping status of scroll-triggered animations (timeline-trigger/animation-trigger): the Chrome blog says 'slated for Chrome 145' and the spec is draft. I did not confirm it has shipped.
- Tree-shaken sizes of d3-scale, d3-shape, d3-force and Motion in a real Next build. Bundlephobia figures are whole-package; Motion's 5 kB, 24 kB and 38 kB figures are from Motion's docs (Rollup), not measured by me.
- Individual licences of d3-scale, d3-shape, d3-array and d3-force: I verified d3/d3 is ISC and d3-sankey is BSD-3-Clause, but did not open each module's licence file.
- Whether @number-flow/react renders the final number in server HTML and how it behaves with hydration: the docs I read do not describe SSR output beyond CSP nonce notes.
- Whether GitHub's contribution calendar (GraphQL contributionsCollection) needs an authenticated token and exact fields: the docs page I fetched was only an index. Treat it as likely token-required; verify before building.
- Whether assistant-ui works in a pure static export with a custom or remote backend: its docs page did not mention it; prototype before committing.
- Whether Firebase Hosting rewrites to Cloud Run/Functions pass streamed (SSE or chunked) responses without buffering: the docs say nothing on streaming, only a 60 s request timeout.
- Whether Next's experimental SRI also covers or removes the inline bootstrap scripts of an output: 'export' build so that script-src 'self' works with no 'unsafe-inline'. Needs a build and browser test.
- Whether App Check's reCAPTCHA provider conflicts with script-src 'self' (my inference from how reCAPTCHA is generally loaded; not shown on the page).
- The existing minivicchat Cloud Run endpoint's protocol (plain text vs AI SDK UI message stream), auth and rate limiting: I only saw its origin in the live CSP header.
- Example sites for each pattern: I opened react-graph-gallery.com (network, sankey, timeseries, animation sections), cobe.vercel.app, vasturiano's react-force-graph demo page and medevs/smart-portfolio (MIT, 46 stars, chat route plus Supabase). I did NOT open the Observable personal-website timeline notebook (rate-limited), the visx gallery (empty response), or the other portfolio-chat repos from search results, so their maintenance and licences are unknown.
- The existing site's fonts and exact Lighthouse numbers: not measured. I only read the page structure and response headers.
- The Chrome-side detail that the live CSP header has 'unsafe-eval' in script-src for the current build: read from the response header, but I did not check which dependency needs it.

# ux-perf

Research summary (all sources opened 2026-11-10). (1) The UX evidence points one way: a senior reviewer needs a one-line positioning statement, one or two scoped proof points, and a single CTA within the first screen. The "10 seconds" figure comes from vendor blogs and is approximate. The strongest primary evidence is NN/g's finding that 57% of viewing time is above the fold and 74% is in the first two screenfuls. The current site fails that test: its hero carries a chatbot, a session widget, a portrait-play control and several contact links. It also uses cryptic section names, hedged "self-reported" metrics, and claims that conflict with its own status markers (AWS/GCP "studying" vs "Azure, GCP and AWS"). (2) Engineering: stay on Next.js App Router static export with next/font self-hosting, a pre-built AVIF/WebP image pipeline with a custom loader (default image optimisation is unsupported under output:export), and a CSS-first motion layer (scroll-driven animations are now Baseline 2026, plus Motion's LazyMotion at about 5kb). Reserve WebGL for one lazy-loaded, non-LCP, pausable hero object with a server-rendered fallback. Gate quality with a small Playwright smoke suite, @axe-core/playwright, and Lighthouse CI budgets, deployed by a single GitHub Actions workflow to Firebase Hosting. Current npm versions (registry, 2026-11-10): next 16.4.6 (you are on 15; staying on 15 is fine), react 19.3.1, three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, motion/framer-motion 14.12.0, tailwindcss 4.3.5, @playwright/test 1.65.0, @axe-core/playwright 4.14.0, @lhci/cli 0.16.0, sharp 0.35.5. All recommended libraries are MIT or Apache-2.0 except @axe-core/playwright (MPL-2.0), which is a dev-only tool.

## [must] 1. Rebuild the first screen as positioning statement + proof strip + one primary CTA

**What:** Replace the crowded hero with: H1 positioning line (role + domain + outcome, e.g. 'Delivery leader and AI solutions architect. 16 years shipping programs at ATO, ANZ, NAB, Microsoft, Telstra'), a one-sentence sub-line, a proof strip of 3 to 4 figures each with a named source/scope, a primary CTA (Email / mailto) and one secondary (Download CV). Move 'Ask Mini Vic', 'Session observatory', 'Play the portrait' and the checksum/build-ID noise out of the first screen (a single low-key entry later, or the footer). Rename sections to plain labels: Work, Experience, Capabilities, Contact.

**Why:** NN/g measured 57% of viewing time above the fold and 74% in the first two screenfuls, so the hero must carry the decision. A May 2026 senior-portfolio guide says: lead with a one-line positioning statement and the most senior scope, name a measurable outcome, use one clear CTA (mailto over a form), skip hero animation and the personal tagline. A April 2026 recruiter guide says reviewers ask 'does the headline tell me what this person does?' and want at least one result per project. Live-site review shows the opposite today (competing CTAs, cryptic labels, hedged metrics).

**How:** Server Component hero with semantic markup: <h1>, <p>, <ul> proof strip (each item: big number, one-line label, scope e.g. 'Programme value, ATO'), <a href='mailto:...'> styled as the primary button, secondary button to the CV PDF. Limit to two buttons. Drop 'self-reported' small print; instead state the scope in the label and keep the footnote in a single 'About these figures' disclosure. Keep the synthetic-media disclosure next to any cloned voice or generated portrait, not only in the footer, so authenticity is not questioned before the evidence. Reserve the hero visual's box with aspect-ratio so CLS stays 0. Fallback: the hero is pure HTML/CSS, so it is complete with JS or WebGL off, small screens, and reduced motion.

**Libraries:** Next.js 15 App Router (MIT), Tailwind CSS 4 (MIT)

**Licence:** MIT

**Cost/risk:** Zero runtime cost, it is static HTML. The risk is content, not code: every figure needs a defensible source or the proof strip backfires. The '10 seconds' timing is vendor-blog folklore, so design for a 2-screen scan rather than a stopwatch.

**Sources:** https://www.nngroup.com/articles/scrolling-and-attention/ https://standout.work/blog/portfolio-for-senior-software-engineers https://fueler.io/blog/how-recruiters-evaluate-your-digital-portfolio https://forgotten-mistory.web.app/

## [must] 2. Restructure into 4 to 6 case studies with a fixed system/scale/before-after/role template, plus a scannable experience and capabilities section

**What:** One-page order: hero + proof strip, Selected work (4 to 6 dated case studies), Experience (compact timeline of employers and scope), Capabilities (grouped, each with one line of evidence, no skills wall), Writing/GitHub (curated 6 of 38 repos), Contact. Each case study card: System, Scale (team size, budget, number of teams or services), Before → after metric, Your role (what you personally owned). For NDA work, describe the structural decision and trade-off. Remove 'no published figure' rows; omit a role's metric rather than flagging its absence.

**Why:** The senior-portfolio guide prescribes exactly this pattern and says hiring managers respond to it; the recruiter guide wants context, individual contribution, outcome, and says to curate ruthlessly (eight strong projects beat an archive). Both audiences (recruiters and business clients) can read the same cards. The current page flags five of eight roles as 'no published figure', which reads as a gap.

**How:** Typed content array in a content.ts file consumed by Server Components (no CMS). Case-study cards are <article> with <h3>, a <dl> for the four fields, and a link to the repo/write-up. Expand-in-place via native <details> or an anchored section, not a modal, so it works without JS and is keyboard- and screen-reader-friendly. Capabilities: 6 groups x up to 4 items; any claim not backed by a certificate must be worded to match its status (resolve the AWS/GCP vs 'studying' conflict by listing what is actually held).

**Libraries:** Next.js 15 (MIT), Tailwind CSS 4 (MIT)

**Licence:** MIT

**Cost/risk:** No bundle cost. The risk is content accuracy: claims that contradict their own status markers will be noticed by exactly the reviewers who check.

**Sources:** https://standout.work/blog/portfolio-for-senior-software-engineers https://fueler.io/blog/how-recruiters-evaluate-your-digital-portfolio https://forgotten-mistory.web.app/

## [must] 3. Mobile and desktop navigation for a one-page site: visible compact bar, anchor links, skip link, 24px+ targets

**What:** A sticky header with 4 to 5 visible anchor links on desktop (Work, Experience, Capabilities, Contact) plus a persistent 'Email' button. On mobile, either keep the 4 links as a horizontally compact bar or use a labelled 'Menu' button (not an icon alone) opening a native <dialog> or disclosure panel. Add a 'Skip to content' link, scroll-margin-top on sections equal to the header height, and active-section highlighting.

**Why:** NN/g: hidden menus are the least discoverable pattern and suit content-heavy browsing sites; visible navigation is better with up to about 5 options; the label 'Menu' slightly out-performs an icon alone (the article is from 2015, so treat it as directional). A four-section one-pager fits within the visible limit. WCAG 2.2 SC 2.5.8 requires 24x24 CSS px targets (or spacing/inline/equivalent exceptions) and 2.4.11 requires focused elements not be entirely hidden by author content such as a sticky header.

**How:** CSS: header{position:sticky;top:0} and section{scroll-margin-top:var(--header-h)} (this is also the 2.4.11 fix); html{scroll-behavior:smooth} inside @media (prefers-reduced-motion:no-preference). Buttons min-height:44px (comfortably above the 24px minimum). Active link via IntersectionObserver or CSS scroll-state; mark with aria-current='location'. Mobile menu: <button aria-expanded aria-controls> + <dialog> or details; close on Escape and on link click; trap nothing extra beyond what <dialog> provides. Use <nav aria-label='Primary'>. No JS dependency for the anchor links themselves.

**Libraries:** No library needed (native <dialog>, IntersectionObserver)

**Licence:** n/a (platform features)

**Cost/risk:** Under 1KB of JS. The risk is a sticky header obscuring focus: test with Tab through the page (also asserted in the Playwright suite in recommendation 10).

**Sources:** https://www.nngroup.com/articles/mobile-navigation-patterns/ https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## [must] 4. Self-hosted variable fonts via next/font, two families maximum, wired to Tailwind 4 theme tokens

**What:** Load one variable sans (body/UI) and optionally one display or mono face through next/font (Google loader downloads at build time; or next/font/local with a .woff2 you ship). Expose them as CSS variables and map them in Tailwind 4 with @theme inline. Use fluid type with clamp() and a minimum body size of 16 to 18px. Define colour tokens once for the dark theme (see rec 8).

**Why:** The CSP allows font-src 'self' only. Per the Next.js docs, next/font downloads CSS and font files at build time, self-hosts them with the static assets, sends no browser requests to Google, and by default injects size-adjusted fallbacks (adjustFontFallback) to cut CLS. web.dev says that if the LCP element is text using a web font, use a font-display value other than auto/block so text stays visible. The current site's tiny type is a primary readability complaint.

**How:** app/fonts.ts: export const sans = Inter({subsets:['latin'], variable:'--font-sans', display:'swap'}) (variable fonts need no weight list); optionally a second variable family for headings. Apply sans.variable on <html>. In global.css: @import 'tailwindcss'; @theme inline { --font-sans: var(--font-sans); }. Keep preload true (default) only for fonts used above the fold. Subsets: ['latin'] only. Do not add a third family. Fallback: system-ui stack via the fallback option.

**Libraries:** next/font (part of Next.js, MIT), Tailwind CSS 4.x (MIT)

**Licence:** MIT (framework). Check each font's licence; most Google Fonts are SIL OFL 1.1 or Apache-2.0, which allow commercial use. I did not open the licence of a specific family.

**Cost/risk:** One variable woff2 is typically tens of KB (exact size unverified for your chosen family). Tailwind 4 needs Chrome 111 / Safari 16.4 / Firefox 128 or newer, which is acceptable for this audience. Low risk.

**Sources:** https://nextjs.org/docs/app/api-reference/components/font https://web.dev/articles/optimize-lcp https://tailwindcss.com/docs/compatibility

## [must] 5. CSS-first motion layer: scroll-driven animations for reveals, Motion (LazyMotion) only for stateful interactions

**What:** Use native CSS animation-timeline: view() with animation-range for section reveals and a scroll() timeline for a reading-progress bar. Gate them with @supports (animation-timeline: view()) and @media (prefers-reduced-motion: no-preference), so unsupported browsers and reduced-motion users get the final state immediately. Use the 'motion' package (formerly framer-motion; React import from 'motion/react') only for things CSS cannot do well: layout/shared-element transitions, number count-ups, the mobile menu, and gesture-driven cards.

**Why:** MDN shows animation-timeline: view() as 'Baseline 2026: newly available' since October 2026, and Chrome's guide lists support as Chrome/Edge 115, Firefox 159, Safari 26 and notes these animations can run off the main thread, unlike scroll listeners. That keeps INP and main-thread cost low. Motion's own docs give sizes (gzip, rollup): motion component 43kb, m + LazyMotion just over 5kb initial, domAnimation +24kb, domMax +38kb, useAnimate mini 3.3kb. MotionConfig reducedMotion='user' disables transform and layout animations automatically, but opacity/colour still animate, and parallax and video autoplay need useReducedMotion by hand.

**How:** CSS: @media (prefers-reduced-motion: no-preference){ @supports (animation-timeline: view()){ .reveal{animation:reveal linear both; animation-timeline:view(); animation-range: entry 10% cover 30%} } } with @keyframes reveal{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}. Declare animation-timeline AFTER the animation shorthand. Animate only opacity and transform (web.dev CLS guidance). React: <MotionConfig reducedMotion='user'><LazyMotion features={domAnimation} strict>...</LazyMotion></MotionConfig> and import * as m from 'motion/react-m'. Remove any existing 'framer-motion' imports of the full motion component to reclaim about 38kb. The /motion package is already installed as framer-motion; npm shows framer-motion and motion at the same 14.12.0 version, so migrate the import path.

**Libraries:** motion 14.x (MIT), CSS scroll-driven animations (platform)

**Licence:** MIT (Motion: 'Motion is MIT licensed' per the repo page)

**Cost/risk:** CSS path is zero JS. Motion with LazyMotion adds about 5kb + 24kb. Risk: partial support in older Safari/Firefox, handled by the @supports fallback to the final state. Test with Playwright reducedMotion:'reduce'.

**Sources:** https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view https://developer.chrome.com/docs/css-ui/scroll-driven-animations https://motion.dev/docs/react-reduce-bundle-size https://motion.dev/docs/react-accessibility https://github.com/motiondivision/motion https://web.dev/articles/cls https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## [should] 6. One lazy-loaded WebGL hero object (R3F 9 + drei) that is never the LCP element, with an SSR'd fallback, pause control and on-demand rendering

**What:** A single restrained 3D or shader visual (for example a slow-moving node graph or particle field that reads as 'multi-agent systems') in the hero background or beside the headline. The HTML/CSS hero (rec 1) renders first and is the LCP; the canvas mounts later, only if WebGL2 is available, the user has not asked for reduced motion, the device is not low-power, and the element is in the viewport. Provide a visible 'Pause animation' button.

**Why:** This delivers the 'advanced visualisation' brief without risking LCP/INP. web.dev says the LCP resource must be discoverable in initial HTML and 'never lazy-load your LCP image'. So make a text/HTML element the LCP and load the canvas after it. R3F's docs recommend frameloop='demand', instancing and a few hundred draw calls at most, and adaptive DPR/PerformanceMonitor. WCAG 2.2.2 (Level A) requires a way to pause/stop/hide moving content that starts automatically, lasts more than 5 seconds and runs alongside other content, and content that starts on scroll-into-view counts as automatic. @react-three/fiber 9 pairs with React 19; three.js, R3F and drei are all MIT.

**How:** const Hero3D = dynamic(() => import('./Hero3D'), {ssr:false}) loaded from a small client wrapper that checks: matchMedia('(prefers-reduced-motion: reduce)').matches===false, a WebGL2 probe (document.createElement('canvas').getContext('webgl2')), and an IntersectionObserver or requestIdleCallback gate. <Canvas frameloop={paused?'never':'always'} dpr={[1,1.5]} gl={{antialias:false, powerPreference:'low-power'}} performance={{min:0.5}}> with <PerformanceMonitor onDecline={()=>setDpr(1)}/>; use instancedMesh for particles; pause via IntersectionObserver when off-screen and on document.hidden. Static poster: pre-rendered AVIF/WebP of the scene in the SSR markup with fixed aspect-ratio, shown for no-WebGL, reduced motion, errors (wrap in an ErrorBoundary) and before mount. Canvas is aria-hidden='true' and purely decorative; all information is in the HTML. Do not import drei wholesale: import only the helpers used so tree-shaking works.

**Libraries:** three 0.187 (MIT), @react-three/fiber 9.8 (MIT), @react-three/drei 10.7 (MIT), @react-three/postprocessing 3.2 (MIT) only if a bloom pass is clearly worth it

**Licence:** MIT (three.js and R3F repos both show MIT; drei MIT)

**Cost/risk:** three + R3F is a large chunk (I did not measure it; assume more than 150kb gzip and verify with @next/bundle-analyzer), but it is code-split and loads after LCP. GPU/battery cost on mobile, so cap DPR at 1.5, use demand or paused loops, and drop postprocessing on small screens. Maintenance risk: three.js releases frequently with minor breaking changes; pin versions. @types/three in the repo is 0.165.0 while three is 0.187, so align them.

**Sources:** https://r3f.docs.pmnd.rs/advanced/scaling-performance https://github.com/pmndrs/react-three-fiber https://github.com/mrdoob/three.js https://github.com/pmndrs/drei https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html https://web.dev/articles/optimize-lcp

## [should] 7. Static-export image pipeline: pre-build AVIF/WebP variants with sharp and a custom next/image loader

**What:** No image optimisation server exists on Firebase Hosting static export. Generate responsive variants (for example 480/960/1600w AVIF + WebP + JPEG fallback) at build time with sharp, and point next/image at them with a local custom loader. Always set width/height (or aspect-ratio) and mark only the above-the-fold image priority/fetchpriority=high. Use SVG (inline or file) for diagrams and logos. Keep the portrait under about 60KB at display size.

**Why:** The Next.js static-export docs list 'Image Optimization with the default loader' as unsupported and document a custom loader (loaderFile) as the supported route; it just needs to return a URL for a given width. web.dev: set fetchpriority='high' on at most one or two LCP candidates and never lazy-load the LCP image; unknown image dimensions cause CLS. The repo already has an 'assets:hero' script, so this extends an existing pattern. sharp supports AVIF and WebP and is Apache-2.0.

**How:** scripts/assets/make-images.mjs (sharp, run in prebuild): for each source in assets/src, emit public/img/{name}-{w}.avif|webp. next.config: output:'export', images:{loader:'custom', loaderFile:'./lib/image-loader.ts'}. lib/image-loader.ts: ({src,width}) => `${src.replace(/\.\w+$/,'')}-${nearestWidth(width)}.webp`. Wrap in a <picture> with an AVIF <source> for the hero when you need AVIF with WebP fallback, since a single loader emits one format. Add firebase.json headers: Cache-Control public,max-age=31536000,immutable for /_next/static/** and /img/**, and a short cache for HTML. Cleanup: delete generated variants from git; build in CI only.

**Libraries:** sharp 0.35 (Apache-2.0), next/image (MIT)

**Licence:** Apache-2.0 (sharp), MIT (Next.js)

**Cost/risk:** Build-time only, no runtime cost. sharp needs Node 20.9+ (README). Slightly longer builds. Risk: custom loader must match the generated filenames exactly, so add a Playwright check that every <img> returns 200. The third-party loader path (Cloudinary etc.) is possible but adds an external img-src dependency and is unnecessary for a handful of images.

**Sources:** https://nextjs.org/docs/app/guides/static-exports https://web.dev/articles/optimize-lcp https://github.com/lovell/sharp https://firebase.google.com/docs/hosting/full-config

## [must] 8. WCAG 2.2 AA specifics for a dark, animated site (design-token level rules)

**What:** Bake these into tokens and components: text contrast of at least 4.5:1 (3:1 only for large text); UI component borders, icons, chart strokes and focus rings at least 3:1 against adjacent colours; visible 2px focus ring offset from the element on every interactive element; targets at least 24x24 CSS px (aim for 44); focused elements never fully hidden by the sticky header; no function that requires dragging without a click/keyboard alternative (carousels, sliders, timeline scrubbers); an on-page pause control for any auto-moving content lasting over 5 seconds; honour prefers-reduced-motion by removing or replacing motion, not necessarily all animation.

**Why:** W3C 'new in 2.2' confirms AA criteria 2.4.11 Focus Not Obscured (Minimum), 2.5.7 Dragging Movements, 2.5.8 Target Size (Minimum) and, importantly, that 2.4.13 Focus Appearance is AAA, not AA. WCAG 1.4.11 requires 3:1 for UI components and focus indicators, and text inside graphics falls under 1.4.3. 2.2.2 is Level A. MDN states reduced motion means remove, reduce or replace, and its own example swaps a scale pulse for an opacity dissolve. A dark theme is not a separate criterion: low-contrast grey-on-black is the usual failure, and the current site has small, low-contrast type.

**How:** Tokens in Tailwind 4 @theme: --color-bg, --color-surface, --color-text (at least 7:1 on bg for body copy as a safety margin), --color-text-muted (at least 4.5:1), --color-accent, --color-focus. Check every pair with a script in CI (a 10-line WCAG ratio function over the token table) in addition to axe. :focus-visible{outline:2px solid var(--color-focus);outline-offset:3px}. Charts/timelines: render as inline SVG with <title>/<desc> and a visually-hidden data table or list; never rely on colour alone (add shape/label). Dragging UIs: provide prev/next buttons. Add <html lang='en-AU'>, a single <h1>, landmark regions, and aria-live only where truly dynamic. Decorative canvases: aria-hidden. Add a site-wide 'Reduce motion' toggle that sets data-motion='off' and overrides prefers-reduced-motion, so the 2.2.2 control exists even when the OS setting is off.

**Libraries:** @axe-core/playwright 4.14 (MPL-2.0, dev only), Tailwind CSS 4 (MIT)

**Licence:** MPL-2.0 for axe (dev tooling only, not shipped); MIT for Tailwind

**Cost/risk:** No runtime cost. Automated tools catch only part of the problems (Playwright's own page says many issues can only be found manually), so add a manual keyboard pass and a screen-reader pass (NVDA or VoiceOver) to the release checklist. The 4.5:1 and 18pt/14pt-bold thresholds for 1.4.3 are from my own knowledge; I did not open that page.

**Sources:** https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion https://playwright.dev/docs/accessibility-testing

## [should] 9. SEO and social cards: Metadata API, static 1200x630 OG image, ProfilePage + Person JSON-LD

**What:** Set title, description, canonical, openGraph and twitter metadata via the App Router Metadata API. Ship a designed opengraph-image.png (1200x630) with opengraph-image.alt.txt, plus twitter-image. Embed a JSON-LD script describing a ProfilePage whose mainEntity is a Person: name, jobTitle, description, image, sameAs (LinkedIn, GitHub), address locality Melbourne, and dateCreated/dateModified. Add sitemap.xml and robots.txt via the metadata file conventions (static route handlers with dynamic='force-static').

**Why:** Google's ProfilePage documentation requires mainEntity (Person) with name, and recommends alternateName, description, image, sameAs, plus dateModified (reflecting human edits). The same page does not say standalone Person markup produces a rich result, so treat this as discoverability/entity clarity, not a guaranteed SERP feature. The Next.js docs confirm the opengraph-image file convention (.png/.jpg, 8MB OG limit, build fails if exceeded) and that generated images via ImageResponse are produced at build time unless they use request-time APIs.

**How:** app/layout.tsx: export const metadata = {metadataBase:new URL('https://forgotten-mistory.web.app'), title, description, alternates:{canonical:'/'}, openGraph:{...}, twitter:{card:'summary_large_image'}}. app/opengraph-image.png (export a designed 1200x630 once; or an opengraph-image.tsx with ImageResponse and a local .ttf read via node:fs at module scope, which runs at build). JSON-LD: <script type='application/ld+json' dangerouslySetInnerHTML={{__html: JSON.stringify(data).replace(/</g,'\\u003c')}}/> in the page Server Component (no CSP problem, because a JSON data block is not executed script, but verify in the browser console under your CSP). Validate with Google's Rich Results Test and schema.org validator after deploy. Update dateModified from the build stamp that scripts/build already produces.

**Libraries:** Next.js Metadata API (MIT), next/og ImageResponse (MIT; built into Next)

**Licence:** MIT

**Cost/risk:** No runtime cost. Risks: ImageResponse under output:'export' should work as it is statically generated, but I did not build it, so confirm in CI. Keep the JSON-LD content identical to visible page content or it can be treated as misleading markup.

**Sources:** https://developers.google.com/search/docs/appearance/structured-data/profile-page https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image https://nextjs.org/docs/app/guides/static-exports

## [must] 10. Lean test gate: Playwright smoke suite + axe + Lighthouse CI budgets

**What:** A small, trustworthy suite, about 8 to 12 tests, run against the built out/ folder: (a) page loads with 200, one h1, no console errors; (b) hero H1, proof strip and primary CTA are visible at 390x844 and 1440x900; (c) nav anchors scroll to the right section and focus is not obscured by the sticky header; (d) axe scan with tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa expects zero violations; (e) reducedMotion:'reduce' project: no running animations, canvas absent, all content visible; (f) WebGL-disabled project (launch with --disable-gpu / --disable-webgl): poster shown, content intact; (g) every <img> returns 200 with naturalWidth>0; (h) mailto and CV links are present; (i) keyboard-only tab order reaches the CTA within N tabs; (j) no requests to third-party origins (CSP guard). Lighthouse CI assertions: categories:performance minScore 0.9 (warn), accessibility and SEO minScore 1 (error), largest-contentful-paint maxNumericValue 2500 (error), cumulative-layout-shift maxNumericValue 0.05 (error; the brief's budget is tighter than Google's 0.1), total-blocking-time maxNumericValue 200 (warn), plus a byte-weight budget on the initial JS.

**Why:** Playwright documents @axe-core/playwright with withTags() and warns it finds only some problems, so pair it with a manual check. Playwright can emulate reducedMotion/colorScheme and device viewports in config or per test. LHCI supports staticDistDir, numberOfRuns, assertion levels (warn/error) and per-metric maxNumericValue, so it can serve the out/ folder directly with no server. Google's 'good' thresholds are LCP 2.5s, INP 200ms and CLS 0.1 at the 75th percentile (web.dev), and INP is a field metric (lab proxy: TBT).

**How:** playwright.config.ts: webServer {command:'npx serve out -l 3000', url:'http://localhost:3000'}, projects: desktop-chromium, mobile (devices['iPhone 13']), reduced-motion (use:{reducedMotion:'reduce'}), no-webgl (launchOptions args). Axe test: new AxeBuilder({page}).withTags([...]).analyze(); expect(results.violations).toEqual([]). lighthouserc.json: collect:{staticDistDir:'./out', numberOfRuns:3, settings:{preset:'desktop' for one run and mobile emulation for the other}}, assert:{assertions:{...}}, upload:{target:'temporary-public-storage'} (reports are public, deleted after a few days, so do not use it for anything sensitive). Since CLS and LCP in a 3-run lab setup are noisy, use median and keep error thresholds with some margin; run LHCI against the live URL post-deploy as a non-blocking check.

**Libraries:** @playwright/test 1.65 (Apache-2.0), @axe-core/playwright 4.14 (MPL-2.0), @lhci/cli 0.16 (Apache-2.0)

**Licence:** Apache-2.0 (Playwright, Lighthouse CI), MPL-2.0 (axe-core, dev-only)

**Cost/risk:** About 60 to 90 seconds of CI. Browser installs (npx playwright install --with-deps chromium) take the longest, so cache them. Lighthouse lab scores vary run to run: use numberOfRuns, error on hard budgets (LCP, CLS, a11y) and only warn on the overall performance score. Delete the repo's 21 validate:phaseNN shell scripts that do not gate anything, as they are noise relative to this suite.

**Sources:** https://playwright.dev/docs/accessibility-testing https://playwright.dev/docs/emulation https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md https://web.dev/articles/vitals https://web.dev/articles/inp https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

## [must] 11. One simple GitHub Actions workflow: build, test, audit, deploy to Firebase Hosting live; PRs get preview channels

**What:** A single workflow file: on pull_request, build + tests + LHCI and deploy to a preview channel; on push to main, build + tests, deploy to channelId: live, then a post-deploy smoke test against the production URL. Firebase config: public:'out', cleanUrls, long immutable cache headers on hashed assets and short cache on HTML.

**Why:** FirebaseExtended/action-hosting-deploy (Apache-2.0) takes firebaseServiceAccount, projectId, channelId (blank = auto preview channel per branch/PR, 'live' = production), expires (default 7 days) and optional repoToken to comment the preview URL on the PR. Each deployment is then independently verifiable, matching the small-fast-deploy requirement. Firebase's headers config uses glob 'source' patterns with ordered rules, and the static-export docs confirm out/ is the output folder.

**How:** jobs: test (actions/checkout, actions/setup-node with cache npm, npm ci, npm run build:static, npx playwright install --with-deps chromium, npx playwright test, npx lhci autorun); deploy (needs: test, if main): uses FirebaseExtended/action-hosting-deploy@v0 with firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}, projectId, channelId: live. Then a final step runs PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test --grep @prod. Add concurrency: {group: deploy, cancel-in-progress: false}. Rollback: Firebase Hosting keeps release history; roll back via the console or `firebase hosting:rollback`-style release promotion (verify the exact command). Housekeeping on the VPS: do builds in CI rather than on the VPS; locally run `npm cache clean --force` and delete .next/ and out/ after use.

**Libraries:** FirebaseExtended/action-hosting-deploy@v0 (Apache-2.0), actions/checkout, actions/setup-node (MIT)

**Licence:** Apache-2.0 (deploy action)

**Cost/risk:** GitHub-hosted runners and Firebase Hosting free tier cover a personal site. Risk: a long-lived service-account JSON key in secrets; the repo page documents only that method, and I did not confirm Workload Identity Federation support. Scope the key to Firebase Hosting Admin only. The action is pinned to the floating @v0 tag, and its Releases page was empty when I opened it, so pin a commit SHA if you want reproducibility.

**Sources:** https://github.com/FirebaseExtended/action-hosting-deploy https://firebase.google.com/docs/hosting/full-config https://nextjs.org/docs/app/guides/static-exports

## Avoid
- Hero full-screen WebGL canvas as the LCP element, or a preloader/intro animation gating content: LCP must be discoverable in initial HTML and the page must stay readable without WebGL; web.dev says to never lazy-load the LCP image/resource, and a late canvas pushes LCP and render delay well past 2.5 s on mobile. (A 2025 to 2026 senior-portfolio guide also says to skip hero animation.)
- Scroll-jacking and full-page smooth-scroll libraries (Lenis, locomotive-style) as a default: Lenis is MIT and has respectReducedMotion on by default, but its own README lists caveats (blocks anchor links while scrolling unless anchors:true, nested scroll containers need configuration, Safari fixed-position lag, no CSS scroll-snap, iframes). It adds JS for no recruiter-visible gain. Use native scroll plus CSS scroll-driven animations.
- GSAP as the animation engine: the licence is now the free 'Standard No Charge' licence (effective 30 April 2025, includes former paid plugins such as SplitText), which permits commercial use. But it is a custom Webflow licence, not OSI open source, it bars use in tools that compete with Webflow's animation builder, and Webflow can amend terms. It also duplicates what CSS scroll-driven animations plus Motion already give you, and your brief is free/open-source licences.
- Importing the full 'motion' component everywhere (43kb gzip) or both framer-motion and motion: use LazyMotion + m with domAnimation (about 5kb + 24kb) and strict mode.
- Letting next/image use the default loader or relying on 'unoptimized' with raw multi-MB PNG/JPEG portraits: the default loader is unsupported with output:'export' (Next.js docs). Use build-time sharp variants with a local custom loader. Do not add Cloudinary or another third-party image host unless you accept the extra img-src dependency.
- Loading Google Fonts via a <link> to fonts.googleapis.com or any third-party CSS/JS CDN: violates the font-src 'self' / script-src 'self' CSP. Use next/font, which downloads at build time. Also avoid 3+ font families and fonts under about 16px body size.
- Keeping the 'Ask Mini Vic' chatbot, 'Session observatory', MD5 CV checksum, build ID and 'Resonance neutral' labels in the primary reading path: they compete with the single CTA, add noise a recruiter cannot decode, and the page's own copy shows hedged and conflicting claims. Move to a clearly secondary spot or remove it.
- Cryptic or clever section titles ('Keeping me busy', 'Feedback & coffee?', 'Calibration card', 'Ten dimensions, answered'): they force decoding. Use Work, Experience, Capabilities, Contact.
- Skill bars, percentage self-ratings, tag clouds and logo walls: they are unverifiable and the senior-portfolio guidance says to cut skills walls, logo grids, carousels and auto-playing video. Replace with evidence-backed capability groups.
- Treating Focus Appearance (2.4.13) as a required AA criterion, or assuming the axe scan proves compliance: 2.4.13 is AAA in WCAG 2.2. Required AA additions are 2.4.11, 2.5.7, 2.5.8 and 3.3.8. Axe and Lighthouse are partial coverage; add manual keyboard and screen-reader checks.
- Animating layout properties (top/left/width/height) or heavy blur/box-shadow filters on scroll, and infinite looping decorative animations with no pause: both hurt CLS/INP and fail SC 2.2.2. Animate opacity and transform only (web.dev CLS guidance).
- Lighthouse performance score as the sole release gate on shared CI runners: lab scores are noisy. Gate on explicit LCP/CLS/accessibility assertions with numberOfRuns and median, and keep the overall score as a warning.
- Running builds, Playwright and Lighthouse on the VPS: keep the VPS free of node_modules/.next/browser caches. Build in GitHub Actions, and clean local artefacts after each run.

## Unverified
- The '10 seconds' first-impression figure: vendor and career blogs disagree (7, 10, 30, 60 seconds), and the commonly cited 7.4 to 11.2 s eye-tracking figure refers to LinkedIn, not portfolios. Treat it as approximate. NN/g's above-the-fold share (57%) is from a 2018 study, and the mobile navigation article is from 2015, so both are directional, not 2026 data.
- Gzip/brotli bundle size of three + @react-three/fiber + drei in your build: not read from any page. Measure with @next/bundle-analyzer before committing to the 3D hero.
- Whether next/og ImageResponse (opengraph-image.tsx) builds cleanly under output:'export' in this repo: the docs say generated images are statically optimized at build time, but I did not run a build. A pre-rendered static opengraph-image.png is the safe path.
- Firebase Hosting default Cache-Control behaviour, Content-Security-Policy header examples, and immutable-cache patterns for _next/static: the config reference page I opened does not cover them (it links to a separate Cache-Control guide). The firebase.json header snippets in my recommendations are standard glob usage but not copied from a page.
- Workload Identity Federation (keyless auth) for FirebaseExtended/action-hosting-deploy: the repo page documents only service-account JSON. Its latest release/tag could not be read (Releases section empty), only that examples use @v0.
- Latest release dates for react-three-fiber, drei, motion and three.js repos: GitHub Releases sections were empty in the fetch. Versions and modified dates above come from the npm registry (npm view), not from a web page. Stars: three.js 118k, R3F 33.6k, motion 35.0k, drei 10.1k, Lenis 17.2k, sharp 32.8k (as shown on the repo pages).
- Exact peer-dependency ranges of drei 10.x for React 19 (README states only that R3F 9 pairs with React 19). Check package.json before upgrading.
- Whether Next.js 16 (npm latest is 16.4.6) is a safe upgrade for this repo: the docs I opened are the current ones, and the static-export page still applies. I did not verify migration effort, and the brief specifies 15, so stay on 15 unless a security advisory requires otherwise.
- WCAG 1.4.3 numeric thresholds (4.5:1 normal text; 3:1 for 18pt or 14pt bold) were stated from knowledge, not from a page I opened; the Understanding 1.4.11 page I read only references them. axe-core's API page did not state which rule covers target size under wcag22aa or its limits on canvas/gradient contrast checks, so verify against the axe rule list.
- Firefox 159 and Safari 26 support for scroll-driven animations comes from the badges in Chrome's developer article; MDN's compatibility table itself was not in the fetched text (MDN only states 'Baseline 2026: newly available since October 2026'). Check caniuse before relying on the unsupported-browser fallback being rarely hit.
- Whether ProfilePage/Person JSON-LD yields any rich result: Google's doc defines the properties but does not say it does, and I found no Google statement about standalone Person markup.
- Claims on the live site ('voice-cloned' greeting, model-generated portrait, specific metrics) come from a summariser's reading of forgotten-mistory.web.app; I did not inspect the DOM, contrast values or Core Web Vitals field data for the current site. Run Lighthouse and axe on it for a real baseline before redesigning.
- Licences of the specific Google Fonts families you will pick (most are SIL OFL 1.1 or Apache-2.0); check each family's page.
