
**Context:** Parallax Floating Hero Elements with Depth Layers
    - `app/page.tsx`, `app/globals.css`
    - Adds perceived 3D depth to hero section - elements float at different z-depths responding to scroll/mouse creating premium portfolio feel 
    - Add `data-depth` attributes to hero elements, create CSS `transform: translateZ()` with perspective container, enhance GSAP parallax in script.js
    
**Role & Objective:** You are an expert Next.js and CSS animation developer. 

**Objective:** Enhance the hero section in `app/page.tsx` and `app/globals.css` to add parallax depth layers. 

**Constraints:** 
1. STRICTLY modify only these files. 
    - In page.tsx: Add `data-depth="1"` to `data-depth="3"` attributes on hero-title, hero-subtitle, telemetry-panel, and hero-meta elements. 
    - In globals.css: Add `.hero-section { perspective: 1000px; transform-style: preserve-3d; }` and depth-based transforms `.hero-content [data-depth="1"] { transform: translateZ(50px); }` etc with smooth transitions. 
    - Ensure accessibility is maintained. Test by running `npm run dev`. 
    
2. **STRITLY FOLLOW** @.cursor/commands/fix-errors.md for errors.

-----

**Context:** Animated Gradient Border Glow on Cards
    - `app/globals.css` - Premium animated borders that pulse with accent colors create visual interest on hover, differentiates from basic card designs
    - Add `@property --angle` for CSS Houdini animated gradients, create `conic-gradient` rotating border effect on `.meta-card`, `.skill-card`, `.glass-card` with `animation: rotate 4s linear infinite`

**Role:** You are an expert CSS animation developer. Add animated gradient border glow effects to cards in `app/globals.css`. 

**Constrainta:** STRICTLY modify only this file. 
    - **Add:** 
        1) `@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }`, 
        2) On `.meta-card:hover, .skill-card:hover, .glass-card:hover` add `background: linear-gradient(var(--bg-color), var(--bg-color)) padding-box, conic-gradient(from var(--angle), var(--accent-color),rgb(255, 255, 255), var(--accent-color)) border-box; border: 2px solid transparent; animation: borderRotate 3s linear infinite;`, 
        3) `@keyframes borderRotate { to { --angle: 360deg; } }`. 

**Testing:** run `npm run dev` → Open `http://localhost:8080/` →  Conduct comprehensive UI/UX Testing and identify issues, defects. requirement gaps etc., and list them in a form of a checklist in `ui_ux_audit.md` → Fix errors, issues, bugs, defects. browser exceptions, react server errors every single error, issue, warning, **NO EXCEPTIONS** → STRICTLY FOLLOW @.cursor/commands/fix-errors.md 

**Constraints:** Follow @.cursor/commands/fix-errors.md for errors.

-----

**Context:** Scroll-Triggered Reveal Animations with Stagger
    - `public/script.js`: Professional staggered animations as sections enter viewport create polished, high-end website feel - each element animates sequentially

**Tasks:** 
    - Enhance GSAP ScrollTrigger with `stagger: { each: 0.1, from: "start" }`, add `clipPath` reveal animations, create `splitText` effect for headings
    
**Role:** You are an expert GSAP animation developer. 

**Objective:** Enhance scroll animations in `public/script.js`. 

**Tasks:** 
    - Find the sections scroll animation and enhance with: 
        1) Add staggered reveal with `stagger: { each: 0.12, from: "start" }`, 
        2) Add `clipPath: "inset(0 0 100% 0)"` to `clipPath: "inset(0 0 0% 0)"` for section titles, 
        3) Create text split animation for `.section-title` where each character animates in sequence, 
        4) Add `scrub: 0.5` for smooth scroll-linked animations on parallax elements. Ensure reduced motion preference is respected.

**Testing:** Run `npm run dev` → Open `http://localhost:8080/` →  Conduct comprehensive UI/UX Testing and identify issues, defects. requirement gaps etc., and list them in a form of a checklist in `ui_ux_audit.md` → Fix errors, issues, bugs, defects. browser exceptions, react server errors, every single error, issue, warning, **NO EXCEPTIONS** → **STRICTLY FOLLOW** @.cursor/commands/fix-errors.md 

**Contraints:** 
    - STRICTLY modify only this file only: `public/script.js`. 
    - Follow @.cursor/commands/fix-errors.md for errors.

------

**Context:** Interactive Cursor Trail Effect: `public/script.js`, `app/globals.css`
 - Creates memorable interaction - cursor leaves glowing particle trail that fades, reinforcing space theme
 
**Tasks** 
    - Add canvas-based or DOM particle system following cursor, with fade-out and glow effects matching accent colors

**Role:** You are an expert JavaScript animation developer. 
**Objective:** 
    - Add cursor trail effect in `public/script.js` and `app/globals.css`. 

**Tasks** 
    - STRICTLY modify only these files. 
        1) In script.js: Create `initCursorTrail()` function that spawns 20 trail dots on mousemove, each dot fades and shrinks over 500ms, use object pooling for performance. 
        2) In globals.css: 
            * Add `.cursor-trail { position: fixed; width: 6px; height: 6px; background: var(--accent-color); border-radius: 50%; pointer-events: none; z-index: 9999; box-shadow: 0 0 10px var(--accent-color); }`. Respect `prefersReducedMotion`. 

**Testing:** Test performance. Run `npm run dev` → Open `http://localhost:8080/` →  Conduct comprehensive UI/UX Testing and identify issues, defects. requirement gaps etc., and list them in a form of a checklist in `ui_ux_audit.md` → Fix errors, issues, bugs, defects. browser exceptions, react server errors, every single error, issue, warning, **NO EXCEPTIONS** → **STRICTLY FOLLOW** @.cursor/commands/fix-errors.md
Follow @.cursor/commands/fix-errors.md for errors.

-------

**Context:** 
    - Morphing SVG Background Shapes: `app/globals.css`, `app/page.tsx`
    - Subtle organic shapes that morph continuously add visual richness without distraction - creates premium aesthetic
    - Add SVG blob shapes with CSS `@keyframes morph` using `d` path animations or multiple layered shapes with rotation
    
**Role:** You are an expert SVG animation developer. 

**Objective:** Add morphing background shapes to `app/globals.css` and `app/page.tsx`. 

**Tasks:** 
    - STRICTLY modify only these files. 
        1) In page.tsx: Add after SpaceScene component `<div className="morphing-bg"><svg>...</svg></div>` with 2-3 blob shapes using `<path>` elements. 
        2) In globals.css: Add `.morphing-bg { position: fixed; inset: 0; z-index: -5; opacity: 0.03; }` and `@keyframes morph { 0%, 100% { d: path("M..."); } 50% { d: path("M..."); } }` with 20s duration. Keep subtle. 
        
**Testing:** Test rendering. Run `npm run dev` → Open `http://localhost:8080/` →  Conduct comprehensive UI/UX Testing and identify issues, defects. requirement gaps etc., and list them in a form of a checklist in `ui_ux_audit.md` → Fix errors, issues, bugs, defects. browser exceptions, react server errors, every single error, issue, warning, **NO EXCEPTIONS** → **STRICTLY FOLLOW** @.cursor/commands/fix-errors.md
Follow @.cursor/commands/fix-errors.md for errors.

**Constraints:** Follow @.cursor/commands/fix-errors.md for errors.