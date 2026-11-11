# stage

_WebGL stage architecture for React Three Fiber on Next 15.5 static export (one shared canvas, DOM-tracked views, lazy loading, runtime discipline, theme, text, WebGPU decision, SwiftShader testing)_

## [must] 1. Pin the stack: three 0.187.0 + R3F 9.8.2 + drei 10.7.9 (WebGL), stay off v10/drei 11 alphas

**What:** Install exact versions: three@0.187.0, @types/three@0.187.0, @react-three/fiber@9.8.2, @react-three/drei@10.7.9, maath@0.10.8. Add postprocessing@6.39.6 and @react-three/postprocessing@3.2.2 only if rec 11 is ever used. Use no caret ranges.

**Why:** All verified today with npm view. fiber 9.8.2 peers react '>=19 <19.4' and three '>=0.156', so React 19.2.8 is in range. drei 10.7.9 peers react ^19, three '>=0.159', fiber ^9.0.0. @react-three/postprocessing 3.2.2 peers fiber '>=9.7.0' and postprocessing '^6.36.0'. postprocessing 6.39.6 peers three '>= 0.168.0 < 0.188.0', so it will refuse three 0.188 when that ships; that is why everything is pinned. maath 0.10.8 peers three and @types/three. fiber 'latest' is 9.8.2; the 'alpha' tag is 10.0.0-alpha.6 (WebGPU first-class, state.gl renamed state.renderer, experimental). drei 'alpha' is 11.0.0-alpha.7. Do not use either for a production portfolio. I ran the stack myself on this machine: React 19.2.8 StrictMode in a development build, fiber 9.8.2, three 0.187.0, drei View, Chrome 157 with the SwiftShader flags. There was no double-mount error and no context loss (window.__lost stayed 0). The only console noise was 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.' It comes from fiber's store, which still does new THREE.Clock() (r183 deprecation). It is harmless; whitelist it in the test console-error filter. I also built a probe Next 15.5.25 app with output:'export' using webpack. A client component with next/dynamic(() => import('./Stage'), { ssr: false }) built cleanly. The route's First Load JS stayed 104 kB and no three chunk is referenced from index.html. The Turbopack build attempt failed only because my scratch node_modules was symlinked ('Next.js package not found'). Treat Turbopack as untested (see unverified), and keep 'next build' on webpack as the repo script does today.

**How:** 1) npm i -E three@0.187.0 @types/three@0.187.0 @react-three/fiber@9.8.2 @react-three/drei@10.7.9 maath@0.10.8. 2) Only a client component may call next/dynamic with ssr:false; Next says 'ssr: false is not allowed with next/dynamic in Server Components'. Keep a small 'use client' StageMount that lazy-imports the stage (rec 2). 3) Import drei by named export from '@react-three/drei'. The package has sideEffects:false, and the View + PerformanceMonitor + AdaptiveDpr + Preload imports cost about 1 kB gzip over fiber. Never import Environment presets or Text without reading rec 7: useEnvironment's default CUBEMAP_ROOT is https://raw.githack.com/pmndrs/drei-assets/... (CDN, blocked by CSP). 4) Add a Renovate/Dependabot group that bumps three, @types/three, fiber, drei and postprocessing together, and gate it on the SwiftShader pixel test (rec 10). 5) Keep reactStrictMode:true; it was clean.

**Libraries:** three@0.187.0, @types/three@0.187.0, @react-three/fiber@9.8.2, @react-three/drei@10.7.9, maath@0.10.8, postprocessing@6.39.6 (optional), @react-three/postprocessing@3.2.2 (optional)

**Licence:** three MIT; fiber MIT; drei MIT; maath MIT; @react-three/postprocessing MIT; postprocessing Zlib

**Cost/risk:** Lazy chunk about 249 kB gzip total (measured in the Next 15.5.25 webpack export: three/fiber chunks 87.6 + 101.9 + 52.2 + 7.7 kB gzip). Raw R3F with esbuild gave 251 kB gzip without react-dom. Risk is lockstep upgrades: postprocessing caps three below 0.188, and fiber's peer cap is react <19.4. Three ships roughly every 6 to 8 weeks (0.185 Jun 25, 0.186 Sep 8, 0.187 Oct 30 per npm time), so pin and upgrade deliberately.

**Sources:** npm view three/@react-three/fiber/@react-three/drei/@react-three/postprocessing/postprocessing/maath version peerDependencies (run 2026-11-10) https://github.com/pmndrs/react-three-fiber/releases https://nextjs.org/docs/app/guides/lazy-loading Local probes: scratchpad probe/run2.mjs (StrictMode dev build) and nextprobe (Next 15.5.25 export build)

## [must] 2. One fixed, shared canvas behind the page, mounted after first paint and only when a view is near

**What:** Use exactly one WebGL context for the whole site: a single fixed canvas that sits behind the DOM (z-index 0, content at z-index 1, html carries --bg, sections transparent where a view window exists). Every section visual is a 'view': a DOM placeholder plus a scene rendered into that placeholder's rectangle with viewport + scissor. Extend the existing VisualStage idea (NEAR_VIEWPORT 200px, WebGL2 probe, saveData check, poster) into one StageProvider rather than creating a canvas per section.

**Why:** Browsers cap live contexts. Chromium's limit is 16 on desktop and Chrome warns 'Too many active WebGL contexts. Oldest context will be lost'. Mobile limits are device-dependent and often 8 or fewer (community-sourced, 2020 tests). Seven sections times a canvas each is a guaranteed context-loss risk on phones and also multiplies GPU memory, shader compiles and render targets. One context also lets materials, geometries and textures be shared, and one scheduler control the budget. The DOM stays the LCP element: the canvas is never in the initial HTML, never blocks hero text, and is mounted later. Measured in this repo's stack: the WebGL chunk is not referenced from index.html at all, so initial JS is unchanged.

**How:** Mount: // StageMount.tsx ('use client')
const Stage = dynamic(() => import('./Stage'), { ssr: false });
export function StageMount(){ const [on,set]=useState(false);
 useEffect(()=>{ if(!canUseWebGL2()||reducedData()) return; const go=()=>set(true);
  // requestIdleCallback is absent in Safari (caniuse 81.2%): always fall back
  const id=('requestIdleCallback' in window)? requestIdleCallback(go,{timeout:2500}) : setTimeout(go,1200);
  return ()=> ('cancelIdleCallback' in window? cancelIdleCallback(id as number): clearTimeout(id as number)) },[]);
 return on? <Stage/> : null }
Better gate: an IntersectionObserver (rootMargin '300px') on every [data-stage-view] placeholder; set(true) on the first intersection, with the idle callback as a backstop so the hero view can warm up. Canvas element: <Canvas frameloop='demand' dpr={[1,1.5]} resize={{ scroll:false }} flat gl={{ antialias:false, alpha:true, powerPreference:'default', stencil:false }} style={{position:'fixed', inset:0, width:'100vw', height:'100lvh', pointerEvents:'none', zIndex:0}}>. Notes: resize.scroll:false (default is true with 50 ms scroll debounce, which adds a pointless scroll listener for a fixed canvas); 100lvh so the mobile URL bar collapsing does not resize the drawing buffer (viewport-unit-variants 96.1% supported); alpha:true so the CSS --bg and noise show through; powerPreference 'default' instead of R3F's default 'high-performance' to avoid waking the dGPU on laptops for a calm portfolio; antialias:false if all visuals are shader quads/lines drawn with analytic AA, else keep MSAA and pay the cost. Placeholders are plain DOM (<div data-stage-view='hero' aria-hidden='true' class='h-[60svh]'>) so layout, CLS and the poster are in the static HTML. Tree-shaking reality (measured): R3F does import * as THREE and extend(THREE), so a full three build (752 kB raw in the bundle) is always included; there is no way to ship 'only what I use' with R3F 9. Vanilla three with named imports for WebGLRenderer + Mesh + ShaderMaterial was 135 kB gzip versus 251 kB with fiber. Accept the extra ~115 kB gzip because it is lazy and after first paint. If the budget ever bites, the hero/figures visuals (pure fullscreen-quad shaders) could move to a vanilla-three renderer with the same view registry, but do not start there.

**Libraries:** three@0.187.0, @react-three/fiber@9.8.2, next@15.5.25 (already present)

**Licence:** MIT

**Cost/risk:** About 249 kB gzip lazy (zero in the initial bundle). Risk: a long idle wait can make the first view pop in late; keep the CSS-gradient/SVG poster in place and cross-fade on ready (the existing VisualStage pattern). A transformed ancestor breaks position:fixed (it becomes the containing block), so render <Stage/> through createPortal(document.body) or place it as a direct child of <body>, outside any element with transform/filter/will-change/contain.

**Sources:** https://github.com/pmndrs/drei/blob/master/src/web/View.tsx https://r3f.docs.pmnd.rs/api/canvas https://nextjs.org/docs/app/guides/lazy-loading caniuse-lite 1.0.30001823 (2026-11-06): viewport-unit-variants 96.1%, requestidlecallback 81.2%, webgl2 97.3% https://webkit.googlesource.com/WebKit/+/master/LayoutTests/webgl/many-contexts-expected.txt Local esbuild measurements (scratchpad probe/out) and Next webpack export chunk sizes

## [must] 3. View tracking: write a thin StageView registry modelled on drei View, with an overscanned page-attached canvas

**What:** Build the multi-view renderer yourself (about 150 lines) on top of R3F's useFrame, copying the scissor logic from drei's View.tsx, with four changes: (1) render and measure only views that an IntersectionObserver says are near; (2) cache rectangles and invalidate on resize/scroll rather than calling getBoundingClientRect for every mounted view in every frame; (3) make the canvas scroll with the document using the three.js official-example technique, plus overscan, to remove the compositor-versus-main-thread scroll lag; (4) clip each view to its scroll-clipping ancestors. Use drei <View> unchanged only as the day-one prototype.

**Why:** Exact current drei 10.7.9 View behaviour, read from the installed source: props are as, id, className, style, visible=true, index=1, frames (CanvasView default Infinity), children, track (deprecated). Usage is <View style={{height:200}}>...</View> anywhere in the DOM plus <Canvas eventSource={container}><View.Port/></Canvas>. Internally the Container's useFrame(fn, index) reads track.current.getBoundingClientRect() every frame when frames===Infinity (even for offscreen views, which still get a setState when their offscreen flag flips), sets autoClear=false, calls gl.setViewport/setScissor(left, bottom, width, height), setScissorTest(true), renders state.scene, then restores. It has no ResizeObserver, IntersectionObserver or scroll listener. A drei maintainer says frames={1} makes it call getBoundingClientRect 'only when the browser size changes' (Discourse 67831), but in the source frameCount is a local let reset on each React render of Container, so frames={1} measures once per React render and a view that moves on scroll would freeze: use it only for views that never move (pinned sticky stages). The known scroll problem: with a position:fixed canvas, the compositor scrolls the DOM asynchronously and the main thread learns the new offset a frame later, so the scene visibly trails its placeholder on fast scrolls (Discourse 77856 reports 'content trailing behind view position on scroll'; the only reported workaround was GSAP ScrollTrigger.normalizeScroll(true), which moves scrolling onto the main thread). Mozilla's docs describe the mechanism: scroll-linked effects lag because the compositor updates the visual scroll position before the scroll event reaches the main thread. The three.js multiple-elements example avoids it differently: canvas position:absolute at the top of the page, translated each frame by canvas.style.transform = translateY(scrollY px), so content painted in the canvas is attached to the document and scrolls with the DOM on the compositor, and only the canvas coverage edge can lag. Overscan hides that edge. This is my own extension of the example and I have not measured compositor lag in headless Chrome (see unverified). drei View also does not clip to overflow:hidden/clip ancestors (the scene is drawn in a separate canvas), so anything inside a clipped or scrolling container leaks.

**How:** DOM: <div data-stage-view='experience' data-animated class='stage-slot' aria-hidden='true'/>. Registry (module singleton + zustand-less store): Map<HTMLElement, {scene:THREE.Scene, camera:THREE.Camera, update(dt:number,r:Rect):void, visible:boolean, animated:boolean, rect:Rect|null}>. One IntersectionObserver({ rootMargin:'200px 0px' }) flips visible; one ResizeObserver on each slot and on documentElement marks rect stale; scroll listener (passive) marks rects stale and calls invalidate(). Canvas host: <div class='stage-host'> position:absolute; inset:0; overflow:clip; pointer-events:none; z-index:0 </div> (html,body position:relative) containing the <Canvas> at height calc(100lvh + 2*var(--overscan)), overscan = 25svh. The host's overflow:clip is required because a translated child otherwise adds to scrollHeight and feeds back into itself (design check, see unverified). Frame: useFrame(({gl, clock}, dtRaw)=>{ const dt=Math.min(dtRaw,1/20); const y=Math.max(0, scrollY) ; canvasEl.style.transform=`translate3d(0,${y-OVERSCAN}px,0)`; gl.autoClear=false; gl.setScissorTest(true); gl.clear(); let anim=false; for(const v of views) { if(!v.visible) continue; const r=v.rect ?? measure(v); const cssTop=r.top+OVERSCAN; /*view top in canvas CSS px*/ const w=r.width,h=r.height,x=r.left, yb=canvasH-(cssTop+h); gl.setViewport(x,yb,w,h); gl.setScissor(x,yb,w,h); if(camera.isPerspectiveCamera){camera.aspect=w/h;camera.updateProjectionMatrix()} v.update(dt,r); gl.render(v.scene,v.camera); anim ||= v.animated; } gl.setScissorTest(false); if(anim && !reduced) invalidate(); }, 1). three's setViewport/setScissor take CSS pixels and apply the pixel ratio internally (r187 release notes: 'Pixel ratio now applies to the canvas only in setViewport() and setScissor()'), exactly as drei passes rect values. Measure(v) = getBoundingClientRect once, intersected with clipping ancestors if any (walk ancestors with overflow !== 'visible'). Bring-up order: ship drei <View> first with a fixed canvas and frames omitted; swap to StageView when the scroll-trail is visible on real phones. Sticky/transform rules: getBoundingClientRect already includes position:sticky and CSS translate, so sticky pinned stages (rec 8) work with either implementation; rotated/scaled ancestors make the rectangle an axis-aligned bounding box, so keep view placeholders out of rotated/scaled parents; animate entrance on a child, not on the placeholder.

**Libraries:** @react-three/fiber@9.8.2, three@0.187.0, @react-three/drei@10.7.9 (prototype only)

**Licence:** MIT (drei View.tsx is MIT and can be adapted)

**Cost/risk:** About 150 lines of owned code. Overscan makes the canvas 150% of the viewport height; with the dpr and pixel cap in rec 4 that is still under 2 MP on desktop and under 1.5 MP on phones. Safari rubber-band overscroll makes scrollY negative, so clamp as above. If the overscan translate does not remove the trail on some Android builds, fall back to ScrollTrigger-free native behaviour with soft-edged scenes (scene fades to transparent at its rectangle edge so a 1-frame offset is invisible) rather than adding a smooth-scroll library.

**Sources:** https://github.com/pmndrs/drei/blob/master/src/web/View.tsx node_modules/@react-three/drei/web/View.js v10.7.9 (read locally) https://drei.docs.pmnd.rs/portals/view https://discourse.threejs.org/t/drei-view-content-trailing-behind-view-position-on-scroll/77856 https://discourse.threejs.org/t/using-view-from-drei-decreases-performance/67831 https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_multiple_elements.html https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html https://github.com/14islands/r3f-scroll-rig

## [must] 4. Interaction is DOM-first: real elements drive the scene through a store; do not depend on R3F pointer events inside views

**What:** Put pointer, keyboard and focus on real DOM elements (the placeholder, plus real <button>/<a> for each role, project, capability). They write into a tiny store (hoveredId, pointer in view-local 0..1, progress). The scene reads that store in useFrame. Use R3F raycast events only if a scene genuinely needs picking against 3D geometry.

**Why:** drei View routes events through compute(): it only maps pointer to the view when event.target === track.current (source of drei 10.7.9). That means any DOM text, link or button overlaying the placeholder breaks scene hover in that area, and the whole event layer is re-pointed to whichever View's track effect ran last (rootState.setEvents({connected: track.current})). The docs' advice is eventSource={container} on a parent holding both canvas and content, with the canvas pointer-events:none. r3f-scroll-rig recommends the same (eventSource on a parent, eventPrefix 'client', canvas pointerEvents none). That works for demo cubes but is fragile for a content-dense portfolio, and keyboard access cannot come from a canvas anyway. DOM-first also gives screen readers and keyboard users the complete content, and costs nothing in the scene.

**How:** store: const useStage=create(...) or a plain module with subscribe: {hover:{id:string|null}, pointer:Record<viewId,{x:number,y:number,inside:boolean}>, progress:Record<viewId,number>}. On each slot: onPointerMove -> compute x,y from the slot's cached rect (not event.target), write to store, call invalidate(). On each real control: onPointerEnter/onFocus -> hover.id = id; onPointerLeave/onBlur -> null. In useFrame damp towards targets with maath: import { damp, damp3 } from 'maath/easing'; damp(uniforms.uHover, 'value', hovered?1:0, 0.12, dt). Keep 'pointer-events:none' on the canvas and its host. If picking is ever needed: <Canvas eventSource={rootRef} eventPrefix='client'> and, because drei View sets connected to the track element, only enable it on one view at a time. All visual state in the scene is derived from content data (the same d3-scale functions that lay out the DOM labels) so DOM and WebGL cannot disagree. Add aria-hidden='true' on the placeholder and canvas host; the equivalent data is already in the DOM text, lists and tables.

**Libraries:** maath@0.10.8, @react-three/fiber@9.8.2

**Licence:** MIT

**Cost/risk:** Negligible bundle cost (maath/easing damp is tree-shakable; esbuild showed no measurable delta). Risk: two sources of truth if the store and DOM drift; mitigate by deriving every hovered/selected style from the store in both worlds.

**Sources:** node_modules/@react-three/drei/web/View.js v10.7.9 (compute, setEvents) https://drei.docs.pmnd.rs/portals/view https://github.com/14islands/r3f-scroll-rig https://discourse.threejs.org/t/pointer-in-useframe-hook-in-view-doesnt-work/61844

## [must] 5. Run-time discipline: demand frames, one scheduler, pixel-budgeted DPR, tiered quality, static frame for reduced motion

**What:** Run the Canvas with frameloop='demand'. Views that animate keep waking the loop themselves, only while visible. Everything else invalidates on events. Cap drawing-buffer pixels, not just DPR. Choose one of four tiers at mount and step down at runtime from your own frame timing.

**Why:** R3F default frameloop is 'always'; docs: demand mode renders only when invalidate() is called and 'invalidate() will not render immediately, it merely requests a new frame'. Off-screen views then cost nothing. Important pitfalls found in source: (a) drei PerformanceMonitor and AdaptiveDpr are driven by useFrame (PerformanceMonitor samples performance.now() per frame over ms=250 windows, bounds default [40,60] fps), so in demand mode the sample is meaningless (sparse frames look like low fps and trigger false declines). Use them only while a view is animating, or write 20 lines of your own EMA. (b) A background tab stops rAF, and when it returns the first delta is huge: clamp dt to 1/20. (c) R3F 9.8.2 follows devicePixelRatio changes (zoom, monitor move) when dpr is a range, so ranges still work. (d) Chrome and SwiftShader here ran about 51 to 61 fps at 1440x900 with one 300 px view, so software rendering is viable for tests but any full-viewport fragment shader will be slow; cap pixels. Reduced motion: render one fixed, deterministic frame, no scroll-linked camera motion, no looping.

**How:** Scheduler policy (module singleton): wake(): invalidate(). Callers: scroll (passive, rAF-coalesced), resize (ResizeObserver), pointer move on slots, theme change, texture/font load, view visible flips, context restored. Animated views: in their update, if(!reduced && visible) invalidate() so the loop sustains ~60 fps only while something moves. Pause: IntersectionObserver sets visible=false (no render, no update, no invalidate); document.visibilitychange hidden -> stop waking; matchMedia('(prefers-reduced-motion: reduce)') -> animated=false, render once with a STILL time (the repo's STILL_FRAME pattern) and re-render on pointer/hover only. Pixel budget: const MAX_PX = tier.maxPixels (desktop 2_400_000, mid 1_300_000, low 700_000); const dpr = Math.min(window.devicePixelRatio, tier.maxDpr, Math.sqrt(MAX_PX / (cssW*cssH))); apply with useThree(s=>s.setDpr)(dpr) (Canvas dpr={[1,1.5]} as the static default; setDpr overrides at runtime). Tiers: T0 (poster only): no WebGL2, navigator.connection.saveData, or the three-strike context-loss rule in rec 5. T1 (static): prefers-reduced-motion, or hardwareConcurrency<=4 and deviceMemory<=2 (Chrome-only field, treat undefined as unknown), or (pointer:coarse) with viewport width <=480 and dpr>=3: render still frames, hover/scroll-scrub updates only, maxDpr 1.25. T2 (mid, default for coarse pointers): maxDpr 1.5, no MSAA, at most 1 animated view, no postFX. T3 (desktop fine pointer): maxDpr 2, pixel cap 2.4 MP. Runtime step-down: measure your own frame interval EMA only on animated frames (dt from useFrame); if EMA > 24 ms for 1 s, drop one tier (setDpr lower first, then drop animation to scroll-scrub only), and never step back up in the session (prevents flip-flop). Do not use detect-gpu: it downloads its ~712 kB benchmark JSON from unpkg.com by default (blocked by this CSP) and would need self-hosting via benchmarksURL; heuristics plus runtime step-down are enough. In shaders: no loops over uniform-length arrays, 1 to 2 octaves of noise on T2.

**Libraries:** @react-three/fiber@9.8.2, @react-three/drei@10.7.9 (PerformanceMonitor/AdaptiveDpr only if you accept the demand-mode caveat)

**Licence:** MIT

**Cost/risk:** Tier detection is heuristic; deviceMemory is Chromium-only and navigator.connection is non-standard (typings need a cast, as the repo already does). The EMA step-down is simple but needs a test per tier. Demand mode requires discipline: forgetting to invalidate after a store write looks like a frozen scene. A unit test on the wake() callers is worth it.

**Sources:** https://r3f.docs.pmnd.rs/advanced/scaling-performance node_modules/@react-three/drei/core/PerformanceMonitor.js and AdaptiveDpr.js v10.7.9 node_modules/@react-three/fiber/dist/events-e51d7528.esm.js (frameloop never/advance, dpr follows display) https://github.com/pmndrs/react-three-fiber/releases node_modules/detect-gpu (benchmarksURL default https://unpkg.com/detect-gpu@5.0.70/dist/benchmarks)

## [must] 6. Failure ladder: WebGL2 probe, context loss/restore, poster/SVG fallback, disposal

**What:** Treat the canvas as progressive enhancement with an always-present static layer. Ladder: probe -> mount -> on loss show poster -> on restore re-render -> after repeated loss give up for the session. Every view placeholder has real fallback content in the static HTML: the existing CSS-gradient poster for the hero, and for data visuals an inline SVG or plain DOM version of the same data (the ruler, the experience timeline, the figures).

**Why:** R3F's <Canvas fallback> prop is only the inner content of the <canvas> element (for browsers without canvas), not a WebGL-failure handler, so you must detect failure yourself. three's WebGLRenderer already registers webglcontextlost (calls preventDefault, sets _isContextLost) and webglcontextrestored (re-runs initGLContext, so programs, buffers and textures are re-created lazily on the next render). Verified here with Chrome 157 + SwiftShader: WEBGL_lose_context.loseContext() produced 'THREE.WebGLRenderer: Context Lost.', isContextLost() true; restoreContext() produced 'Context Restored.' and isContextLost() false. In demand mode nothing re-renders after restore unless you invalidate. R3F 9.8.1/9.8.2 dispose R3F-created renderers on unmount and call forceContextLoss (source: disposeRenderer), so unmounting the Stage frees its context. MDN: handle webglcontextlost, 'consider eagerly losing contexts via WEBGL_lose_context when done', and do not add unload handlers for it. Another trap: the page also creates a probe context in VisualStage.webgl2Available(); keep that probe, but lose it immediately (it already does).

**How:** canUseWebGL2(): try { const c=document.createElement('canvas'); const gl=c.getContext('webgl2',{failIfMajorPerformanceCaveat:false}); if(!gl) return false; gl.getExtension('WEBGL_lose_context')?.loseContext(); return true } catch { return false }. Consider failIfMajorPerformanceCaveat:true in production to treat software-GL users as T0, but gate it behind a test flag so the SwiftShader suite still mounts. In onCreated: const el=state.gl.domElement; el.addEventListener('webglcontextlost',e=>{ e.preventDefault(); setStatus('lost'); losses++ }); el.addEventListener('webglcontextrestored',()=>{ setStatus('ready'); invalidate() }); if(losses>=3) unmount the Stage and keep posters. Poster layer: slot background is the poster until the first successful render of that view (set data-ready='true' on the slot after gl.render completes, then CSS opacity transition). prefers-reduced-motion and T0 keep posters/SVG and never mount the Stage; do not delete the DOM visuals. Dispose: R3F auto-disposes geometry/material/textures of unmounted JSX objects unless dispose={null}; objects you create imperatively (render targets, DataTexture, CanvasTexture, shared materials) need dispose() in effect cleanups. Textures loaded through useTexture are cached by suspend-react: call useTexture.clear(url) on unmount if a view is truly one-off. Regression guard: after unmounting a view, gl.info.memory.geometries/textures and gl.info.programs.length must return to the pre-mount baseline (assert in the SwiftShader test; my probe read geometries:2, textures:0, programs:1 with two View scenes).

**Libraries:** three@0.187.0, @react-three/fiber@9.8.2

**Licence:** MIT

**Cost/risk:** Low. Main risk is shared-resource lifetime bugs once materials are shared across views: pick one owner (the Stage) for shared materials, textures and palette uniforms, and never dispose them from a view.

**Sources:** node_modules/three/src/renderers/WebGLRenderer.js r187 (onContextLost/onContextRestore) node_modules/@react-three/fiber/dist/events-e51d7528.esm.js (disposeRenderer, forceContextLoss) https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices Local SwiftShader probe scratchpad probe/run.mjs (lose/restore results) https://r3f.docs.pmnd.rs/api/canvas

## [must] 7. Theme and colour management: one palette uniform set, flat rendering, sRGB-exact output

**What:** Keep one module-level palette object of THREE.Color instances wrapped as shared uniforms; every shader/material references those same uniform objects. When the theme changes, read the CSS custom properties once, update the colours in place, and invalidate. Render with tone mapping off and the sRGB output colour space so #7c9cff on screen is #7c9cff.

**Why:** R3F 9.8.2 defaults (source and docs): ColorManagement enabled (legacy:false), outputColorSpace SRGBColorSpace, toneMapping ACESFilmicToneMapping unless flat is set (then NoToneMapping). ACES visibly shifts accent and warm proof colours, which breaks the Calibrated design's exact tokens. v9 also removed automatic sRGB conversion of texture props: custom materials need texture.colorSpace set. new THREE.Color(str) / setStyle(str, colorSpace = SRGBColorSpace) parses hex, rgb(), hsl() and named colours only (no oklch(), color-mix(), space-separated rgb(124 156 255 / 0.12)), and converts to the linear working space when ColorManagement is on. ShaderMaterial does not convert output automatically: you must include the #include <colorspace_fragment> chunk (it applies linearToOutputTexel) or the colours come out dark. Existing repo already exposes palette.ts with readThemeSnapshot/subscribeToTheme; reuse that as the single source.

**How:** <Canvas flat> (or gl={{ toneMapping: THREE.NoToneMapping }}). Materials: new THREE.ShaderMaterial({ uniforms:{ uAccent:palette.accent, uProof:palette.proof, uLine:palette.line, uBg:palette.bg }, toneMapped:false, transparent:true }) and end every fragment shader with: gl_FragColor = vec4(col, a); #include <colorspace_fragment> (and multiply rgb by a if the canvas is premultiplied, which three assumes by default). Palette module: export const palette = { accent:{value:new THREE.Color()}, proof:{value:new THREE.Color()}, ... }; export function syncPalette(){ const cs=getComputedStyle(document.documentElement); for(const k of Object.keys(palette)) palette[k].value.setStyle(cs.getPropertyValue('--'+kebab(k)).trim()); invalidate(); }. Keep tokens that the scene reads as hex or rgb(a,b,c) in globals.css (do not switch those to oklch). Triggers: a MutationObserver on documentElement for attributes ['data-theme'] (the toggle) plus matchMedia('(prefers-color-scheme: light)').addEventListener('change') when no explicit theme is stored; call syncPalette() in both and once in onCreated. Because the palette values are shared uniform objects, no material is touched and no React re-render happens. Also set CSS color-scheme as the design already does. Test: with Playwright emulate colorScheme light/dark and assert the sampled pixel in an accent-only region equals the token within +-2 per channel (rec 10).

**Libraries:** three@0.187.0, @react-three/fiber@9.8.2

**Licence:** MIT

**Cost/risk:** None in bundle size. Risk: transparent ShaderMaterial blending on a premultiplied-alpha canvas creates dark fringes if rgb is not premultiplied; verify edges on both themes. With flat rendering you lose filmic highlight roll-off, which is intended.

**Sources:** node_modules/@react-three/fiber/dist/events-e51d7528.esm.js lines ~1737-1754 (legacy, outputColorSpace, flat) https://r3f.docs.pmnd.rs/api/canvas https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide node_modules/three/src/math/Color.js and renderers/shaders/ShaderChunk/colorspace_fragment.glsl.js (r187)

## [should] 8. Text and labels: DOM by default, no troika/drei Text on the CSP-strict path, numerals from a baked atlas

**What:** All readable text (headings, dates, figures, ruler numerals, labels) stays in the DOM, positioned from the same d3-scale mapping as the scene. If the WebGL ruler needs glyphs inside the scene, bake the ~14 glyphs it needs (0 to 9, ., -, +, k, %) from the self-hosted Geist Mono into a CanvasTexture atlas at runtime. Avoid troika-three-text and drei Text, drei Html and MSDF pipelines unless a later view truly needs paragraphs in WebGL.

**Why:** Which fetch from a CDN by default: troika-three-text (used by drei <Text>) loads its default font, Roboto, from the Google Fonts CDN, and its unicode fallback fonts and index from cdn.jsdelivr.net (unicode-font-resolver data), per the README and source (CONFIG.unicodeFontsURL null means 'defaults to CDN'; defaultFontURL null). It also builds a Worker from a blob URL (troika-worker-utils uses new Worker(URL.createObjectURL(new Blob(...)))), which needs worker-src blob:. The repo's firebase.json CSP currently says worker-src 'self' only, so the worker would be blocked unless you add blob: or set configureTextBuilder({ useWorker:false }) (README remedy). Cost: troika Text adds +40.9 kB gzip over fiber (measured with esbuild), plus SDF generation time. drei <Html> adds only 0.5 kB gzip and mounts into the connected element (events.connected, so it works with views), but projects with state.size (the canvas size, not the view's), so labels in a View on a scissored fixed canvas are mispositioned unless you pass calculatePosition; I did not test this (unverified). Accessibility: canvas text is invisible to assistive tech, cannot be selected, searched or translated, and breaks find-in-page; DOM labels are free to be accessible, are crisp at any DPR and keep hero text as LCP. drei's Environment presets and useEnvironment also fetch from raw.githack.com by default: never use presets.

**How:** Default: absolutely position DOM labels inside the slot: style={{ left: scale(t)+'px' }} from d3-scale, set in the same rAF as the scene via a data attribute/CSS variable (--p) so DOM and WebGL move together. If you really need troika: import { configureTextBuilder, preloadFont } from 'troika-three-text'; configureTextBuilder({ defaultFontURL:'/fonts/geist-mono-500.ttf', unicodeFontsURL:'/fonts/unicode/', useWorker:false }) before the first Text; pass font='/fonts/geist-mono-500.ttf' (README: .ttf/.otf/.woff, not .woff2; next/font emits woff2, so keep a separate .ttf in public/). Add a test that fails on any request outside 'self' (rec 10) so a stray CDN fetch is caught; I could not confirm that unicode-font-resolver stays offline when the main font covers every character, so the test is the proof. Baked atlas: await document.fonts.load('500 64px "Geist Mono"'); draw glyphs into a 2D canvas 1024x128 at devicePixelRatio 2, new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.NoColorSpace (it is coverage, not colour) and minFilter LinearMipmapLinear; in the shader sample alpha and tint with the palette uniform. Rebuild on document.fonts 'loadingdone'. Strategy for reference: drei <Html> only for one-off, non-critical callouts, with transform off and calculatePosition overridden to use the view rectangle.

**Libraries:** d3-scale@4.0.3 (existing), troika-three-text@0.53.1 (only if needed; drei 10.7.9 depends on ^0.52.4), three-msdf-text-utils@1.5.0 (alternative if MSDF is ever needed; peers three >=0.178, ISC)

**Licence:** troika-three-text MIT; three-msdf-text-utils ISC; Geist Mono OFL (already self-hosted)

**Cost/risk:** Baked atlas: about 0 kB library cost, one small texture, a font-load ordering dependency. troika: +41 kB gzip, worker/CSP work, CDN defaults to override. MSDF: needs offline atlas generation and 5 MB package (three-msdf-text-utils unpacked) but only 1 to 2 kB of runtime.

**Sources:** https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md node_modules/troika-three-text/dist/troika-three-text.esm.js and troika-worker-utils (read locally) https://github.com/pmndrs/drei/blob/master/src/web/Html.tsx node_modules/@react-three/drei/core/useEnvironment.js (CUBEMAP_ROOT raw.githack.com) firebase.json CSP in the repo

## [should] 9. Horizontal full-width timelines inside the stage: sticky pinned view, progress uniform, DOM labels in the same frame

**What:** Every timeline is a full-bleed (100vw, no max-width clamp) view whose scene draws the whole axis horizontally. For scroll-driven stages use position:sticky; top:0; height:100svh inside a tall section; the scene stays stationary in the viewport and only a progress value (0..1 from section scroll) changes. For non-scroll timelines (ruler, experience) the view is simply a 100vw slot.

**Why:** Owner rule: all timelines are horizontal and span the browser's full width. A pinned sticky stage means the view rectangle is constant while pinned, so the rect-tracking lag from rec 3 only exists during entry and exit, where a soft mask hides it. Position:sticky is the browser-native, compositor-driven option Mozilla recommends instead of scroll-handler repositioning, so no JS pinning library is needed. A full-width view also sets the canvas pixel budget: at 3840 css px wide the buffer is huge, so the pixel cap in rec 4 matters most here (a 1440x300 slot at dpr 2 is 1.7 MP; a 2560x400 slot at dpr 2 is 4.1 MP, so cap to about 2.4 MP and let the ruler's fine ticks be drawn analytically in the fragment shader, not as geometry).

**How:** Layout: <section class='h-[300svh]'><div class='sticky top-0 h-svh w-screen overflow-x-clip'><div data-stage-view='experience-timeline' class='absolute inset-0'/> ...DOM labels... </div></section>. Use w-screen/100vw only inside overflow-x:clip containers (overflow-x:hidden on a parent creates a scroll container and breaks sticky); prefer html{overflow-x:clip}. Progress: const p = clamp((scrollY - sectionTop)/(sectionHeight - innerHeight),0,1) read once per frame inside the stage frame callback (not a separate listener) and written to both a shader uniform (uProgress) and a CSS variable (--p) on the stage element so DOM labels translateX from the same value in the same frame. Timeline data: eight roles 2010-2026 -> x = d3.scaleTime().domain([2010-01, 2026-12]).range([0,1]); upload as a DataTexture (RGBA32F or RGBA8 with packed 0..1) or small uniform arrays (8 roles fit in a uniform array). Ticks: fragment shader computes fract(x*N) lines with fwidth() AA (needs derivatives, available by default in WebGL2/GLSL ES 3.00). Reduced motion: stage becomes a static, non-pinned full-width view (progress fixed at 1, no sticky height) and the DOM text list below carries the content. Narrow viewports: keep it horizontal (owner rule) but allow the axis to scroll with the page using a CSS translateX driven by --p within the pinned frame; never switch to a vertical timeline.

**Libraries:** d3-scale@4.0.3 (existing), three@0.187.0, @react-three/fiber@9.8.2

**Licence:** MIT / ISC (d3-scale)

**Cost/risk:** Pinned sections multiply scroll length (a 300svh section costs 200svh of scrolling), so keep one or two per page. Sticky inside any ancestor with overflow other than visible/clip silently stops pinning; add a test that asserts boundingClientRect.top stays 0 during mid-section scroll.

**Sources:** https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html https://github.com/pmndrs/drei/blob/master/src/web/View.tsx caniuse-lite: css-sticky 97.2%, viewport-unit-variants 96.1% https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_multiple_elements.html

## [should] 10. WebGPU: do not adopt it now; ship WebGL2 and keep the renderer swappable

**What:** Use WebGLRenderer (R3F's default) with GLSL ShaderMaterial for all visuals. Do not use three/webgpu, TSL, R3F v10 alpha or WebGPURenderer in production this year. Revisit in mid 2027 when Firefox on Linux/Android/Intel Mac and Chrome on Linux are covered and R3F 10 plus drei 11 are stable.

**Why:** Browser coverage today (caniuse-lite 1.0.30001823, data modified 2026-11-06): WebGL2 97.3% of global usage; WebGPU 86.8% full + 3.3% partial. web.dev (Nov 25, 2025): Chrome/Edge 113+ on Windows, macOS, ChromeOS; Android 121+ only on Android 12+ with Qualcomm/ARM GPUs; Linux still in progress; Firefox 141+ on Windows and 145+ on Apple-silicon macOS, with Linux, Android and Intel Macs still in progress; Safari 26 on macOS/iOS/iPadOS/visionOS. caniuse shows Firefox 159 to 162 as 'partial' and Safari as 'partial' (flag-free but with notes). Roughly 1 in 8 readers would be on the fallback path, and the fallback is the same WebGL2 renderer you would have shipped anyway. three's manual says WebGPURenderer falls back to a WebGL 2 backend, but the fallback is not feature-identical, and the bundle is heavier: a minimal three/webgpu + TSL scene bundled to 226 kB gzip versus 135 kB for the minimal WebGLRenderer scene (both measured, before fiber). R3F 9.8.2 does support it (gl={async props => { const r=new WebGPURenderer(props); await r.init(); return r }} and R3F awaits the promise), but drei's View and most drei helpers are scissor/WebGL-oriented, @react-three/postprocessing targets the WebGL postprocessing library, and R3F 10 is alpha with state.gl renamed. Visual quality needs for a calm ruler-and-data aesthetic (fullscreen shaders, instanced ticks, lines, SDF glyphs) are comfortably inside WebGL2. Also: Chrome 157 headless here exposes navigator.gpu, but SwiftShader WebGPU is not what CI will test and CI would test the fallback only.

**How:** Keep a thin Stage boundary so a later swap is local: Stage owns the renderer factory (gl prop), the palette uniforms and the view registry; visuals are written as GLSL strings in one folder (src/stage/shaders/*.glsl.ts), not scattered. Avoid WebGL-only escape hatches in view code (no raw gl.* calls outside Stage). Track: r3f v10 stable release + drei 11 stable + three's WebGPURenderer WebGL-fallback parity. If you want a safe experiment, add a ?renderer=webgpu query handled only in dev that swaps the gl factory; no production flag.

**Libraries:** three@0.187.0 (WebGLRenderer), @react-three/fiber@9.8.2

**Licence:** MIT

**Cost/risk:** Choosing WebGL: none. Choosing WebGPU now: +90 kB gzip over WebGL in the minimal case, a second code path to test, and an alpha R3F. Missing out costs nothing visible for this brief.

**Sources:** caniuse-lite 1.0.30001823 webgpu/webgl2 usage (computed locally) https://web.dev/blog/webgpu-supported-major-browsers https://github.com/pmndrs/react-three-fiber/releases (v10 alpha notes) https://github.com/pmndrs/react-three-fiber/blob/master/docs/API/canvas.mdx (async gl factory) https://github.com/mrdoob/three.js/releases (r185 to r187 WebGPURenderer notes) local esbuild: three/webgpu + three/tsl minimal scene 225,855 B gzip vs three-only 134,811 B gzip

## [should] 11. Testing under headless Chrome + SwiftShader: deterministic frames, pixel assertions, request and CSP guards

**What:** Expose a test hook from the Stage, force deterministic time with frameloop 'never' + advance(), assert non-blank pixels by readPixels in the same task (and with Playwright screenshots analysed by sharp), and add guards for external requests, console errors, memory baselines and the WebGL-off fallback path.

**Why:** Measured in this environment (Chrome 157.0.8103.50, Playwright 1.57.0, args --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist, the same flags as playwright.config.ts): WebGL 2.0 context created in about 300 to 540 ms; MAX_TEXTURE_SIZE 8192; EXT_color_buffer_float available; 29 to 30 extensions; navigator.gpu present; one 300 px View at 1440x900 ran at 51 to 61 rAF fps; context lost/restored events work. Without the flags Chrome still fell back to SwiftShader but logs 'Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag', so keep the flags. After a scroll, a screenshot analysed with sharp counted about 2,250 accent-coloured pixels from a rotating cube (counts differ by about 2% between runs because the cube rotates: motion must be frozen for exact counts). readPixels immediately after state.advance(performance.now()) in the same task returned 432,000 non-transparent pixels and 2,250 accent pixels; calling readPixels in a later task is unreliable without preserveDrawingBuffer (an earlier attempt that rendered the empty default scene read 0, a reminder that View scenes are portalled). Chrome did not blank toDataURL() in a later task in this build, but do not depend on that. SwiftShader fragment cost grows with pixels, so keep test viewports at 1440x900 and heavy views disabled via a ?still query.

**How:** Stage: if (process.env.NEXT_PUBLIC_E2E==='1' || location.search.includes('stage-test')) window.__stage = { state, advance:(t)=>state.advance(t,true), views:()=>[...registry.keys()].map(k=>k.dataset.stageView), info:()=>({geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,programs:gl.info.programs?.length,calls:gl.info.render.calls}), loseContext:()=>gl.getContext().getExtension('WEBGL_lose_context').loseContext() }. Use frameloop='never' when ?still is present and drive time with advance(1000*n). Tests: (1) page.goto, scrollIntoViewIfNeeded on a slot, await page.waitForFunction(()=>document.querySelector('[data-stage-view=hero][data-ready=true]')); (2) const r = await page.evaluate(()=>{window.__stage.advance(2000); const gl=window.__stage.gl.getContext(); ... readPixels(0,0,w,h) ...}) and expect nonTransparent > 1% of the slot's area and accent count > N; or screenshot the slot's clip and compare sharp stats. Prefer 'differs from the poster' and 'contains token colour within +-2' over golden-image diffs (SwiftShader differs from real GPUs). (3) Request guard: page.on('request', r=>{ if(new URL(r.url()).origin !== baseOrigin && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) fail }) and fail on any console error except the known THREE.Clock deprecation warning; this catches troika/drei/detect-gpu CDN fetches. (4) Fallback: page.addInitScript(()=>{ const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ return /webgl/.test(t)? null : g.call(this,t,...a) } }) then assert posters and DOM content are visible and axe passes. (5) Reduced motion: use test.use({ reducedMotion:'reduce' }) and assert no more than one render (info().calls unchanged over 1 s). (6) Memory: mount, scroll through every view, scroll back; expect info().geometries and programs within baseline + a small constant. (7) Context loss: call __stage.loseContext(), expect posters visible, then restore and expect data-ready again. Because Playwright's SwiftShader pass is slow, run the Stage suite with workers=1. CSP note for the existing harness: tests/support.ts injects the policy read from firebase.json, which today has script-src 'self' 'unsafe-inline' 'unsafe-eval' and worker-src 'self'. three/fiber/drei View need no eval (my Next probe and the SwiftShader pages ran fine under their own bundles), so remove 'unsafe-eval' if the brief says none, and only add blob: to worker-src if troika is adopted.

**Libraries:** @playwright/test@1.57.0 (existing), sharp@0.35.4 (existing)

**Licence:** Apache-2.0 (Playwright), Apache-2.0 (sharp)

**Cost/risk:** Test-only hooks add under 1 kB and must be compiled out of production (env flag). SwiftShader numbers will not predict phone GPU performance: treat fps there as a smoke test, and test real devices manually before shipping.

**Sources:** Local runs: scratchpad probe/run.mjs, run2.mjs, run3.mjs (Chrome 157, Playwright 1.57.0, SwiftShader) /home/aetheragent/work/forgotten-mistory/playwright.config.ts and tests/support.ts https://r3f.docs.pmnd.rs/api/canvas (frameloop never, advance) node_modules/@react-three/fiber/dist/events-e51d7528.esm.js (advance/frameloop never)

## [could] 12. Post-processing: avoid EffectComposer with a multi-view canvas; do the look inside the shaders

**What:** Do not add @react-three/postprocessing's EffectComposer to the shared view canvas. Achieve glow, grain, vignette and chromatic touches in each view's own fragment shader (a few lines), and share GLSL snippets between views. If a single view later truly needs bloom or SSAO, render that view into its own render target with vanilla postprocessing and blit it into the view rectangle.

**Why:** EffectComposer replaces the render step for the root scene, while View renders portalled scenes by scissor inside its own useFrame; discourse reports (72359 and 72321 'EffectComposer doesn't work with View', 70176) describe bloom simply not applying inside Views, with advice that you must use the vanilla library, render off-screen and likely fork. Bundle cost is real: EffectComposer + Bloom through the R3F wrapper added +22.8 kB gzip over fiber (also pulls n8ao), vanilla postprocessing (EffectComposer, RenderPass, EffectPass, BloomEffect) +11.6 kB gzip. Full-screen passes at the budgeted pixel count also multiply fill cost on phones. The Calibrated art direction (hairlines, ticks, soft accent glow, noise) is fully shader-expressible, and the page already specifies a faint 4% noise texture in CSS.

**How:** Create src/stage/shaders/common.glsl.ts exporting snippets: sdLine(), tickMask(x,spacing,width) using fwidth AA, hash21 noise grain (<= 0.04 alpha), softGlow(d,radius). Compose with template literals into each ShaderMaterial. If ever needed: import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing'; one composer per view with composer.setSize(w,h) matching the view rectangle (a thread notes sizing each composer to its view avoids full-size renders per view), render to its WebGLRenderTarget(w,h,{ samples:0 }) and draw its texture on a fullscreen quad scissored to the rectangle. Cap such a view to T3 only and skip it in reduced motion.

**Libraries:** postprocessing@6.39.6 (only if needed, peers three >=0.168 <0.188), @react-three/postprocessing@3.2.2 (avoid)

**Licence:** postprocessing Zlib; @react-three/postprocessing MIT

**Cost/risk:** Avoiding it costs nothing. Using the vanilla per-view composer costs +11.6 kB gzip, extra render targets (memory) and a maintenance burden on every three upgrade (peer cap < 0.188).

**Sources:** https://discourse.threejs.org/t/effectcomposer-doesnt-work-with-view-in-react-three-fiber/72359 https://discourse.threejs.org/t/trying-to-use-effectcomposer-with-views-in-react-three-fiber/72321 https://discourse.threejs.org/t/problem-of-continuity-in-the-rendering-in-multiple-views-viewport-scissor-with-the-composer/70176 npm view postprocessing/@react-three/postprocessing peerDependencies local esbuild deltas over fiber baseline

## Reference sites and repositories

- https://github.com/pmndrs/drei/blob/master/src/web/View.tsx — Read the real source (also at node_modules/@react-three/drei/web/View.js v10.7.9): prepareSkissor/finishSkissor order (autoClear off, setViewport + setScissor + setScissorTest), offscreen test against canvas size, clear-once when a view hides, the compute() pointer remap that only fires when event.target === track.current, and the per-frame getBoundingClientRect with the frames escape hatch. Copy the scissor maths into your own registry; change the measuring strategy.
- https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_multiple_elements.html — The official multi-view pattern: canvas position:absolute behind content (z-index 1 on content), canvas.style.transform = translateY(scrollY) each frame so painted content stays attached to the document during async scrolling, offscreen skip, bottom = canvas.clientHeight - rect.bottom flip. Note its pixel-ratio resize check bug (compares device and CSS pixels) and fix it in your port.
- https://github.com/14islands/r3f-scroll-rig — A production-minded shared-canvas rig: GlobalCanvas outside the router, UseCanvas tunnelling, one getBoundingClientRect on mount then IntersectionObserver + ResizeObserver (also catching body-height changes from webfont loads, so call a reflow() when fonts load), frameloop demand with requestRender, globalRender priority 1000, scaleMultiplier. Take the observer-based tracking and font-load reflow idea; skip its Lenis dependency (it recommends a smooth-scroll layer, which would add a main-thread scroll and accessibility surface).
- https://github.com/pmndrs/react-three-next/blob/main/src/components/canvas/Scene.jsx — The canonical Next + R3F shape: a persistent Canvas outside route components using a tunnel-rat portal (r3f.Out), Preload all, AgX tone mapping set in onCreated. Take the persistence idea; replace the tone mapping with flat/NoToneMapping for exact token colours.
- https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md — Exact option names for self-hosting: configureTextBuilder({ defaultFontURL, unicodeFontsURL, useWorker }), preloadFont({ font, characters, sdfGlyphSize }), sdfGlyphSize default 64, fonts must be .ttf/.otf/.woff, Roboto default and jsDelivr unicode data by default, worker blocked by strict CSP -> useWorker:false.
- https://github.com/darkroomengineering/lenis — Only as a cautionary reference: respectReducedMotion default true, syncTouch default false (iOS < 16 unstable), position:fixed may lag on pre-M1 Safari, anchors option default false. If smooth scrolling is ever added for lockstep with WebGL, these are the constraints; the recommended route here avoids it.
- https://github.com/darkroomengineering/satus — A current (Next 16, React 19) studio starter that keeps WebGL opt-in under lib/webgl behind feature flags and pairs R3F with Lenis and Tempus (shared rAF). Take the feature-flag idea and single-RAF scheduling concept; I could not confirm its canvas file layout from the README, so read lib/webgl before copying anything.

## Avoid

- A canvas per section: context caps (Chromium 16, often fewer on phones), duplicated GPU memory and shader compiles, and no single place to enforce pixel budgets.
- drei <View> with the default frames (Infinity) for every section and all views kept mounted: it calls getBoundingClientRect for every mounted view in every frame even when offscreen. Do not use frames={1} on views that move with scroll: it freezes them.
- A position:fixed canvas with a main-thread scroll read as the only sync mechanism: documented to trail on fast scrolls. Use the page-attached overscanned canvas or pinned sticky stages.
- Smooth-scroll libraries (Lenis, GSAP normalizeScroll) added only to hide scene lag: they add main-thread scroll, accessibility and reduced-motion surfaces and are unnecessary with pinned/overscan design.
- Putting the canvas, or any ancestor of the fixed canvas, inside an element with transform, filter, will-change or contain: it changes the containing block and breaks position:fixed.
- drei <Text>/troika, <Html>-for-labels, Environment presets, useGLTF with draco/meshopt decoders from CDN, detect-gpu with default benchmarks, and any default that fetches from jsDelivr, unpkg, gstatic or raw.githack: all violate the self-hosting CSP unless configured.
- @react-three/postprocessing EffectComposer on the shared view canvas (does not compose with View scissor rendering).
- drei PerformanceMonitor/AdaptiveDpr under frameloop='demand' (frame sparsity makes the fps samples meaningless).
- ACESFilmic (R3F default) or AgX tone mapping for UI-accurate token colours, and ShaderMaterial output without #include <colorspace_fragment>.
- WebGPURenderer/TSL/R3F 10 alpha/drei 11 alpha in production now; caret-ranged three upgrades (postprocessing caps three < 0.188).
- @react-three/offscreen (0.0.8, worker-owned canvas): incompatible with DOM-tracked Views and adds a worker plus CSP surface for no benefit here.
- Relying on R3F pointer events through overlaid DOM text inside views: event.target must be the tracked element for drei's compute().
- Treating firebase.json's current 'unsafe-eval' as needed: the three/fiber/drei stack does not require eval; remove it.

## Unverified

- Whether the overscanned, page-attached canvas (translate3d by scrollY, overflow:clip host) actually eliminates the scene-versus-placeholder trail on real phones and desktop Chrome/Safari. The mechanism follows from the three.js official example and Mozilla's compositor/main-thread description, but headless Chrome cannot measure compositor lag. Needs a manual test on a mid-range Android and an iPhone, with a screen recording, and a check that the host's overflow:clip really prevents scrollHeight feedback and handles iOS rubber-banding.
- Next.js build with Turbopack (next build --turbopack): my attempt failed only because the scratch project's node_modules was symlinked ('Next.js package not found'), which says nothing about Turbopack with R3F. The webpack production build and static export were verified; dev server behaviour with Turbopack was not tested.
- Exact drei View frames semantics: derived from reading View.js (frameCount is a local let reset on every Container render), not from running a scroll test; a maintainer comment says frames={1} re-measures on browser size changes. Verify before relying on either description.
- drei <Html> inside a View on a fixed canvas: it mounts to events.connected and projects with state.size (canvas size), so I expect mispositioning, but I did not run it; discourse threads found were adjacent (ScrollControls, iOS), not exact.
- Whether troika's unicode-font-resolver contacts jsDelivr when the supplied font covers every glyph: the README/source say unicodeFontsURL defaults to a CDN but I did not run a network-captured test. The request guard in rec 10 is the verification.
- Mobile WebGL context limits and iOS Safari canvas memory ceilings: only community figures from 2020 (Chrome 81 on Pixel 2 XL reported 8; Safari 13.1 and iPhone 11 reported 16); no current official numbers found.
- Firefox, Linux and Android WebGPU availability as of today: web.dev (Nov 2025) and caniuse-lite (Nov 2026 data) agree it is partial, but I did not check browser release notes after November 2025 for newly shipped platforms.
- How the 'award-winning studio' sites (Lusion, Active Theory, Igloo and similar) build their canvas layers: their sources are not public. The patterns above come from public repos (drei View, r3f-scroll-rig, react-three-next, three.js examples, Satus README) only.
- toDataURL/readPixels determinism across Chrome versions and GPU/ANGLE backends: observed on Chrome 157 with SwiftShader only; CI's bundled Chromium may differ, so assert coarse properties (non-transparent coverage, token colour within tolerance), not exact bytes.
- The three release dates in the GitHub releases page (r186 listed as 24 Sep, r187 as 30 Oct) differ from npm's publish time for 0.186.0 (2026-09-08); I used npm for dates. Release-note content about WebGPURenderer is from a truncated page (r184 notes incomplete).
- The effect of three r187's setViewport/setScissor pixel-ratio change on the custom registry: I rely on the release note and on drei passing CSS-pixel rects; confirm with a 2x DPR screenshot in the pixel test.

# timelines

_Horizontal, full-bleed, to-scale timelines (hero career scale + Experience) as premium interactive pieces: scroll-linked sticky stage, d3 axis, three.js lit layer pixel-locked to DOM, accessibility, phone strategy. Research date 2026-11-10; versions verified with npm view, support data from caniuse JSON (GitHub Fyrd/caniuse), web.dev, MDN, WebKit, W3C._

## [must] 1. 1. One sticky stage, native vertical scroll as the single source of truth, 1:1 horizontal travel (desktop and tablet)

**What:** Build the Experience timeline as a tall section containing a position:sticky stage (100svh) whose inner track is wider than or equal to the viewport. Vertical scroll position is the only state; the playhead time, the track's translateX and the selected role are all pure functions of scroll progress p in [0,1]. Clicking or keyboard-selecting a role calls window.scrollTo to that role's offset, so selection and scroll can never disagree. No wheel interception anywhere.

**Why:** Evidence: (a) the scroll-driven-animations.style horizontal-section demo (source read) uses exactly this shape: section 500vh + sticky 100vh wrapper + animated strip. (b) Giant Magellan Telescope timeline (giantmagellan.org/timeline, bundle read) pins and scrubs with ScrollTrigger and sets end:'+=' + (wrapWidth - innerWidth), i.e. one scrolled pixel = one track pixel, which feels like dragging the track. (c) The Pudding recommends CSS sticky over scroll listeners for stuck graphics. A sticky stage means nothing on screen is moved by the compositor scroll itself, so a JS-computed transform written once per frame cannot visibly drift against anything (this matters for recommendation 5). Native scroll keeps keyboard, scrollbar, find-in-page, touch inertia and browser back/forward behaving.

**How:** Geometry as percentages and CSS variables so server HTML is size-independent (the existing careerScale.ts already does percentages):
```css
.xp{position:relative;height:calc(100svh + var(--scroll-len,480svh))}
.xp__stage{position:sticky;top:0;height:100svh;overflow:clip;} /* clip, not hidden: hidden makes a scroll container and can break sticky; verified on MDN overflow page */
.xp__track{width:calc(var(--years)*var(--ppy));transform:translate3d(var(--tx,0px),0,0)}
```
Use 100svh not 100dvh: MDN states dynamic units are not stable and cause resize during scroll; small units are stable. Never use width:100vw for full-bleed (vw includes the classic scrollbar per CSS Values 4, giving horizontal overflow on Windows); restructure so the section element is a full-width block and only the text children sit in the 72rem container.
Mapping (JS, one function): `const N=roles.length; const clock=scaleLinear().domain(range(N+1).map(i=>i/N)).range([...roles.map(r=>r.span.start),NOW]); /* oldest first */ const tPlay=clock(p); const xPlay=x(tPlay); const tx=-clamp(xPlay-anchor*vw,0,trackW-vw);` with anchor 0.35. When trackW<=vw, tx is 0 and the playhead simply travels the full width, so one formula covers 1920 (fits at ~113 px/yr), 1440 (~85 px/yr fits) and 834 (track wider, pans). ppy = max(72, vw/17) (axis is 2010..2027 = 17 years in careerScale.ts). Equal dwell per role (about 55-60svh each, 8 roles) rather than time-proportional dwell, otherwise the 0.5-year ATO role gets no scroll. The 1-month gap before NAB is absorbed because the clock range uses role starts.
Scroll length = N*dwell. Select role = floor(p*N). Click handler: `scrollTo({top: sectionTop + (i+0.5)/N*(sectionH-vh), behavior: reduced?'auto':'smooth'})`. Add `html{scroll-padding-top:var(--header-h)}` so focused items are not hidden by the sticky header (WCAG 2.2 SC 2.4.11, technique C43).
Cache sectionTop/sectionH/trackW in a ResizeObserver (also on document.fonts.ready), never read layout inside the scroll handler.

**Libraries:** motion@14.12.0, d3-scale@4.0.3

**Licence:** MIT (motion), ISC (d3-scale)

**Cost/risk:** No new dependency. Risk: the section adds about 5 viewport heights of page; keep dwell modest and offer an in-section 'skip timeline' link. iOS Safari address-bar resize is handled by svh. Unverified: behaviour of sticky when an ancestor has container-type:inline-size (layout containment); avoid it on the sticky's ancestors and measure width in JS instead.

**Sources:** https://scroll-driven-animations.style/demos/horizontal-section/css/ https://giantmagellan.org/timeline/ https://pudding.cool/process/scrollytelling-sticky/ https://developer.mozilla.org/en-US/docs/Web/CSS/overflow https://developer.mozilla.org/en-US/docs/Web/CSS/length https://drafts.csswg.org/css-values-4/ https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

## [must] 2. 2. Driver choice: CSS scroll-driven animations for DOM-only polish, motion useScroll (one rAF) for anything the canvas must match

**What:** Use two layers on purpose. (A) When the WebGL layer is present, read progress once per frame with motion's useScroll({target, offset:['start start','end end']}) plus useMotionValueEvent, and write the track transform, CSS variables and shader uniforms together in that same callback. (B) For the DOM-only path and for non-registered polish (ruler draw-in, tick fade, role-card entrances), use native animation-timeline: view() / scroll() under @supports and prefers-reduced-motion: no-preference. Never animate the same property with both.

**Why:** Support is now broad: Chrome shipped it in 115 (the bramus demo banner says Chrome 115+), Safari 26.0 shipped scroll-driven animations (WebKit Safari 26.0 post; 26.5 fixed range-name and play-state bugs), and Firefox 159 enabled it by default on 2026-10-27 (MDN Firefox 159 notes, web.dev October 2026 roundup, bug 1324602). MDN now shows the Baseline 2026 Newly available banner on animation-timeline. CSS timelines run off the main thread and cost zero JS, so they are right for pure-DOM effects. But CSS cannot write a WebGL uniform. Reading the same scroll in JS while the DOM moves via a CSS timeline gives a one-frame skew between canvas and labels during fast scroll; one JS writer removes that. motion's useScroll exposes scrollYProgress and uses native ScrollTimeline for GPU-able properties (opacity, transform, clipPath, filter) where it can; motion 14.12.0 also exports supportsScrollTimeline and supportsViewTimeline helpers (confirmed in motion-dom typings).

**How:** ```tsx
const ref = useRef<HTMLElement>(null);
const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
useMotionValueEvent(scrollYProgress, 'change', (p) => stage.setProgress(p)); // stage writes DOM var + uniforms + invalidate() in one place
```
CSS-only fallback pattern, from the bramus demo, with fixes: `#xp{view-timeline-name:--xp;view-timeline-axis:block}` `.track{animation:xp-move linear both;animation-timeline:--xp;animation-range:contain 0% contain 100%}` with `@keyframes xp-move{to{transform:translateX(calc(-1 * (var(--track-w) - 100cqw)))}}`. Put animation-timeline AFTER the animation shorthand (the shorthand resets it; Chrome's scrollytelling guidance says the same). Gate with `@supports (animation-timeline: view())`, and put the reduced-motion override in `@media (prefers-reduced-motion: reduce){.track{animation:none;transform:none}}` as Chrome's guide does. Do not use the scroll-timeline polyfill: Chrome's guidance calls it not feature complete. Keep content visible by default and add enhancement classes only inside @supports, never hide content behind JS-added classes (matches DESIGN.md).

**Libraries:** motion@14.12.0

**Licence:** MIT

**Cost/risk:** Already installed. Main-thread JS writer costs about one style write and one uniform set per frame: negligible. Risk: useScroll measures layout position and ignores transforms on the target or ancestors (documented), so keep the target (the tall section) untransformed. Unverified here: whether Safari/Firefox expose the JS ScrollTimeline constructor; do not depend on it.

**Sources:** https://web.dev/blog/web-platform-10-2026 https://developer.mozilla.org/en-US/Firefox/Releases/159 https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline https://motion.dev/docs/react-use-scroll https://motion.dev/docs/scroll https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scrollytelling https://scroll-driven-animations.style/demos/horizontal-section/css/

## [must] 3. 3. To-scale axis with d3 scaleUtc, calendar-aware ticks, greedy label lanes and an honest 'now' edge

**What:** Make a single axis module (extend careerScale.ts) that exports: a scaleUtc over [2010-01-01, 2027-01-01] with range [0, trackWidth]; year ticks and month ticks from d3-time intervals; a label-placement function; and a now marker. Both the hero strip and the Experience track call it, so they can never disagree.

**Why:** scaleUtc is documented as the preferred variant (no browser time-zone dependence), gives ticks(interval), tickFormat and invert(px) -> Date. invert powers a live 'Mar 2026' readout under the playhead and drag scrubbing. Data in content/experience.ts is month-precision decimal years via ym(); converting to first-of-month UTC dates loses at most about 0.3 day, which at 85-120 px/year is under 0.1 px. Collisions are real: at 1440 px (85 px/yr) ATO is about 49 px, Independent about 57 px; at 390 px (23 px/yr) ATO is about 13 px. Greedy assignment by start time is optimal for interval graph colouring, so 8 labels need no simulated annealing or label-placement library. vis-timeline (8.5.6) solves the same problem with stack and subgroups, and offers cluster for density: the stack idea is the one to copy for roles that overlap in the future.

**How:** ```ts
import { scaleUtc } from 'd3-scale'; import { utcYear, utcMonth } from 'd3-time';
const x = scaleUtc().domain([Date.UTC(2010,0,1), Date.UTC(2027,0,1)]).range([0, trackW]);
const yearTicks = x.ticks(utcYear.every(ppy < 40 ? 4 : ppy < 70 ? 2 : 1)); // decimate by density
const monthTicks = ppy >= 70 ? x.ticks(utcMonth.every(1)) : []; // the instanced minor ticks
const fmt = x.tickFormat(); // or d3-time-format utcFormat('%Y')
function assignLanes(items, gap = 8) { const ends = []; return [...items].sort((a,b)=>a.x0-b.x0).map(it => { let lane = ends.findIndex(e => e + gap <= it.x0); if (lane < 0) lane = ends.length; ends[lane] = it.x0 + Math.max(it.barW, it.labelW); return { ...it, lane }; }); }
```
Lane 0 is inside the bar; lane >= 1 sits above or below the axis with a 1 px leader line from the bar. Use the employer abbreviation already extracted by employerLabel() ('ATO', 'ANZ', 'NAB', 'Independent') and keep labels in Geist Mono so label width is deterministic (chars x advance) and lanes can be computed at build time with no measurement and no layout shift; verify the advance width from the font file rather than assuming 0.6em. For overlapping roles, add a lane index to the data model and stack bars (vis-timeline `stack`), never shrink bars.
Now marker: keep NOW from content as the SSR axis edge (static export cannot read a clock). The open-ended current role ends in a gradient fade or dashed tail rather than a hard end (it is still running). After mount, if Date.now() is later than NOW (today is Nov 2026, NOW is Sep 2026), draw a 'Today' tick in an effect so there is no hydration mismatch; or just bump NOW when the CV changes.
Education and credentials: content/about.ts holds no dates for them, so they cannot be plotted to scale without inventing data. Render them as undated chips in a row below the axis, labelled as such, not as points on it.

**Libraries:** d3-scale@4.0.3, d3-time@3.1.1, @types/d3-time@3.0.4

**Licence:** ISC

**Cost/risk:** d3-time is about 2-3 kB gzip and already a transitive dependency of d3-scale (confirm in lockfile; adding it explicitly pins the import). Risk is low. Unverified: exact Geist Mono advance width.

**Sources:** https://d3js.org/d3-scale/time https://visjs.github.io/vis-timeline/docs/timeline/ https://www.npmjs.com/package/d3-time

## [must] 4. 4. Phone (390 px): overview + detail, not a pinned stage

**What:** Per breakpoint: >=1024 px pinned sticky stage with playhead (rec 1), 600-1023 px same stage with a track wider than the viewport (about 72 px/yr, anchor 0.35, pans), <600 px an overview-plus-detail layout. The phone layout is a full-bleed 17-year overview strip (about 23 px/yr, bars unlabelled, ticks every 4 years, a 'lens' showing the current role) sticky under the header, over a full-bleed horizontal scroll-snap carousel of role cards (about 86vw each, next card peeking). Swiping the carousel moves the lens; tapping the strip or a prev/next control scrolls the carousel.

**Why:** Sixteen years cannot be legible at 358 px: ATO would be about 13 px wide. The overview+detail pattern (spatial separation of an overview and a detail view) is the one that Cockburn, Karlson and Bederson's ACM Computing Surveys review (41:1) identifies as the standard answer when one view cannot show both context and detail; the alternatives (zooming, focus+context lenses) cost more interaction and are worse for touch. A pinned stage on a phone costs five viewport heights of scroll that moves a tiny graphic, fights the address bar, and the owner's rule (timeline horizontal and full width) is still met by the strip and the carousel both being horizontal and edge to edge. Native scroll-snap gives momentum and snapping for free: caniuse shows scroll snap at 97.35% and iOS Safari since 11, overscroll-behavior at 97% with Safari/iOS 16.

**How:** ```css
.rolecar{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;gap:12px;padding-inline:16px;scroll-padding-inline:16px}
.rolecar>article{flex:0 0 86%;scroll-snap-align:start;scroll-snap-stop:normal}
```
Make the carousel a focusable region (tabindex=0, role=region, aria-label) so keyboard users can scroll it with arrows, and give each card real content (all eight cards are in the DOM, so nothing is hidden from search or screen readers). touch-action: leave default (pan-x pan-y) on the carousel so vertical page scroll still works; native horizontal scroll captures only the x axis. Lens position: IntersectionObserver on cards (threshold 0.6) or animation-timeline: scroll(x nearest) on the strip's lens under @supports. The strip is a progress indicator; the controls are the prev/next buttons and the cards themselves (44 px targets). Choose the layout by matchMedia('(max-width: 599px)') in a useSyncExternalStore hook (the pattern VisualStage.tsx already uses); do NOT read innerWidth once at load: the GMT bundle computes `window.innerWidth<768` once at init, so resizing or rotating across the breakpoint needs a reload.

**Libraries:** 

**Licence:** n/a (platform features)

**Cost/risk:** Zero JS dependencies. Risk: tall role cards inside a short carousel; cap card bullets at the viewport height with internal scroll disabled (let the card grow, the carousel aligns to top). Mandatory snap with very tall cards can fight vertical scroll on some Android builds; if seen, use proximity.

**Sources:** https://www.microsoft.com/en-us/research/wp-content/uploads/2008/01/cockburn-ComputingSurveys09.pdf https://github.com/Fyrd/caniuse/blob/main/features-json/css-snappoints.json https://github.com/Fyrd/caniuse/blob/main/features-json/css-overscroll-behavior.json https://giantmagellan.org/timeline/

## [should] 5. 5. three.js lit layer: instanced ticks, shader-drawn role bands, playhead light sweep, pixel-aligned to DOM

**What:** A vanilla three.js (imperative, not R3F) canvas, absolutely positioned inside the sticky stage behind the DOM labels, aria-hidden, drawing: (1) minor and major ticks as one InstancedMesh of quads, (2) role bars as one 8-instance InstancedMesh with an SDF rounded-rect fragment shader, edge bevel, grain and a per-bar tone (accent for the current role, warm proof colour for roles that carry a headline figure), (3) a Gaussian light sweep around the playhead, (4) 2 or 3 parallax depth layers (dust, soft light shafts) that react to pointer on fine pointers only. Text stays in DOM. The canvas has a CSS-gradient poster first and mounts through the existing VisualStage.

**Why:** Keeps semantics, selection and focus in DOM while WebGL supplies depth and light that SVG cannot do cheaply. Measured on this machine: a minimal tree-shaken build (WebGLRenderer, OrthographicCamera, Scene, InstancedMesh, PlaneGeometry, ShaderMaterial, InstancedBufferAttribute) with esbuild is 525 kB minified, 134 kB gzip, 111 kB brotli. That is over the 500 kB single-asset budget in DESIGN.md if it is read as raw bytes (it is under it as transferred bytes), so it must be a lazy chunk behind VisualStage and the budget wording should be clarified. WebGL2 has 97.29% support (caniuse), WebGPU still has no stable Firefox/desktop-Safari row, so stay on WebGLRenderer. R3F 9.8.2 (peer react >=19 <19.4) would work but adds a reconciler and a second render model for what is a single imperative scene; skip it. troika-three-text defaults to Roboto from the Google Fonts CDN and unicode fallback fonts from jsDelivr, both forbidden by the CSP, so keep numerals in the DOM (the correct accessible choice anyway).

**How:** Renderer: `new WebGLRenderer({canvas, antialias:false, alpha:true, powerPreference:'default', failIfMajorPerformanceCaveat:true})`; parameters confirmed in three r187 source. Cap DPR: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` (1.5 on coarse pointers). Size the canvas to the stage band, not the page: `new ResizeObserver(([e])=>{const {width:w,height:h}=e.contentRect; renderer.setSize(w,h,false); uRes.value.set(w,h); invalidate();}).observe(stage)`. Set CSS size via layout, pass updateStyle=false.
Bypass the camera for the registered 2D layer: draw instances in CSS pixels from the vertex shader, so alignment is exact by construction:
```glsl
uniform vec2 uRes; uniform float uTx, uDpr; attribute vec4 aRect; /* x0,y0,x1,y1 in track CSS px */ varying vec2 vUv, vPx;
void main(){ vUv = position.xy + .5; vec2 p = mix(aRect.xy, aRect.zw, vUv); p.x -= uTx; p = floor(p*uDpr+.5)/uDpr; vPx = p;
 gl_Position = vec4(p.x/uRes.x*2.-1., 1.-p.y/uRes.y*2., 0., 1.); }
```
Fragment: `float d = sdRoundBox((vUv-.5)*size, size*.5, 3.); float a = 1.-smoothstep(-.5,.5,d); float sweep = exp(-pow((vPx.x-uPlayX)/uW,2.)); col += uAccent*sweep*.35;` with the playhead x damped slightly for the glow only.
Use a perspective camera only for the decorative depth layers, set so the z=0 plane is 1 unit per CSS pixel: `camera.position.z = D; camera.fov = 2*Math.atan(h/2/D)*180/Math.PI; camera.aspect=w/h; camera.updateProjectionMatrix();` (this is how r3f-scroll-rig matches DOM and WebGL). Keep ticks and bars on z=0. Pointer parallax = offset each layer by pointer * depthFactor, disabled when (pointer: coarse) or reduced motion.
Colours: read CSS tokens with getComputedStyle once and on theme change (no raw hex outside globals.css). Render on demand: `needsRender` set by scroll, pointer, resize, theme, playhead animation; `renderer.setAnimationLoop` only while something moves, null when idle. Pause via IntersectionObserver and visibilitychange. Handle `webglcontextlost` (preventDefault, fall back to poster) and `webglcontextrestored`. dispose geometries, materials and the renderer on unmount. Setting failIfMajorPerformanceCaveat:true makes software-GL users (and headless SwiftShader tests) fall back to the DOM version; add a `?webgl=force` test flag so Playwright still exercises the shaders (unverified how SwiftShader reports caveat here; test it).

**Libraries:** three@0.187.0, @types/three@0.187.0

**Licence:** MIT

**Cost/risk:** 134 kB gzip / 111 kB brotli lazy chunk, loaded only after the stage is near the viewport; no CSP issue (no eval; shaders compile in the GL driver); software-GL fallback required. Risk: GLSL on very old mobile GPUs (use highp only for position math, mediump elsewhere) and context limits (see rec 10). three 0.187.0 was published 2026-10-30 and moves fast; pin exactly as the repo already does.

**Sources:** https://threejs.org/docs/ https://github.com/mrdoob/three.js https://github.com/pmndrs/drei/blob/master/src/web/View.tsx https://github.com/14islands/r3f-scroll-rig https://github.com/Fyrd/caniuse/blob/main/features-json/webgl2.json https://github.com/Fyrd/caniuse/blob/main/features-json/webgpu.json https://github.com/protectwise/troika/tree/main/packages/troika-three-text

## [must] 6. 6. Pixel-lock discipline: one writer, no smoothing on registered elements, device-pixel snapping, no worker for the aligned layer

**What:** Rules for keeping DOM labels and WebGL marks registered at all sizes: (1) one function owns the frame state {progress, tx, playX, ppy, dpr}; it writes the DOM transform and the shader uniforms in the same callback. (2) The track's translation is linear in scroll: no spring or lerp on tx, ever. Smoothing is allowed only on decorative uniforms (glow width, parallax, light intensity). (3) Snap x to device pixels in both worlds. (4) Do not move the registered layer to an OffscreenCanvas worker. (5) The same ppy number feeds CSS and shaders.

**Why:** Drei's ScrollControls (source read) shows the trap: it damps the offset with easing.damp(state,'offset',scroll,0.25s) and moves HTML by writing translate3d from that damped value, which is fine in R3F because DOM and canvas are both slaved to the damped value, but combined with native scrolling it makes content trail the finger. GSAP scrub:1 on the GMT page has the same 1 s lag. Because the stage is sticky, linear tx has no visible latency penalty. Snapping avoids blurry text at fractional translate. OffscreenCanvas is supported (caniuse: Chrome 69, Firefox 105, Safari 17, 96.48%), but a worker renders asynchronously from the main-thread DOM write, which breaks per-frame registration; use it only for a purely decorative background layer if main-thread time ever demands it (CSP would need worker-src 'self' blob:).

**How:** ```ts
const snap = (v: number) => Math.round(v * dpr) / dpr;
function frame(p: number) {
  const playX = x(clock(p)); const tx = snap(-clamp(playX - 0.35 * vw, 0, trackW - vw));
  track.style.setProperty('--tx', tx + 'px'); // or trackEl.style.transform
  uniforms.uTx.value = -tx; uniforms.uPlayX.value = playX; invalidate();
}
```
Compute ppy once (`Math.max(72, vw/17)`), write `--ppy` to the stage and `uPpy` to the shader, and position DOM labels with `left: calc(var(--yr) * var(--ppy))` where --yr is the decimal offset from 2010. On resize: re-measure inside ResizeObserver, call frame(currentP) and render synchronously once so there is no one-frame mismatch. Re-measure again on document.fonts.ready.

**Libraries:** 

**Licence:** n/a

**Cost/risk:** None. Failure mode to test: fast fling scroll on a 120 Hz display; verify with a Playwright screenshot diff of label vs tick positions at 3 scroll offsets and 2 DPRs.

**Sources:** https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx https://github.com/14islands/r3f-scroll-rig https://github.com/Fyrd/caniuse/blob/main/features-json/offscreencanvas.json https://giantmagellan.org/timeline/

## [must] 7. 7. Accessibility model: ARIA tabs for role selection, a complete DOM list underneath, visible focus above the canvas

**What:** Use the WAI-ARIA APG tabs pattern for the eight roles: a role=tablist (horizontal, DOM order oldest to newest, matching the visual left-to-right order) whose role=tab buttons are the bars' hit areas, one role=tabpanel for the selected role with aria-labelledby, roving tabindex, automatic activation. Keep the complete content in a normal ordered list (newest first as now) that is always in the DOM and is the only thing visible when JS or WebGL is absent. The graphic itself is aria-hidden; its text alternative is the tablist plus the list and a one-sentence figcaption.

**Why:** Selecting one item to reveal one panel is exactly what tabs are for, and APG recommends automatic activation when panel content is displayed without noticeable latency, which holds because all role content is preloaded static HTML. APG keyboard model: Left/Right move focus (wrapping), Home/End jump to first/last, Tab leaves the list, Space/Enter activate only if activation is manual. Because scroll is the source of truth (rec 1), activation scrolls the page to the role and the playhead follows, giving keyboard users the same scrubbing. Targets: WCAG 2.2 SC 2.5.8 requires 24x24 CSS px (AA) with a spacing exception; the Enhanced 44x44 (SC 2.5.5, AAA) is the house rule in DESIGN.md. Bars narrower than 44 px (ATO on desktop is about 49 px, on the phone strip about 13 px) need an expanded invisible hit area on desktop and a different control on phones (rec 4). SC 2.5.7 (WCAG 2.2) forbids drag-only operation, so drag-to-pan (rec 8) needs the keyboard and click paths above. SC 1.4.10 Reflow exempts content needing two-dimensional layout such as diagrams, so a horizontal diagram is not a reflow failure, but the role text itself must still reflow at 320 px, which the panel and list do.

**How:** ```tsx
<div role="tablist" aria-label="Roles, 2010 to 2026">
  {rolesAsc.map((r,i)=> <button role="tab" id={`tab-${r.id}`} aria-selected={i===sel} aria-controls="role-panel" tabIndex={i===sel?0:-1} onKeyDown={onKey} ...>{label}<span className="sr-only">, {r.dates}</span></button>)}
</div>
<div role="tabpanel" id="role-panel" aria-labelledby={`tab-${rolesAsc[sel].id}`} tabIndex={0}>...</div>
```
onKey: ArrowRight/ArrowLeft with wrap, Home/End, preventDefault, move focus and call select(i), which scrolls (rec 1). Do not handle ArrowUp/Down (APG leaves them to page scroll). Hit areas: `.tab::before{content:'';position:absolute;inset:-8px -4px;min-inline-size:44px}`. Focus ring: draw it in the DOM with `outline:2px solid var(--accent);outline-offset:2px` on the tab (the canvas is aria-hidden and behind, so it never owns focus); do not rely on the shader highlight alone, because it disappears in forced-colors mode. Add `forced-colors` styles for the DOM ring. Sticky header: html{scroll-padding-top}. Announce changes politely only on user-initiated selection (a visually hidden role=status 'Selected: ANZ, Sept 2017 to Jun 2025'), not on every scroll tick. Keep one h2 for the section and h3 per role inside the list.

**Libraries:** 

**Licence:** n/a

**Cost/risk:** Low. Risk: tabs inside a scroll-linked sticky region can produce focus jumps if programmatic scroll is smooth; call focus({preventScroll:true}) on the tab and perform scrolling yourself. Test with axe (already in the suite) plus a manual VoiceOver and NVDA pass.

**Sources:** https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html https://www.w3.org/WAI/WCAG22/Understanding/reflow.html https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html

## [should] 8. 8. Drag-to-pan with inertia and overscroll containment, wired to scroll rather than to its own state

**What:** On (pointer: fine) devices with a stage whose track is wider than the viewport, let the user grab the track and drag it. Dragging does not move the track directly: it calls window.scrollTo(0, startY + dx * scrollPerTrackPx) so the page scroll stays the single source of truth; on release, run a motion inertia animation on a motion value whose onUpdate drives scrollTo. On touch, do nothing custom: native scroll plus (on phones) the snap carousel. Wheel stays native (vertical wheel scrolls the page, shift+wheel or trackpad horizontal gestures are ignored by the stage). Any horizontal overflow scroller that does exist (the reduced-motion version in rec 10, the phone carousel) gets overscroll-behavior-x: contain.

**Why:** This is how the GMT timeline does it: a GSAP Draggable (type:'x', inertia:true, bounds:{maxX:0}) on a proxy element whose onDrag/onThrowUpdate call the ScrollTrigger's scroll(-x), and ScrollTrigger's onUpdate writes the proxy back, so drag and scroll share one value. Because the track maps 1 px of scroll to 1 px of travel (rec 1), a 100 px drag moves the track 100 px, which feels physically correct. vis-timeline avoids hijacking by requiring a modifier key (zoomKey) for wheel zoom and by offering horizontalScroll/horizontalScrollKey: copy the restraint, not the API. drei's ScrollControls maps wheel deltaY to horizontal scrollLeft (`el.scrollLeft += e.deltaY / 2`) and that is the pattern to avoid. overscroll-behavior-x: contain stops scroll chaining and, per MDN, 'bounce' may still occur; it is supported from Safari/iOS 16 (97% usage).

**How:** ```tsx
import { animate, motionValue, inertia } from 'motion';
// pointer events on the stage track, mouse only
onPointerDown: if (e.pointerType !== 'mouse') return; track.setPointerCapture(e.pointerId); startY = scrollY; startX = e.clientX; v.start();
onPointerMove: window.scrollTo(0, startY - (e.clientX - startX) * pxScrollPerPxTrack); /* sample velocity */
onPointerUp: animate(y, y.get() + velocity * 0.4, { type: 'inertia', velocity: scrollVelocity, power: 0.8, timeConstant: 325, min: 0, max: maxY, onUpdate: (v) => window.scrollTo(0, v) });
```
motion 14.12.0 exports inertia and supports InertiaOptions (power, timeConstant, modifyTarget, min, max, bounceStiffness, bounceDamping) per its typings. Use modifyTarget to snap the landing position to the nearest role boundary (select the role you land on). Set `touch-action: pan-y` on the track so touch vertical scroll is never blocked and mouse drag still works; use cursor: grab / grabbing. Cancel inertia on wheel, keydown or pointerdown. Provide the non-drag alternatives (tabs, prev/next buttons) to satisfy SC 2.5.7. motion's own drag prop is a poor fit here because it moves the element's transform, creating a second source of truth beside scroll; use it only for the optional inspector panel, if any.

**Libraries:** motion@14.12.0

**Licence:** MIT

**Cost/risk:** Small custom code (about 60 lines). Risk: programmatic scrollTo per frame is main-thread work and can stutter on low-end laptops; throttle to rAF and skip when velocity is under 0.5 px per frame. GSAP Draggable would do this out of the box, but DESIGN.md excludes GSAP and its licence ('Standard no charge') should be read before adopting.

**Sources:** https://giantmagellan.org/timeline/ https://visjs.github.io/vis-timeline/docs/timeline/ https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior-x https://motion.dev/docs/react-drag https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html

## [should] 9. 9. Detail panel relationship: an SVG connector, a shared-element pill, and no View Transitions for scroll-driven changes

**What:** The selected role's panel is physically tied to its bar: a 1 px accent elbow connector from the bar's centre (below the axis) to a notch on the panel's top edge, plus a single 'selection pill' (an underline or outline) that glides between bars through a shared layoutId. Panel content crossfades with a keyed transition. Click-initiated expansions (for example 'open full role') can use a View Transition; scroll-driven changes use plain motion.

**Why:** A connector keeps the panel and the axis one object while the playhead moves. The connector endpoints come from the same layout the labels use, so it always lands on the bar edge. View Transitions are widely supported now (caniuse: Chrome 111, Safari 18, Firefox 144, 93.17%), and motion 14.12.0 ships animateView and the AnimateView component (motion/react-animate-view) as a wrapper that handles view-transition-name assignment. But a view transition snapshots the page and pauses rendering updates while it runs, which conflicts with continuous scroll-linked updates. That is engineering judgement, not a documented rule: test before relying on it.

**How:** Connector: one absolutely positioned <svg aria-hidden> inside the stage; in the frame callback compute `x1 = barCentreX + tx` (the track's translated position) and `x2 = panelNotchX`, then set `path.setAttribute('d', `M${x1} ${y1}V${yMid}H${x2}V${y2}`)`; clip it to the stage. Cache bar rects in the ResizeObserver, never read them per frame. Pill: `<m.span layoutId="role-pill" />` rendered inside the selected tab (LazyMotion with domMax is needed for layout animations; the repo uses domAnimation, so either load domMax only for this component or animate the pill with a motion value for x and width instead, which avoids the heavier feature bundle). Panel: `<AnimatePresence mode="wait" initial={false}><m.div key={role.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.32,ease:[.22,1,.36,1]}}/></AnimatePresence>` honouring MotionConfig reducedMotion='user' (already in place). Do not animate the panel's height during scroll (CLS); reserve the height of the tallest role.

**Libraries:** motion@14.12.0

**Licence:** MIT

**Cost/risk:** domMax adds roughly 50 kB raw over domAnimation (framer-motion size rollups in 14.12.0: m-dom-max 137 kB vs m-dom-animation 87 kB, ungzipped); prefer the motion-value pill to avoid it. Unverified: interaction of startViewTransition with a sticky scroll-linked stage; test in Chrome, Safari and Firefox before use.

**Sources:** https://motion.dev/docs/animate-view https://github.com/Fyrd/caniuse/blob/main/features-json/view-transitions.json https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

## [must] 10. 10. Three-tier fallbacks: no JS, no WebGL or reduced motion, and a context budget

**What:** Tier 0 (no JS or before hydration): server-rendered SVG/CSS axis with percent-positioned bars and the full ordered list. Tier 1 (JS, but no WebGL, software GL, context lost, or prefers-reduced-motion: reduce): the same DOM stage but with no pin and no canvas: a static axis fitted to the viewport width (or a native overflow-x scroller when the track is wider), instant selection, no sweep. Tier 2: full stage (recs 1, 5, 6). Mount at most one or two live WebGL contexts at a time.

**Why:** Owner requirement 4: content must be readable and complete without WebGL, with reduced motion and on a mid-range phone, and hero text must stay LCP. A reduced-motion reader should not be pinned and scrolled sideways by vertical scroll: convert the sticky translation into a user-driven native horizontal scroller (the platform equivalent that the user controls), and turn animation-timeline rules off as Chrome's scrollytelling guidance does. Browsers cap live WebGL contexts (commonly around 16 on desktop, fewer on mobile; not verified in this research), so a canvas for every section must mount only near the viewport and dispose when far away, which VisualStage already does for the hero.

**How:** Reduced motion: `@media (prefers-reduced-motion: reduce){.xp{height:auto}.xp__stage{position:static}.xp__viewport{overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity}.xp__track{transform:none;animation:none}}` and in JS skip useScroll entirely (matchMedia in useSyncExternalStore, as VisualStage does). The scroller needs tabindex=0, role=region and aria-label so keyboard users can pan it; add visible 44 px prev/next buttons. Canvas under reduced motion: render one frame and stop (the existing stage already does this). Hero strip (DESIGN.md says text is LCP): ship the existing SVG/CSS CareerScale first, now widened to the full hero width as a strip docked at the hero's bottom edge, with the section element full-width and the text in the 72rem container; add the canvas as an enhancement after load, never as the LCP element and with a reserved height so CLS stays under 0.05. Hero strip interaction: hover/tap a bar shows the existing tooltip and a click scrolls to the role in Experience (the existing anchor links remain). Shared-canvas alternative (one fixed canvas, scissor per tracked element, as drei's View does: getBoundingClientRect to setViewport/setScissor, orthographic left/right/top/bottom reset to +/-w/2, h/2) saves contexts, but it reads rects every frame (View exposes a `frames` prop to cap this) and lags native scroll by a frame, so use it only for non-pinned, soft visuals; prefer one canvas per pinned stage.
Test matrix to add: Chromium with SwiftShader (force flag), WebGL disabled, reduced-motion emulation, 390/834/1440/1920 widths, 200% zoom, forced-colors.

**Libraries:** 

**Licence:** n/a

**Cost/risk:** More states to test. Mitigated by building tier 1 first and letting tier 2 progressively enhance it. Unverified: exact per-browser WebGL context limits.

**Sources:** https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scrollytelling https://github.com/pmndrs/drei/blob/master/src/web/View.tsx https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior-x

## [could] 11. 11. Keep it to the real data: what the lit layer encodes

**What:** Make every light and depth effect carry data rather than decoration. Bar length is duration (exact). Bar height or glow can encode nothing else by default; use the warm proof colour only on the three roles that have a published headline figure (ATO about 92%, Independent, ANZ 10k+) with the figure printed in DOM above the bar; no fake metrics for roles without one (DESIGN.md rule 3). The light sweep follows the playhead; ticks near the playhead brighten (a local magnification cue), months show only when zoomed in enough.

**Why:** The studio-site failure mode is atmosphere detached from content; the GMT timeline's strongest idea is functional: its nav bar draws 24 small tick lines per nav item (read in its bundle: `nav-bar-line` x 24) and animates them on activation, which is the ruler motif doing work as navigation. DESIGN.md names the ruler as the single ornament. Depth layers should therefore be subtle and faint, and parallax limited to a few pixels, to satisfy the calm-over-spectacle rule.

**How:** Per-instance attributes: aTone (0 neutral, 1 accent for current, 2 proof for roles with headline), aSel (1 when selected, damped), aRect. Tick brightness: `float near = smoothstep(uW*2., 0., abs(vPx.x - uPlayX));` multiply tick alpha by `0.35 + 0.65*near`. Pointer parallax amplitude about 6 px on the far layer, 0 on the registered layer. Include a 'quality' scalar from the first 30 frames' average delta: below 45 fps drop DPR to 1, remove the depth layers, then fall to tier 1.

**Libraries:** 

**Licence:** n/a

**Cost/risk:** Low; adaptive quality adds about 30 lines. Risk of overdesign, so review in a browser at 390, 834 and 1440 px in both themes per the definition of done.

**Sources:** https://giantmagellan.org/timeline/ https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx

## Reference sites and repositories

- https://scroll-driven-animations.style/demos/horizontal-section/css/ — Source read. Canonical CSS-only pinned horizontal strip: tall section with view-timeline-axis:block, sticky wrapper, strip animated with translateX(calc(-100% + 100vw)) and animation-range: contain 0% contain 100%, gated by @supports. Take the structure and the animation-range. Avoid: fixed 250vmax strip width, 100vw (scrollbar overflow), overflow-x:hidden (use clip), 100vh (use svh), and the lack of a content fallback (it only shows a warning banner).
- https://giantmagellan.org/timeline/ — Live bundle read (gmto.js). ScrollTrigger pin with scrub:1, x tween of -(wrap.width - innerWidth), end:'+='+(wrap.width - innerWidth) for 1:1 scroll to travel, anticipatePin:1, invalidateOnRefresh:true; GSAP Draggable (type x, inertia, bounds maxX 0) on a proxy element synced to scroll via scroll(-x); nav items with 24 generated tick lines; below 768 px it switches to vertical. Take: 1:1 mapping, drag proxied to scroll, ticks as navigation. Avoid: breakpoint read once at init, scrub lag, jQuery and Slick weight (331 kB script), wheel and cursor hacks.
- https://github.com/pmndrs/drei/blob/master/src/web/ScrollControls.tsx — Source read. A native overflow scroller overlay with a fill div, an easing.damp offset (0.25 s default), invalidate() for demand rendering, and range(from, distance, margin)/curve/visible helpers that map global progress to per-section progress: copy those helpers for per-role progress. Avoid: horizontal mode converts wheel deltaY into scrollLeft (wheel hijack) and moves HTML in a separate React root.
- https://github.com/pmndrs/drei/blob/master/src/web/View.tsx — Source read. DOM rect to GL viewport mapping: getBoundingClientRect, computeContainerPosition, setViewport + setScissor + setScissorTest, orthographic camera reset to left=-w/2, right=w/2, top=h/2, bottom=-h/2, off-screen culling and a `frames` prop to cap rect reads. Take for a shared-canvas option and the pixel-aligned ortho setup. Avoid: per-frame rect reads on scrolling pages and one-frame lag against native scroll.
- https://github.com/14islands/r3f-scroll-rig — README and useTracker.ts read. A proxy DOM element is measured with getBoundingClientRect, kept in sync with IntersectionObserver and ResizeObserver (including body height changes from font load), a reflow() escape hatch, camera distance computed from screen height so 1 world unit = 1 CSS px, and a scaleMultiplier to avoid z-fighting. Take the camera maths and the font-load reflow. Avoid: Lenis dependency (DESIGN.md forbids smooth-scroll libraries) and note last npm publish was 2024-12-04 (8.15.0).
- https://visjs.github.io/vis-timeline/docs/timeline/ — Docs read (vis-timeline 8.5.6, modified 2026-10-26). Overlap handling via stack/subgroups/cluster, showCurrentTime, zoomMin/zoomMax, zoomKey and horizontalScrollKey so wheel is never hijacked without a modifier. Take: stacking model for overlapping roles and the modifier-key restraint. Avoid: no documented keyboard or ARIA support, so do not adopt it as the component.
- https://pudding.cool/process/scrollytelling-sticky/ — Article read. Prefer CSS position:sticky to scroll listeners for pinned graphics, JS only for step triggers; sticky only holds inside its parent, and listener-driven pinning janks. Take: sticky for the pin, no scroll listeners for pinning. Does not cover overflow-ancestor bugs or mobile viewport units (checked MDN for those).
- https://www.microsoft.com/en-us/research/wp-content/uploads/2008/01/cockburn-ComputingSurveys09.pdf — Cockburn, Karlson, Bederson, A Review of Overview+Detail, Zooming, and Focus+Context Interfaces, ACM Computing Surveys 41(1). Basis for the phone design: overview strip plus separate detail view.
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — APG tabs: exact roles, aria-selected, aria-controls, roving tabindex, Left/Right/Home/End, automatic activation recommended when panels have no latency.
- https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scrollytelling — Chrome guidance: animation-timeline after the animation shorthand, @supports gating, timeline-scope for shared names, reduced-motion override, do not use the scroll-timeline polyfill.

## Avoid

- Wheel hijacking (converting deltaY to horizontal scroll with preventDefault, or drei ScrollControls horizontal wheel mapping). Keep native vertical scroll driving a sticky stage.
- width:100vw or negative-margin full-bleed tricks: vw includes the classic scrollbar and creates horizontal page scroll on Windows. Make the section a full-width block and put only text in the 72rem container.
- overflow:hidden on ancestors of the sticky stage (creates a scroll container); use overflow:clip, and never clip interactive content.
- 100dvh or dvw for the stage: MDN notes dynamic units are unstable and resize content mid-scroll; use svh.
- Smoothing (spring, lerp, GSAP scrub:1) on the registered track translation: it makes labels trail scroll and desynchronises DOM from canvas.
- Driving the same element from both a CSS animation-timeline and JS; and driving a pinned canvas from CSS timelines (CSS cannot write uniforms, and compositor-driven DOM versus main-thread canvas skews by a frame).
- Text in WebGL (troika-three-text defaults to Google Fonts and jsDelivr, violating the CSP; SDF text also kills selection, translation and screen readers). Keep numerals and labels in DOM.
- OffscreenCanvas/worker rendering for the layer that must register with DOM text.
- Using perspective for anything that must align to DOM labels except at the z=0 plane with fov derived from height; otherwise parallax distorts registration.
- Reading getBoundingClientRect every frame in the scroll path (cache in ResizeObserver; the drei View frames prop exists for this reason).
- Scroll-timeline polyfill (Chrome's guide calls it not feature complete); ::scroll-marker and ::scroll-button (Chrome/Edge 135 only; Firefox and Safari unsupported per web.dev and caniuse).
- Plotting education and credentials on the axis: the CV data has no dates for them; placing them would invent data.
- Pinning the stage on phones, and evaluating the breakpoint once at load (the GMT bundle's window.innerWidth<768 read at init).
- GSAP, Lenis and R3F for this feature: excluded by DESIGN.md or unnecessary; GSAP's licence ('Standard no charge') is unreviewed.
- Plain horizontal drag-only navigation (WCAG 2.2 SC 2.5.7) and unlabeled icon-only targets under 44 px.

## Unverified

- Exact Chrome/Safari/Firefox version rows for animation-timeline from caniuse or MDN BCD tables: the caniuse and MDN pages did not render their tables in the fetch tool. Versions used here come from the bramus demo banner (Chrome 115+), the WebKit Safari 26.0 post and 26.5 notes, MDN Firefox 159 notes (released 2026-10-27) and web.dev October 2026 (Baseline Newly available).
- Whether the JS ScrollTimeline/ViewTimeline constructors are available in Safari 26 and Firefox 159; this design does not depend on them.
- Sticky positioning when an ancestor has container-type:inline-size (layout containment); not tested. Also not tested: iOS Safari behaviour of sticky inside an overflow:clip ancestor.
- Geist Mono advance width (needed to compute label widths at build time); verify from the font file.
- Whether failIfMajorPerformanceCaveat:true rejects Playwright's headless Chrome SwiftShader in this environment, and per-browser WebGL context caps.
- Real frame timings on a mid-range phone; no device measurements were taken. Bundle sizes (525 kB min, 134 kB gzip, 111 kB brotli) are from an esbuild 0.25.0 test bundle of the listed three classes only; a real Next.js chunk will differ. The 500 kB budget in DESIGN.md is ambiguous between raw and transferred bytes.
- Interaction of document.startViewTransition with a scroll-linked sticky stage (judgement, not a documented rule).
- Awwwards-listed studio timelines (Dorot, Significa, Rebuilding Titanic) were not analysed: their stacks are not stated on the listings and Codrops pages were blocked (403) to the fetch tool; no claims are made about them. Lusion, Igloo and other studio sites were triaged but their bundles were not read.
- motion AnimateView prop details and whether the layoutId-style shared element works under LazyMotion domAnimation (likely needs domMax); not tested.
- GSAP 3.15.1 licence terms ('Standard no charge', link only) were not read in full.
- motion 14.12.0's useScroll with a sticky target under React 19.2.8 and Next 15.5 static export was not run; hydration timing of the offset measurement should be checked.

# datavis3d

_three.js techniques for data-true section visuals and effects (hero, headline figures, work schematics, capabilities constellation, portrait, contact), with implementation detail, measured numbers and budgets. Verified 2026-11-10 against npm, GitHub source and docs; benchmarks run on this machine (headless Chrome, SwiftShader)._

## [must] 1. Use vanilla three.js with a small lazy engine module, one WebGLRenderer per visible visual (max 3 live), not React Three Fiber

**What:** Build the visuals as a framework-free TypeScript engine (lib/gl/*) that VisualStage dynamic-imports after first paint. Each visual (hero, figures x3, schematics x6, constellation, portrait, contact) is a class with mount(canvas, tier), setPlaying(bool), setSize(w,h), dispose(). A tiny pool keeps at most 3 renderers alive at once (IntersectionObserver rootMargin about 100% vertical); leaving views are disposed with renderer.dispose() plus the WEBGL_lose_context extension. Stay on WebGLRenderer (not WebGPURenderer/TSL) for this release.

**Why:** Measured today with esbuild --minify, gzip -9: a named-import three@0.187.0 subset (WebGLRenderer, Scene, PerspectiveCamera, InstancedBufferGeometry, ShaderMaterial, Points, CatmullRomCurve3, DataTexture) is 137 KB gzip; adding Line2/LineGeometry/LineMaterial plus GPUComputationRenderer is +9 KB; adding postprocessing (EffectComposer, RenderPass, EffectPass, Bloom, Noise, Vignette, ChromaticAberration) is +15 KB; maath easing is +0.6 KB. R3F's Canvas alone is 255 KB gzip (it pulls the whole three namespace) and R3F + postprocessing wrappers is 281 KB, i.e. about 118 KB more than the imperative path for no visual gain. The WebGPURenderer entry is 227 KB gzip. All of it is a lazy chunk, so the hero text stays the LCP: web.dev lists the LCP candidates as img, svg image, video, url() background images and block-level text, and canvas is not among them. Per-visual renderers avoid the scroll-sync lag risk of one fixed full-page canvas that is scissored to DOM rects (what drei View does: it calls getBoundingClientRect each frame and setViewport/setScissor), while the context cap reports (about 8 on some Android, 16 on desktop) are respected by the pool. WebGPU is Baseline-ish (Chrome/Edge 113+, Firefox 141 Windows, Safari 26) but share figures conflict (76-83 percent) and SwiftShader tests need WebGL2, so WebGL2 is the safe renderer.

**How:** Engine shape:

// lib/gl/context.ts
import { WebGLRenderer, ColorManagement, SRGBColorSpace } from 'three';
ColorManagement.enabled = true;
export function makeRenderer(canvas: HTMLCanvasElement) {
  const r = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true });
  r.outputColorSpace = SRGBColorSpace;
  return r;
}
// failIfMajorPerformanceCaveat makes SwiftShader/llvmpipe throw -> catch -> Tier 0 (static). Playwright opts back in with ?gl=full.

Loop ordering with Motion (motion/three writes uniforms in frame.preRender, so render in frame.render):
import { frame, cancelFrame } from 'motion';
const draw = () => renderer.render(scene, camera);
frame.render(draw, true);   // keepAlive; call cancelFrame(draw) to stop

Pool: Map<id, Visual>; IntersectionObserver per section -> mount()/dispose(); keep the hero alive until it is 1.5 viewports away. Handle webglcontextlost (preventDefault, setPlaying(false), show the DOM/poster fallback) and webglcontextrestored (rebuild) exactly as VisualStage already listens for them. Gate on document.hidden, off-screen, prefers-reduced-motion and connection.saveData (already in VisualStage). Do not run a loop when nothing animates: under reduced motion render once and call cancelFrame (R3F's frameloop=demand idea, done by hand).

CSP: three.js and these shaders need no eval and no workers. KTX2Loader and DRACOLoader create blob workers, which the committed firebase.json blocks (worker-src 'self' only), so use plain AVIF/WebP via TextureLoader/ImageBitmapLoader. Note the committed firebase.json script-src still contains 'unsafe-eval' and 'unsafe-inline'; three does not need eval, so it can be dropped.

TypeScript: @types/three@0.187.0 declares typeScriptVersion 5.6, the repo pins typescript 5.3.3, so bump to 5.9.3 (latest 5.x) and re-run typecheck and eslint.

**Libraries:** three@0.187.0, @types/three@0.187.0, typescript@5.9.3

**Licence:** MIT (three, @types/three), Apache-2.0 (typescript)

**Cost/risk:** About 137-150 KB gzip lazy chunk for the full non-R3F stack (measured), shared by all visuals through the module cache. Each live renderer costs one context plus a shader compile of tens of ms, hence the pool. Risk: three minor versions break addons paths and postprocessing's peer range (three >=0.168 <0.188), so pin exact versions. The repo node_modules holds stale @react-three/*, @monogrid and @mediapipe folders that package.json no longer lists; do a clean npm ci so nothing imports them by accident.

**Sources:** https://github.com/mrdoob/three.js/releases (r184-r187 notes: r187 released 30 Oct 2026, npm time 2026-10-30) https://web.dev/articles/lcp (canvas not an LCP candidate) https://raw.githubusercontent.com/pmndrs/drei/master/src/web/View.tsx (scissor views, per-frame rect read) https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices (WEBGL_lose_context, render smaller back buffer, alpha cost) https://web.dev/blog/webgpu-supported-major-browsers Local measurement: esbuild bundles of three@0.187.0, @react-three/fiber@9.8.2, postprocessing@6.39.6, maath@0.10.8 /home/aetheragent/work/forgotten-mistory/components/visuals/VisualStage.tsx and firebase.json

## [must] 2. Hero field and the full-width Experience timeline: one shared 'ruler' LineSegments geometry, drift done in the vertex shader

**What:** Build one RulerGeometry factory that emits vertical hairline ticks as GL line segments (LineSegments, 1 device pixel, additive, 1 draw call). The hero uses it as 6-8 receding lanes (z-depth) with about 6,000 segments on desktop and 2,500 on phones; slow drift is a mod() wrap in the vertex shader, pointer parallax is a camera offset, the light sweep is a gaussian brightness band travelling along x. The Experience section uses the same factory in orthographic mode (1 world unit = 1 CSS px): exactly one tick per month from 2010 to NOW (September 2026 = 189 monthly ticks, 16 majors at each January), eight role bars as instanced quads, role boundaries and the NOW mark in the warm proof colour. Mono numerals and role labels remain DOM.

**Why:** Data-true and cheap. In headless Chrome/SwiftShader at 1280x720, 6,000 LineSegments with a drifting vertex shader ran 19.3 ms median (p95 45 ms) against 16.7 ms for an empty scene, 20,000 segments 41 ms; the same 6,000 ticks as instanced quads (2 triangles each) ran 84 ms and 2,000 quads 59 ms; a fullscreen procedural-ruler fragment shader was 88 ms at dpr 1 and 258 ms at dpr 2. Software GL is not a phone, but the ordering (lines and points are geometry-bound and cheap; fullscreen fragment work scales with pixels x dpr) is exactly the mid-range phone risk. The front ruler is real data (content/experience.ts ym(), TIMELINE_START, NOW), so the 'instrument' is not decoration.

**How:** Geometry (CPU, once):
const pos: number[] = []; // x = month index mapped to world, y0..y1 tick extent, z = lane
for (let lane = 0; lane < LANES; lane++) for (let m = 0; m < MONTHS; m++) { const major = m % 12 === 0; const h = major ? 1.0 : 0.45; const x = m * PITCH; pos.push(x, 0, z, x, h, z); }
geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
geometry.setAttribute('aKind', new BufferAttribute(kinds, 1)); // 0 minor, 1 major, 2 role boundary, 3 now (warm); duplicate per endpoint

Vertex shader (ShaderMaterial, transparent, depthWrite:false, blending AdditiveBlending, frustumCulled=false):
uniform float uTime, uSpan, uSweepX, uResolve; uniform vec2 uPointer; attribute float aKind; varying float vA; varying float vKind;
void main(){ vec3 p = position;
  p.x = mod(p.x + uTime * uDrift * (0.4 + 0.2 * p.z) + uSpan * 0.5, uSpan) - uSpan * 0.5;   // both ends of a vertical tick share x, so the wrap is consistent
  p.z = mix(p.z, 0.0, uResolve);                                  // contact scene collapses lanes onto one baseline
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float sweep = exp(-pow((p.x - uSweepX) / 6.0, 2.0));
  vA = (1.0 - smoothstep(10.0, 60.0, -mv.z)) * (0.25 + 0.55 * step(0.5, aKind)) + 0.5 * sweep;
  vKind = aKind; gl_Position = projectionMatrix * mv; }
Fragment: vec3 c = mix(uAccent, uProof, step(1.5, vKind)); gl_FragColor = vec4(c * vA, vA); then #include <colorspace_fragment> so the token colours match the DOM.

Colours: read --accent / --proof once via getComputedStyle and new Color().setStyle(); re-read on theme change (palette.ts already has subscribeToTheme). Under reduced motion set uTime to a fixed STILL value and render once.

Parallax: damp the camera, not the ticks. import { damp } from 'maath/easing'; in the loop: damp(camera.position, 'x', pointer.x * 1.2, 0.35, dt); damp(camera.position, 'y', pointer.y * 0.6, 0.35, dt); only when matchMedia('(hover: hover) and (pointer: fine)').matches. On touch use a slow sinusoidal idle drift, never DeviceOrientation (iOS permission prompt).

Full-width: never use 100vw (scrollbar overflow). Give section shells a full-bleed grid: grid-template-columns: [full-start] minmax(var(--gutter),1fr) [content-start] min(72rem, 100% - 2*var(--gutter)) [content-end] minmax(var(--gutter),1fr) [full-end]; the timeline element spans full-start/full-end with inline-size:100%. ResizeObserver -> renderer.setSize(w, h, false) with pixel ratio min(devicePixelRatio, tier cap). Timeline camera: new OrthographicCamera(0, w, h, 0, -10, 10); x = (year - 2010) / (NOW - 2010) * w; at 360 px that is 22 px per year, still legible because labels are DOM and staggered above/below the bar row. Keep an equivalent DOM list (ol of roles) as the reading path; canvas is aria-hidden.

Limitation: GL_LINES are 1 device pixel (about 0.33-0.5 CSS px on 2-3x phones), which suits hairlines. If a thicker accent line is needed, use LineSegments2 (see rec 4), whose linewidth is in CSS px in r187.

**Libraries:** three@0.187.0, maath@0.10.8

**Licence:** MIT

**Cost/risk:** 1 draw call, 0 per-frame CPU allocation, about 12-18 bytes per vertex: 6,000 segments = 12,000 vertices = about 0.15 MB. GPU cost scales with line count and additive overdraw, not with resolution, so it is the cheapest hero primitive that still reads as a ruler. Aliased 1 px lines can shimmer on slow drift: keep drift under 10 px/s or snap drift to whole device pixels.

**Sources:** Local benchmark (headless Chrome 'chrome' channel, --use-angle=swiftshader, 1280x720): LineSegments 6,000 = 19.3 ms median; 20,000 = 41 ms; instanced quads 6,000 = 84 ms; fullscreen ruler fragment = 88 ms dpr1 / 258 ms dpr2 /home/aetheragent/work/forgotten-mistory/content/experience.ts (ym, TIMELINE_START, NOW) https://raw.githubusercontent.com/flavioow/threejs-depth-portrait/HEAD/src/three/scene/shaders/image-parallax-shader.ts (includes tonemapping_fragment and colorspace_fragment in a ShaderMaterial) https://www.npmjs.com/package/maath (easing.damp/damp3 signatures read from the 0.10.8 d.ts)

## [must] 3. Headline figures: three tiny scenes whose counts are the figures (10,000 points, 200 cells, 40 marks in 5 groups)

**What:** Each figure gets a 100% x 220 px canvas under its numeral, driven by one uProgress spring that starts when the card enters the viewport. Devices: exactly 10,000 Points laid out as 100 x 100, with a vertical 200 ms ruler line sweeping across (the P95 target) and the card numeral tied to it with NumberFlow. Evidence effort: 200 instanced cells in 20 x 10, each a bar that eases from full height (the ~3 h manual evidence per scenario) to 1/12 height (~15 min), which is 91.7 percent removed, matching the printed 92 percent. Portfolio: 40 marks as SDF discs in five groups (5+ squads, up to 40 practitioners) clustered on a ruler baseline. Captions say the drawing illustrates the figure's definition and is not telemetry.

**Why:** The counts are the evidence, so the picture is auditable by counting, and the sources are in the repo (proof.ts: 92, 5, 10k+; capabilities.ts: 200+ SIT scenarios, ~3 h to ~15 min per scenario, up to 40 practitioners). Points are the cheapest primitive measured: 10,000 point sprites ran 16.7 ms median (p95 29 ms at dpr 1, 36 ms at dpr 2) in SwiftShader, which is vsync-capped here, i.e. effectively free. Content rule 1 (never invent a figure) means no fabricated latency distribution: do not colour points by a made-up latency histogram. Optionally, and only with owner sign-off, split 9,500 / 500 as the literal definition of a 95th percentile (at least 95 percent of measurements under the 200 ms threshold), labelled as the definition.

**How:** Points, one draw call, state in the shader:
const N = 10000; const pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const x = i % 100, y = (i / 100) | 0; pos.set([x - 49.5, y - 49.5, 0], i * 3); }
const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(pos, 3)); g.setAttribute('aRank', new BufferAttribute(rank01, 1)); // rank = i / N, deterministic
Vertex: gl_PointSize = uSize * uPixelRatio * mix(1.0, 1.6, ring); where ring = smoothstep(0.02, 0.0, abs(position.x / 50.0 - uSweep)) lights the points the 200 ms ruler passes.
Fragment (anti-aliased disc, no texture): float d = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.5 - fwidth(d), 0.5, d); if (a < 0.01) discard;

Cells: InstancedBufferGeometry from a 1x1 quad, attributes aCell (vec2 grid index); vertex scales y by mix(1.0, 1.0/12.0, easeOutCubic(clamp(uProgress * 1.4 - hash(aCell) * 0.4, 0.0, 1.0))); stagger by the hash so it reads as 200 independent runs finishing, not a global scale. Colour the remaining bar in --proof (warm) and the removed part as a faint --line-strong ghost.

Marks: 40 Points with attributes aGroup (0-4) and aSlot; target = groupCentre[aGroup] + packed offset; mix(start, target, uProgress). Draw five faint group rules, not boxes. Equal 8-per-group is an arrangement choice, not a claim: caption 'up to 40 practitioners across 5+ squads; grouping illustrative'.

Drive: const u = { uProgress: { value: 0 } }; animate(u, { uProgress: 1 }, { type: 'spring', visualDuration: 1.1, bounce: 0 }) after animate.addEffect(threeEffect) from 'motion/three' (rec 8). Run the numerals with the existing @number-flow/react from the same trigger. Reduced motion: set uProgress = 1 and render one frame.

Phone: same counts (they are the figures), dpr cap 1.5, no post. Skip rendering when off-screen.

**Libraries:** three@0.187.0, motion@14.12.0, @number-flow/react@0.6.2

**Licence:** MIT (three, motion, @number-flow/react is MIT)

**Cost/risk:** 3 draw calls total across 3 views, under 1 MB GPU memory, about 10 KB of shader and JS source. Main risk is editorial, not technical: every non-count visual choice (grid order, grouping) must be labelled illustrative so it never reads as measured data.

**Sources:** /home/aetheragent/work/forgotten-mistory/content/proof.ts and content/capabilities.ts Local benchmark: 10,000 Points ShaderMaterial additive, 16.7 ms median, p95 29.1 ms (dpr1) / 36.2 ms (dpr2), SwiftShader 1280x720 https://github.com/pmndrs/drei/blob/master/src/core/Points.tsx (read: drei Points is not GPU instancing; a plain Points with your own buffers is the fast path) https://motion.dev/docs/three

## [should] 4. Selected work: six data-driven isometric schematics with GPU-driven packets along baked paths

**What:** One SchematicView class parameterised by the six ids already in content/work.ts (pipeline-gate, rebuild-loop, verifier-loop, reconstruction-bands, diamond-chart, scroll-rail), each with its three stages. Nodes are flat isometric tiles (InstancedMesh, 3 instances, matcap or fresnel-rim ShaderMaterial), links are LineSegments2 fat lines (CSS-px width), and packets are a single Points object whose positions are computed in the vertex shader from a path DataTexture. Gates and loops are encoded as packet behaviour: at the gate a deterministic subset fades or reverses (revert), loop paths are closed CatmullRomCurve3. Captions keep the existing line that the drawing is not live activity.

**Why:** Keeps each schematic to about 3-5 draw calls with zero per-frame CPU work, which matters because six of them sit in one scrolling section. three-forcegraph's directional particles (README: linkDirectionalParticles, speed as a ratio of link length per frame) are Object3D spheres, not instanced (no InstancedMesh in its dist), i.e. the wrong model to copy. Fat lines are cheap at schematic scale and in r187 LineSegments2.onBeforeRender sets material.resolution from the current viewport, so scissor/multi-view or resize needs no manual resolution update, and linewidth is in CSS pixel units when worldUnits is false. Measured: 300 fat segments ran 33 ms median at dpr 1 and 47 ms (p95 487 ms) at dpr 2 in SwiftShader, so keep the fat-line count per view under about 40 and use plain LineSegments for anything decorative.

**How:** Path baking (CPU, once per view, microseconds):
const curve = new CatmullRomCurve3(points, closed, 'centripetal'); const S = 64; const pts = curve.getSpacedPoints(S - 1);
const data = new Uint16Array(S * ROWS * 4); // HalfFloat via DataUtils.toHalfFloat
const tex = new DataTexture(data, S, ROWS, RGBAFormat, HalfFloatType); tex.minFilter = tex.magFilter = LinearFilter; tex.needsUpdate = true;
// HalfFloat, not Float: linear filtering of half floats is core in WebGL2, float32 linear needs OES_texture_float_linear.

Packets: Points with attributes aPath (row), aPhase (0-1), aSpeed. Vertex shader:
float t = fract(aPhase + uTime * aSpeed);
vec3 p = texture2D(uPaths, vec2(t, (aPath + 0.5) / uRows)).xyz;
float cycle = floor(aPhase + uTime * aSpeed);
float revert = step(hash(aPhase + cycle), uRevertEvery);      // deterministic, e.g. every 4th pass; illustrative only
float past = smoothstep(uGateT, uGateT + 0.02, t);
float a = 1.0 - revert * past;                                  // packet dies at the gate
vAlpha = a; gl_PointSize = uSize * uPixelRatio; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
For 'reverse' behaviour mirror t: t = mix(t, uGateT - (t - uGateT), revert * past).

Isometric camera: const cam = new OrthographicCamera(-w/2/s, w/2/s, h/2/s, -h/2/s, 0.1, 100); cam.position.set(10, 10, 10); cam.lookAt(0, 0, 0); (s = world-to-px scale). Node tiles: one BoxGeometry(1, 0.12, 1) InstancedMesh with MeshMatcapMaterial (256 px matcap) or the rim shader below; stage labels are DOM beside the canvas, not troika text.

Fat links: import { LineSegments2 } from 'three/addons/lines/LineSegments2.js'; LineSegmentsGeometry.setPositions(flat), LineMaterial({ color, linewidth: 1.5, transparent: true, opacity: 0.7, alphaToCoverage: false }); LineSegments2 handles resolution itself. Call .computeLineDistances() only if dashed.

Per-schematic specifics from content/work.ts: pipeline-gate (3 nodes, packets die at the guard, then a short revert arc back); rebuild-loop and verifier-loop (closed path, packets circulate, only the 'exit' stage lets one packet leave the loop); reconstruction-bands (3 horizontal bands, packets rise through them); diamond-chart (diamond lattice, a gate line that colours drift beyond the gate warm); scroll-rail (six stops on a rail). Pointer hover on the card only multiplies uTime speed with damp(); never needed for meaning.

Reduced motion: set uTime to a fixed value so packets sit at their phases, render once. DOM caption and stage list stay the content.

**Libraries:** three@0.187.0, maath@0.10.8

**Licence:** MIT

**Cost/risk:** 3-5 draw calls per schematic, under 0.2 MB of buffers, one 64 x rows half-float texture each. Only 1-2 schematics are ever live because of the pool in rec 1. Risk: reverting packets can be read as real system behaviour, so keep the not-live-activity caption adjacent and use a fixed, plainly illustrative cycle.

**Sources:** https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_lines_fat.html (Line2 + LineGeometry + LineMaterial; linewidth, worldUnits, dashed, alphaToCoverage; imports from three/addons/lines/) three@0.187.0 examples/jsm/lines/LineSegments2.js (read: onBeforeRender sets resolution from viewport) and LineMaterial.js (linewidth in CSS px) https://github.com/vasturiano/three-forcegraph (README: linkDirectionalParticles, linkDirectionalParticleSpeed; dist has no InstancedMesh) https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices (float16 blending always supported; float32 blending is not) /home/aetheragent/work/forgotten-mistory/content/work.ts (SchematicId, stages tuple) Local benchmark: LineSegments2 300 segments 33 ms (dpr1) / 47 ms, p95 487 ms (dpr2), SwiftShader

## [must] 5. Capabilities constellation: layout solved at build time with d3-force-3d, rendered as Points + fat edges, interaction through DOM buttons

**What:** The graph is small and fully known: 17 capabilities + 15 sources (3 programmes, 7 repositories, 5... see content/capabilities.ts: ato, anz, independent, aether, abentertainment, this-site, public-key-server, rectifier, timeline, jira-dashboard, scrum-alliance, monash, unimelb) = 32 nodes and 20 edges (one capability, the pending credential, has no source). Solve the 3D layout once in a prebuild script with d3-force-3d, commit the positions as content/generated/constellation.json, and ship no simulation. Render nodes as one Points object (SDF discs; ring = status: production filled, non-production half, pending hollow), edges as one LineSegments2, with a slow whole-graph yaw. Filters (kind: programme/repo/credential; status) and hover/focus never move nodes: they change per-node and per-edge emphasis via uniforms, animated with springs. Every node is also a real DOM button positioned from the same normalised coordinates.

**Why:** Measured on this machine (node 22, d3-force-3d@3.0.6): 300 ticks (the default alphaDecay 0.0228 yields about 300 ticks to reach alphaMin 0.001, per the README) took 75 ms (3D) to 124 ms (2D) for 34 nodes and 364-507 ms for 120 nodes on a loaded desktop CPU; a mid-range phone is several times slower, so a runtime sim would block the main thread for hundreds of ms and would make the layout differ per visit. d3-force-3d is deterministic by default (fixed-seed LCG randomSource; NaN positions use phyllotaxis), so the committed JSON is reproducible and a CI test can re-run the script and diff. three-forcegraph/3d-force-graph run the sim live (cooldownTime default 15000 ms, warmupTicks default 0) and draw spheres as Object3D, which is more cost than 32 nodes warrant. Not moving nodes on filter keeps hit targets stable and the motion calm; morphing between several precomputed layouts is possible with two position attributes and mix(aPosA, aPosB, uT) if ever wanted, at 32x3 floats per layout.

**How:** scripts/layout-constellation.mjs (devDependency, run in prebuild):
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceY } from 'd3-force-3d';
const nodes = [...caps.map(c => ({ id: 'c:' + c.short, kind: 'capability' })), ...sources.map(s => ({ id: 's:' + s.id, kind: s.kind }))];
const links = caps.flatMap(c => c.sources.map(s => ({ source: 'c:' + c.short, target: 's:' + s }))); // 20
const sim = forceSimulation(nodes, 3).force('link', forceLink(links).id(d => d.id).distance(28).strength(0.8)).force('charge', forceManyBody().strength(-90)).force('center', forceCenter(0, 0, 0)).force('band', forceY(d => ({ programme: 18, repository: 0, credential: -18, capability: 0 }[d.kind])).strength(0.05)).stop();
sim.tick(300);
writeFileSync('content/generated/constellation.json', JSON.stringify(nodes.map(n => [n.id, +n.x.toFixed(2), +n.y.toFixed(2), +n.z.toFixed(2)])));
For a horizontal full-width read, scale x to the container aspect and clamp |y| and |z|; the layout is wider than tall by construction.

Render: Points aNode attributes: aKind, aStatus, aMask (bit per filter facet). Uniforms: uFilter (bitmask as float), uHover (node index or -1), uHoverMix (0-1 spring), uTime. Vertex computes lit = step(0.5, mod(floor(aMask / uFilterBit), 2.0)); alpha = mix(0.14, 1.0, max(lit, neighbour)) where neighbour comes from a per-node adjacency bitmask or a small uniform array of 32 floats (cheap, 32 nodes). Edge emphasis: CPU-set LineSegmentsGeometry.setColors (RGB lerped toward the background colour, because LineMaterial has a single global opacity) only when the filter or hover id changes, never per frame.

Interaction (see rec 8): <ul role='list'> of <button aria-pressed> chips and one <button> per node, absolutely positioned at left:(x/spanX)*100%, top:(y/spanY)*100% inside an aspect-ratio box that the canvas also fills. Because both read the same normalised coordinates there is no raycasting. onPointerEnter/onFocus -> setHover(index); onBlur/onPointerLeave -> setHover(-1). The canvas is aria-hidden; the evidence text for the active node is a visible, live DOM panel. The whole-graph yaw must stop when any node has focus or the filter is active, and rotation is disabled under reduced motion (use the fixed projected layout), so DOM buttons never drift from their drawn position: project in JS with the same camera for the DOM positions each frame only while rotating, or keep the camera static and give depth by perspective and z-fade only (recommended).

Transitions: animate(uniforms, { uFilter: next, uHoverMix: 1 }, { type: 'spring', visualDuration: 0.45, bounce: 0 }) via motion/three, or damp(u.uHoverMix, 'value', target, 0.18, dt) from maath.

**Libraries:** d3-force-3d@3.0.6, three@0.187.0, motion@14.12.0

**Licence:** MIT (d3-force-3d, three, motion)

**Cost/risk:** Build-time only: about 75-125 ms in Node. Runtime: 2 draw calls (Points + LineSegments2), under 20 KB of data. Risk: keep the edge-dimming CPU path under 1 ms (20 edges). If edges are curved (24 samples each from a CatmullRomCurve3) that is 480 segments, still trivial for LineSegments2.

**Sources:** https://raw.githubusercontent.com/vasturiano/d3-force-3d/master/README.md (numDimensions, forceZ, alphaDecay about 0.0228 / 300 ticks, fixed-seed randomSource, tick() and stop()) https://github.com/vasturiano/three-forcegraph (README: warmupTicks 0, cooldownTicks Infinity, cooldownTime 15000, tickFrame(), forceEngine d3|ngraph) Local measurement: d3-force-3d dim=3 N=34 300 ticks median 74.6 ms; N=120 507 ms (node 22.23.1, desktop, load average about 13 on 4 cores) /home/aetheragent/work/forgotten-mistory/content/capabilities.ts (17 capabilities, sources[], status)

## [must] 6. Interaction and motion plumbing: DOM hit targets first, Motion's threeEffect for springs, maath damp for continuous follow, CPU nearest-point instead of raycasting

**What:** Rules: (1) meaning is always reachable through real DOM (buttons, lists, inputs) with keyboard parity; the canvas is decorative and aria-hidden. (2) No raycasting for dense data: derive picks from data you already hold (DOM rects, or nearest projected point in a JS loop). (3) State transitions use Motion springs bound to uniforms via motion/three; continuous pointer follow uses maath damp in the render loop. (4) GPU picking is the fallback only for geometry that cannot be reduced to data.

**Why:** Measured raycasting an InstancedMesh of 10,000 instances in headless Chrome on this desktop: 4.6 ms median (p95 16.6 ms) for a 2-triangle plane and 1.4 ms (p95 5 ms) for a 20-triangle icosahedron per pointer move, which is too heavy for a phone at 60 Hz; a plain JS loop that projects 10,000 points and keeps the nearest took 0.2 ms median (p95 3.3 ms). The official GPU-picking example (webgl_interactive_cubes_gpu) renders only the pixel under the pointer into a 1x1 RGBA32I target with an integer id attribute (Int16 ids, so under 32,768) and reads it back with readRenderTargetPixelsAsync, which is correct but is extra render passes and an async frame of latency. Motion 14.12.0 (already a dependency) ships motion/three: animate.addEffect(threeEffect) lets animate() target Object3D, materials and ShaderMaterial uniforms objects, with x/y/z, rotateX/Y/Z (degrees), scale, colours and uniform values, springs included, and it writes in frame.preRender so you render in frame.render. That removes the need for a separate tween or spring library.

**How:** Setup once in the lazy chunk:
import { animate, frame, motionValue, transformValue } from 'motion';
import { threeEffect } from 'motion/three';
animate.addEffect(threeEffect);

Uniform spring (hover emphasis, filter, figure progress):
const u = material.uniforms;            // { uHoverMix: { value: 0 }, ... }
animate(u, { uHoverMix: 1 }, { type: 'spring', visualDuration: 0.4, bounce: 0 });
Bind an existing motion value (scroll): const p = motionValue(0); threeEffect(u, { uProgress: p }); scroll((v) => p.set(v), { target: sectionEl });
Cameras: call camera.updateProjectionMatrix() yourself after changing fov (documented caveat).

Continuous follow: import { damp, damp3 } from 'maath/easing'; // damp(obj, 'prop', target, smoothTime, delta, maxSpeed?, easing?, eps?) returns true while still moving
frame.render(({ delta }) => { const dt = delta / 1000; const moving = damp3(camera.position, target, 0.35, dt); renderer.render(scene, camera); }, true);
Stop rendering when nothing moves and nothing is animating (return to demand mode).

Pointer: use one pointermove listener on the section (passive), normalise to -1..1, ignore when (hover: none). Touch: tap on a DOM button is the interaction; no hover simulation.

Keyboard parity: every filter and node is a <button> in DOM order; :focus-visible and onFocus set the same hover id as pointer; Escape clears filters; a visible, live evidence panel (aria-live polite) mirrors the highlighted node. Test with Playwright keyboard.press('Tab') and axe (already in the repo).

Nearest-point pick for the 10,000-point scene if a hover readout is ever wanted:
let best = -1, bd = 1e9; for (let i = 0; i < N; i++) { v.set(P[3*i], P[3*i+1], P[3*i+2]).project(camera); const d = (v.x - mx) ** 2 + (v.y - my) ** 2; if (d < bd) { bd = d; best = i; } }  // reuse one Vector3, no allocation; throttle to rAF
If true GPU picking is ever needed: WebGLRenderTarget(1, 1, { type: IntType, format: RGBAIntegerFormat, internalFormat: 'RGBA32F'... } ) exactly as in the example (RGBA32I), setViewOffset to the pointer pixel, clear colour -1, readRenderTargetPixelsAsync.

**Libraries:** motion@14.12.0, maath@0.10.8, three@0.187.0

**Licence:** MIT

**Cost/risk:** motion/three is a 12 KB (unminified) module inside the already-installed package; maath easing is +0.6 KB gzip. Risk: motion/three is new, so pin motion exactly and cover with a Playwright test that asserts a uniform changes after a spring; TSL support only applies to WebGPURenderer (not used here).

**Sources:** https://motion.dev/docs/three (animate.addEffect(threeEffect), uniforms, springs, scroll, caveats) /home/aetheragent/work/forgotten-mistory/node_modules/motion/dist/es/three.mjs (read: preRender step, transformMap, uniform handling) https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_interactive_cubes_gpu.html (1x1 RGBA32I target, int id attribute, readRenderTargetPixelsAsync) https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgl_instancing_raycast.html (instanceId, setColorAt, instanceColor.needsUpdate) maath@0.10.8 dist/declarations/src/easing.d.ts (damp, damp2, damp3, damp4, dampE, dampC, dampQ, dampM signatures) Local benchmark: InstancedMesh raycast 10,000 instances 4.6 ms (plane) / 1.4 ms (icosa) median; JS nearest projected point 0.2 ms

## [should] 7. About portrait: fragment-shader depth parallax with depth-derived relighting, depth map generated offline

**What:** A single textured plane (1 draw call) that shows the portrait with pointer-driven parallax from a baked depth map, a gentle edge falloff and alpha guard to avoid stretched borders, plus a soft specular/rim light that follows the pointer, with normals derived from depth gradients so no normal map is shipped. Mounted only when About is near the viewport; a DOM img with alt stays underneath as the always-readable version and is the only version under reduced motion or Tier 0.

**Why:** flavioow/threejs-depth-portrait (MIT; read the shader) shows the proven recipe: displacedUv = vUv - motion * (depth - 0.5) * strength * edgeFalloff * alphaGuard, clamped with discard at the borders, a small vertex displacement on a subdivided plane, depth shaped with pow(depth, uDepthPower), damped motion input, and a faint fresnel and specular term, ending with tonemapping_fragment and colorspace_fragment. It is deliberately subtle ('lightweight pseudo-3D'), which is what reads as premium. The existing public/assets/my_avatar.avif is 1480 x 826, 36.5 KB (WebP 51 KB), so a depth sibling at the same size is about 4.9 MB of VRAM per texture without mipmaps, well inside a 2048 px budget.

**How:** Offline pipeline (scripts/make-depth, not shipped): run Depth-Anything-V2-Small (huggingface depth-anything/Depth-Anything-V2-Small-hf, Apache-2.0, 24.8M params) on the portrait; convert to 8-bit; blur the depth slightly (sharp gaussian, sigma about 1.5-2 px) to hide 8-bit banding and edge halos; encode AVIF; commit portrait-depth.avif next to the portrait. Use the Small model only: the README states Base/Large/Giant are CC-BY-NC-4.0.

Runtime: TextureLoader (or ImageBitmapLoader with imageOrientation: 'flipY'); for both textures set generateMipmaps = false, minFilter = magFilter = LinearFilter, wrapS = wrapT = ClampToEdgeWrapping; diffuse colorSpace = SRGBColorSpace, depth colorSpace = NoColorSpace (as in the flavioow image-plane). Plane with 1 x 1 segments is enough when you only offset UVs.

Fragment core:
uniform sampler2D uDiffuse, uDepth; uniform vec2 uMotion, uTexel; uniform vec2 uLight; uniform float uStrength, uPow;
float d = pow(texture2D(uDepth, vUv).r, uPow);
float edge = 1.0 - smoothstep(0.36, 0.78, length(vUv - 0.5));
vec2 uv = clamp(vUv - uMotion * (d - 0.5) * uStrength * edge, vec2(0.002), vec2(0.998));
float dx = texture2D(uDepth, uv + vec2(uTexel.x, 0.0)).r - texture2D(uDepth, uv - vec2(uTexel.x, 0.0)).r;
float dy = texture2D(uDepth, uv + vec2(0.0, uTexel.y)).r - texture2D(uDepth, uv - vec2(0.0, uTexel.y)).r;
vec3 n = normalize(vec3(-dx * uBump, -dy * uBump, 1.0));
vec3 L = normalize(vec3(uLight - uv, 0.6));
float lit = clamp(dot(n, L), 0.0, 1.0);
vec3 col = texture2D(uDiffuse, uv).rgb; col += col * (lit - 0.5) * 0.12 + 0.02 * pow(lit, 24.0);
gl_FragColor = vec4(col, 1.0); #include <colorspace_fragment>
Keep strength small (about 0.012-0.02 in UV units) so it never reads as a 3D toy.

Input: pointer position damped with maath (smoothTime about 0.25) on desktop; on touch a very slow idle sway (about 0.1 Hz, amplitude 0.3 of the pointer range) or nothing. No DeviceOrientation. Light follows the pointer with a second, slower damp.

Content rule: DESIGN.md requires a synthetic-media disclosure beside any generated likeness; the asset name (my_avatar) and the avatar video suggest the image may be generated. Confirm what the image is and keep the disclosure adjacent to the canvas.

Phone: dpr cap 1.5, canvas sized to the card (not full screen), 5 texture taps per fragment is fine; if a governor drop reaches Tier 1 stop the loop and show the static image.

**Libraries:** three@0.187.0, maath@0.10.8, sharp@0.35.4

**Licence:** MIT (three, maath); sharp is Apache-2.0; Depth-Anything-V2-Small Apache-2.0 (Base/Large CC-BY-NC-4.0, avoid)

**Cost/risk:** 1 draw call, 2 textures (about 10 MB VRAM at 1480 x 826 RGBA, no mipmaps), 5 texture taps per fragment on one card-sized quad. Risks: depth quality on hair and glasses edges (mitigate with edge falloff and small strength); LAB-quality AVIF depth can band if over-compressed, so check the depth image at quality 70+ before shipping.

**Sources:** https://raw.githubusercontent.com/flavioow/threejs-depth-portrait/HEAD/src/three/scene/shaders/image-parallax-shader.ts (read in full) https://raw.githubusercontent.com/flavioow/threejs-depth-portrait/HEAD/src/three/scene/image-plane.tsx (texture colour spaces, no mipmaps, LinearFilter) https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf (Apache-2.0, 24.8M params) https://github.com/DepthAnything/Depth-Anything-V2 (Small Apache-2.0; Base/Large/Giant CC-BY-NC-4.0) /home/aetheragent/work/forgotten-mistory/public/assets/my_avatar.avif (1480x826 via sharp metadata) /home/aetheragent/work/forgotten-mistory/docs/DESIGN.md (content rule 6)

## [should] 8. Contact: the same ruler geometry, resolved onto a single baseline

**What:** Reuse the hero's RulerGeometry (same BufferGeometry instance, new ShaderMaterial clone) in a short, wide (about 40vh, 100% width) canvas. As the section scrolls in, uResolve goes 0 to 1: lanes collapse to z = 0, drift slows to zero, the sweep ends, and the ticks settle into one baseline spanning 2010 to NOW with the NOW tick lit in the warm proof colour and the contact line (email) sitting at that tick. After resolution nothing moves; there is no looping animation to compete with the call to action.

**Why:** It closes the motif with no new assets or geometry (geometry buffers are shared across scenes within a renderer; across separate renderers the same CPU factory re-uploads about 0.15 MB), and 'quiet' means the one moving thing is the scroll-driven settle. It is also the cheapest scene in the page: 1 draw call, static after the settle, which is why you can keep it mounted at Tier 1.

**How:** const geom = getRulerGeometry({ lanes: 6, months: 189 });   // module-level cache
const mat = heroMaterial.clone(); mat.uniforms.uResolve.value = 0;
const p = motionValue(0); threeEffect(mat.uniforms, { uResolve: p }); // or animate()
scroll((v) => p.set(v), { target: contactEl, offset: ['start 0.9', 'start 0.3'] });
In the vertex shader reuse rec 2: p.z = mix(p.z, 0.0, uResolve); p.x drifts by uTime * uDrift * (1.0 - uResolve); additive brightness: vA *= mix(1.0, 0.6, uResolve) except aKind == 3 (NOW) which goes to 1.0. Use an OrthographicCamera in CSS px so the baseline sits at the same vertical position as the DOM contact line (read its getBoundingClientRect once after layout and on resize). Stop the loop when uResolve has been 1 for 500 ms and nothing else animates. Reduced motion: start at uResolve = 1.

**Libraries:** three@0.187.0, motion@14.12.0

**Licence:** MIT

**Cost/risk:** 1 draw call, 0 ms steady state. Risk is alignment drift between canvas and DOM on resize: re-measure inside ResizeObserver, not on scroll.

**Sources:** /home/aetheragent/work/forgotten-mistory/content/experience.ts (NOW = ym(2026, 9)) https://motion.dev/docs/three (scroll() driving threeEffect values)

## [should] 9. Post-processing: default to none; on the high tier only merged Bloom + Noise (+Vignette) with HDR accents; prefer in-shader alternatives

**What:** Current stack: postprocessing@6.39.6 (Zlib) works with three@0.187.0 because its peer range is three >=0.168 <0.188 (the next three minor will exceed it, so pin). Use it, vanilla, only on the desktop high tier: EffectComposer({ frameBufferType: HalfFloatType, multisampling: 0 }), RenderPass, and one EffectPass containing BloomEffect({ mipmapBlur: true, luminanceThreshold: 1.0, luminanceSmoothing: 0.03, intensity: 0.25-0.6, radius: 0.85, levels: 5 }) plus NoiseEffect(premultiply) and optionally VignetteEffect, all merged into one pass. Skip depth of field and global chromatic aberration. For everything else use in-shader substitutes.

**Why:** Worth-its-cost ranking: (1) selective-looking bloom via threshold 1 is the single effect that sells light on thin hairlines and warm marks; Bruno Simon's folio-2025 (read) ships exactly this on WebGPU TSL: bloom threshold 1, strength 0.25, with nMips 5 on desktop and 2 on mobile, and a cheapDOF only at the highest quality level, so it is dropped on mobile. (2) grain: in-shader hash noise in the hero fragment is free; NoiseEffect only if a composer exists anyway. (3) DoF: fake it per primitive (point size and alpha by distance from focus). (4) chromatic aberration: reads as 2018-era; if used, restrict to 0.0003-0.0006 offset at the screen edge. Cost evidence: in this environment's SwiftShader every fullscreen pass is expensive: with a loaded machine (load average 13 on 4 cores) the baseline 10,000-point scene was about 46 ms, noise+vignette merged about 144 ms, bloom about 350 ms. Treat that as ordering, not magnitude, but it means Playwright runs must disable the composer. Merging: effects fall into UV-transform, convolution and other categories; convolution + convolution or UV + convolution cannot share a pass, otherwise EffectPass merges everything into one compound shader. Bloom with mipmapBlur defaults: levels 8, radius 0.85, luminanceThreshold 1.0, intensity 1.0 (resolutionScale is deprecated).

**How:** import { EffectComposer, RenderPass, EffectPass, BloomEffect, NoiseEffect, VignetteEffect } from 'postprocessing';
const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: 0 });
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new BloomEffect({ mipmapBlur: true, luminanceThreshold: 1.0, intensity: 0.4, levels: 5 }), new NoiseEffect({ premultiply: true }), new VignetteEffect()));
// frame.render(() => composer.render(), true)
HDR trick: draw the accent and warm marks with colour multipliers above 1.0 (for example uAccent * 1.6) so only they cross the bloom threshold; keep text-adjacent greys below 1.0. Use ShaderMaterial toneMapped handling consistently (include tonemapping_fragment only if you use renderer.toneMapping; default NoToneMapping is right for flat tokens).
In-shader alternatives: (a) glow = additive second pass of the same lines with larger linewidth and 0.15 alpha (LineSegments2 linewidth 4); (b) grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453) * 0.03 added to colour; (c) vignette in CSS (radial-gradient) at zero GPU cost; (d) DoF = size *= 1.0 + k * abs(z - focus), alpha *= 1.0 / (1.0 + k * abs(z - focus)); (e) hair-thin halo via alphaToCoverage on LineMaterial when MSAA is available.
R3F route, if ever adopted: @react-three/postprocessing@3.2.2 (peers react ^19.0.0, @react-three/fiber >=9.7.0, postprocessing ^6.36.0, three >= 0.156.0); v3.2.0 lowered default multisampling from 8 to 4, v3.0.5 dropped forwardRef for ref as a plain prop; EffectComposer props include resolutionScale, multisampling, frameBufferType, mergeMode ('auto'|'all'|'none'); SelectiveBloom takes selection, selectionLayer, lights, inverted, ignoreBackground. Skip SelectiveBloom: it needs an extra selection pass per frame.
Tier rules: composer only when tier === 'high' and not software GL and not saveData; levels 4-5; render the composer at the canvas pixel ratio capped at 1.5.

**Libraries:** postprocessing@6.39.6, three@0.187.0

**Licence:** Zlib (postprocessing), MIT (three)

**Cost/risk:** +15 KB gzip (measured). GPU: bloom with 5 levels is about 10 small fullscreen passes plus luminance and merge (pass count not measured here); noise+vignette is one merged pass. Fill-rate risk grows with dpr squared, hence the cap. Peer risk: three >=0.188 exceeds postprocessing 6.39.6's range, so upgrade the two together.

**Sources:** https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Rendering.js (bloom threshold 1, strength 0.25, _nMips 5 vs 2, cheapDOF gated by quality level) https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Passes/cheapDOF.js and Quality.js (level 1 on mobile user agents) https://github.com/pmndrs/postprocessing/wiki/Effect-Merging (merge compatibility table) https://raw.githubusercontent.com/pmndrs/postprocessing/main/src/effects/BloomEffect.js (defaults) https://github.com/pmndrs/react-postprocessing/releases (3.2.2 on 21 Oct, peers, 3.2.0 multisampling 8 to 4, 3.0.5 ref as prop) @react-three/postprocessing@3.2.2 dist/EffectComposer.d.ts and dist/effects/Bloom.d.ts, SelectiveBloom.d.ts (read) npm view postprocessing@6.39.6 peerDependencies = three >= 0.168.0 < 0.188.0

## [could] 10. Materials and lighting that look premium cheaply, and what to leave out

**What:** Use flat tokens, additive hairlines, small rim and matcap accents and baked gradients. Avoid transmission, refraction, HDRI-lit PBR and real-time shadows entirely.

**Why:** drei's MeshTransmissionMaterial (default samples = 10, optional backside pass, extra resolution props) re-renders the whole scene into a buffer in useFrame (state.gl.render(state.scene, state.camera) at two call sites, read in the 10.7.9 source), i.e. one or two extra scene renders plus a 10-tap sampling loop per frame, which is a desktop-only luxury and not data-true. Utsubo's 2026 guide (secondary source) quotes under about 100 draw calls and under about 100,000 vertices as a mobile budget, 3 or fewer dynamic lights, and textures at 2048 px or below. What reads dated or gimmicky in 2026 is my judgement, backed only weakly by one blog's observation that award winners commit to one strong visual concept: glassy transmission blobs, torus-knot or crystal hero objects, neon bloom everywhere, galaxy particle fields unconnected to data, cursor-following glow blobs, OrbitControls-style drag rotation on a logo, scroll-jacking, global chromatic aberration, and extruded 3D headline text. What holds up: restraint, exact alignment to the DOM grid, hairlines, one warm accent, motion slower than feels necessary.

**How:** (1) Matcap: MeshMatcapMaterial({ matcap: 256-512 px texture }) for the schematic tiles; one matcap for all, tinted per node via instanceColor (InstancedMesh.setColorAt then instanceColor.needsUpdate = true). (2) Fresnel rim in a ShaderMaterial: float f = pow(1.0 - clamp(dot(normalize(vViewDir), n), 0.0, 1.0), 3.0); col += uAccent * f * 0.15 (the same term flavioow uses). (3) Baked gradients: a 256 x 1 DataTexture ramp built from the CSS tokens to map depth or status to colour in one texture2D, no per-frame JS. (4) Colour management: ColorManagement.enabled = true, renderer.outputColorSpace = SRGBColorSpace, Color.setStyle(token) converts to linear, and ShaderMaterial fragments must end with #include <colorspace_fragment> or accent colours will not match the DOM. (5) No dynamic lights, no shadows, no environment maps. (6) Mono numerals stay in DOM (Geist Mono); do not add troika-three-text (+0.88 MB unpacked, creates a blob worker which the committed CSP blocks).

**Libraries:** three@0.187.0

**Licence:** MIT

**Cost/risk:** Near zero GPU cost; the only risk is colour mismatch between canvas and DOM, which a Playwright screenshot diff of a token swatch rendered in both will catch.

**Sources:** /tmp scratch read of @react-three/drei@10.7.9 core/MeshTransmissionMaterial.js (samples = 10, gl.render in useFrame) and .d.ts (backside, resolution, samples props) https://www.utsubo.com/blog/threejs-best-practices-100-tips (draw calls, vertices, lights, textures; secondary source) https://raw.githubusercontent.com/flavioow/threejs-depth-portrait/HEAD/src/three/scene/shaders/image-parallax-shader.ts (fresnel and subtle specular) https://www.awwwards.com/annual-awards/ (jury process only; the restraint claim comes from a single personal blog found in search and is weak evidence)

## [must] 11. Budgets, tiers and graceful degradation (measured where possible)

**What:** Adopt explicit budgets and a four-tier system chosen at mount and adjusted by a frame-time governor. Tier 0 static (no WebGL, WebGL2 missing, software GL such as SwiftShader/llvmpipe, saveData, context lost, reduced-motion where the effect is purely motion): DOM content only, optionally one rendered frame. Tier 1 low: dpr cap 1.25, counts x0.5, no post, 30 fps by skipping every other frame, no pointer parallax. Tier 2 mid (default for phones): dpr cap 1.5, full counts, no post. Tier 3 high (desktop with fine pointer): dpr cap 2, merged Bloom+Noise.

**Why:** Budgets for a page with several small canvases (my targets; sources noted): at most 3 live renderers; at most 12 draw calls per view (hero 1, figures 1 each, schematics 3-5, constellation 2, portrait 1, contact 1); total triangles per view under 5,000 (this design is lines and points); points per view at most 10,000; line segments at most 6,000 desktop and 2,500 phone; fat (LineSegments2) segments at most 40 per view; textures at most 2048 px on the long side, all sized to the card; zero per-frame allocations; JS+GPU frame cost at most 8 ms on a mid-range phone at 60 Hz (half of 16.7 ms to leave room for compositing). External guidance for context: R3F docs say keep draw calls at 1000 as the very maximum, Utsubo cites under about 100 draw calls and under about 100,000 vertices for mobile (secondary, attributed there to Don McCurdy), and cap pixel ratio at 2. Measured here on SwiftShader (relative only): empty 16.7 ms; 10,000 points 16.7 ms; 6,000 line segments 19 ms; GPGPU 64 x 64 (4,096 particles) 16.7 ms but 256 x 256 (65,536) 91.5 ms; instanced quads 2,000 = 59 ms; fullscreen procedural fragment 88 ms (dpr 1) and 258 ms (dpr 2). Playwright capability facts on this machine: WebGL2 true, EXT_color_buffer_float and EXT_color_buffer_half_float present, MAX_TEXTURE_SIZE 8192, renderer string ANGLE (SwiftShader). R3F's PerformanceMonitor idea (flipflops to stop oscillation, DPR step-down) is implemented by hand because R3F is not used; detect-gpu defaults to fetching benchmark data from unpkg (CSP violation) and would need its benchmarksURL pointed at self-hosted files, so it is not worth it for a few canvases.

**How:** Tier detection (sync, cheap):
const canvas = document.createElement('canvas'); const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }); if (!gl) return 0; const dbg = gl.getExtension('WEBGL_debug_renderer_info'); const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''; if (/SwiftShader|llvmpipe|Software/i.test(name) && !location.search.includes('gl=full')) return 0; gl.getExtension('WEBGL_lose_context')?.loseContext();
const coarse = matchMedia('(pointer: coarse)').matches; const mem = navigator.deviceMemory ?? 4; const cores = navigator.hardwareConcurrency ?? 4;
return (coarse || mem <= 4 || cores <= 4) ? 2 : 3;   // deviceMemory is Chromium-only; treat undefined as 4

Governor (about 30 lines, in the loop):
const buf = new Float32Array(45); let i = 0, flips = 0; // push delta ms each frame
if (full window) { const med = median(buf); if (med > 22 && tier > 1 && flips < 3) { tier--; flips++; applyTier(tier); reset(); } else if (med < 12 && sinceChange > 4000 && tier < maxTier && flips < 3) { tier++; flips++; applyTier(tier); } }
applyTier(t): renderer.setPixelRatio(Math.min(devicePixelRatio, [0, 1.25, 1.5, 2][t])); view.setDensity([0, 0.5, 1, 1][t]) (draw ranges: geometry.setDrawRange(0, n) for Points/LineSegments, InstancedBufferGeometry.instanceCount for instanced); composer on/off.
Tier 0 render: if WebGL exists but software, render one frame at uTime = STILL and stop (or skip entirely). The DOM remains complete in every tier, so the hero text stays the LCP and nothing in the reading path depends on WebGL.

Testing: add a Playwright project with --use-angle=swiftshader and ?gl=full for visual regression of the 10,000-point figure and the constellation, plus the default project asserting Tier 0 behaviour (canvas absent or aria-hidden, content present). Add a Stats-GL or renderer.info overlay behind #stats (renderer.info.render.calls, .triangles, .points, .lines) as folio-2025 does, and assert draw-call and point counts in a unit test.

Secondary mobile limit: do not sample more than 8 textures per fragment, avoid loops with dynamic bounds in fragment shaders, prefer mediump for colour-only fragments (Qualcomm claims up to 2x on Adreno, per the Utsubo article, unmeasured here).

**Libraries:** three@0.187.0, stats-gl@4.2.3

**Licence:** MIT

**Cost/risk:** The governor and tier code are about 80 lines. Risks: deviceMemory/hardwareConcurrency are hints only (deviceMemory is not in Safari or Firefox); tier flip-flopping annoys users, hence the cap of 3 changes per session and no automatic upgrade after a downgrade caused by thermal throttling (reset on visibilitychange).

**Sources:** https://r3f.docs.pmnd.rs/advanced/scaling-performance (PerformanceMonitor flipflops, dpr, regress, frameloop demand, 1000 draw calls maximum) https://www.utsubo.com/blog/threejs-best-practices-100-tips (mobile budgets; secondary) https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices (render smaller back buffer, lose contexts eagerly) https://github.com/pmndrs/detect-gpu (README: default benchmarks from unpkg, benchmarksURL option) https://raw.githubusercontent.com/brunosimon/folio-2025/main/sources/Game/Quality.js and Rendering.js (setStats reading renderer.info.render.drawCalls/triangles) https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/misc/GPUComputationRenderer.js (setDataType HalfFloatType; init() returns an error string when maxVertexTextures is 0) Local benchmarks on this machine (4 cores, load average 13, headless Chrome SwiftShader, 1280x720)

## Reference sites and repositories

- https://github.com/brunosimon/folio-2025 — MIT. Read Rendering.js, Quality.js, Passes/cheapDOF.js: bloom threshold 1 / strength 0.25, nMips 5 desktop vs 2 mobile, DOF only at top quality, a one-number quality level that every system listens to, renderer.info stats overlay. Do not copy its WebGPU/TSL path or Rapier; take the quality-level discipline.
- https://github.com/flavioow/threejs-depth-portrait — MIT. src/three/scene/shaders/image-parallax-shader.ts: UV-offset parallax with edge falloff and alpha guard, pow-shaped depth, subtle fresnel/specular, colorspace_fragment include; image-plane.tsx for texture colour-space and filter settings; gyro-input.ts is the iOS-permission path to avoid.
- https://github.com/mrdoob/three.js/blob/dev/examples/webgl_interactive_cubes_gpu.html — GPU picking with a 1x1 RGBA32I target, int id attribute via gpuType = IntType, view-offset to the pointer pixel, readRenderTargetPixelsAsync. Use only when a pick cannot be derived from data.
- https://github.com/mrdoob/three.js/blob/dev/examples/webgl_lines_fat.html — Line2/LineGeometry/LineMaterial imports from three/addons/lines/, linewidth, worldUnits, alphaToCoverage, setColors for per-vertex colour; remember r187 sets resolution automatically in onBeforeRender.
- https://github.com/mrdoob/three.js/blob/dev/examples/jsm/misc/GPUComputationRenderer.js — API: new GPUComputationRenderer(sx, sy, renderer), createTexture(), addVariable(name, fragmentShader, initialTexture), setVariableDependencies, init() (returns error string), compute(), getCurrentRenderTarget(variable).texture, setDataType(HalfFloatType). Caveat: createTexture() always allocates a Float32 DataTexture even after setDataType. Only needed if the hero ever moves beyond vertex-shader drift.
- https://github.com/pmndrs/drei/blob/master/src/web/View.tsx — How a single-canvas multi-view setup tracks DOM rects with setViewport/setScissor, frames={1} to avoid per-frame rect reads, visible={false} to clear once and stop. Informs the alternative (one fixed canvas) and its scroll-sync caveat.
- https://motion.dev/docs/three — animate.addEffect(threeEffect) from motion/three; animate() on meshes, materials, uniforms; scroll() driving motion values bound with threeEffect; render in frame.render because values are written in frame.preRender.
- https://github.com/vasturiano/d3-force-3d — forceSimulation(nodes, 3), forceZ, tick(n), stop(), deterministic fixed-seed randomSource: use at build time to emit constellation.json.
- https://github.com/vasturiano/three-forcegraph — What not to do at runtime for 32 nodes (live sim, cooldownTime 15000, Object3D spheres); README props show a good filter/hover vocabulary (nodeVisibility, linkDirectionalParticles) to mirror in the DOM chips.
- https://github.com/pmndrs/postprocessing — EffectPass merging, BloomEffect({ mipmapBlur, luminanceThreshold, levels, radius }), HalfFloatType frame buffer, multisampling 0; wiki Effect-Merging compatibility table.
- https://threejs.org/docs/pages/GPUComputationRenderer.html — Official docs page for the addon import path three/addons/misc/GPUComputationRenderer.js.

## Avoid

- React Three Fiber + drei for this site: +118 KB gzip measured over the imperative path for no visual gain, a stale @react-three folder already sits in node_modules, and one declarative scene graph per canvas fights the per-section pool. (Compatibility, if ever needed: @react-three/fiber@9.8.2 peers react >=19 <19.4, drei@10.7.9 react ^19, @react-three/postprocessing@3.2.2 react ^19.0.0 and fiber >=9.7.0; all fine with React 19.2.8.)
- WebGPURenderer / TSL in this release: 227 KB gzip entry vs 137 KB, postprocessing library is WebGL-only, share data conflicts (76-83 percent), headless SwiftShader tests need WebGL2. Revisit when the Playwright pipeline can run a real WebGPU adapter.
- A runtime force simulation (d3-force or three-forcegraph) for 32 nodes: 75-125 ms desktop per 300 ticks, several hundred ms on a phone, and nondeterministic layout per visit.
- Raycasting an InstancedMesh of 10,000 per pointermove (1.4-4.6 ms median on desktop, p95 5-17 ms): use DOM rects or a projected nearest-point loop.
- Fullscreen procedural-ruler fragment shaders as the hero: 88 ms at dpr 1 and 258 ms at dpr 2 in SwiftShader; on phones fragment cost scales with dpr squared. Use line or point geometry.
- Instanced quads for hairline ticks (6,000 = 84 ms vs 19 ms for LineSegments in the same environment).
- MeshTransmissionMaterial and any refraction/glass look (extra scene render per frame, 10 samples by default, reads as dated).
- detect-gpu with default settings (benchmark data fetched from unpkg breaks CSP); KTX2Loader/DRACOLoader/troika-three-text (blob workers blocked by worker-src 'self'); DeviceOrientation parallax (iOS permission prompt).
- One fixed full-page canvas scissored to DOM rects as the default architecture (scroll-sync lag risk, unmeasured) and any use of 100vw for full-bleed (scrollbar overflow): use the full-bleed grid with 100% widths.
- Global chromatic aberration, heavy glow, DoF via postprocessing, galaxy particle fields, cursor-following blobs: decoration, not data.
- Depth-Anything-V2 Base/Large/Giant for the portrait depth map (CC-BY-NC-4.0); use Small (Apache-2.0).
- Inventing any non-count visual quantity (latency histograms, squad sizes, revert rates) without an 'illustrative' caption: content rule 1 forbids invented figures.

## Unverified

- All performance numbers I measured (SwiftShader software GL, 4 shared cores, load average up to 13) are relative orderings, not phone frame times; I had no mid-range phone or GPU-lab access. Post-processing timings were taken while the machine was heavily loaded (baseline moved from 16.7 ms to 46-97 ms between runs).
- Mobile budgets (under about 100 draw calls, under about 100,000 vertices, 3 or fewer lights, mediump 2x on Adreno) come from the Utsubo 2026 article, a secondary source that attributes the first to Don McCurdy; I could not trace a primary statement. The R3F docs figure (1000 draw calls maximum) is primary.
- The Codrops articles 'Relighting Images with Depth Maps and Three.js' (2026-08-19) and 'Crafting a Dreamy Particle Effect with Three.js and GPGPU' (2024-12-19) returned HTTP 403; I only saw search-result summaries (e.g. that 8-bit depth maps band and need float conversion or blur), so nothing is sourced from their code.
- WebGPU global share (76-83 percent) and whether Safari/iOS ships it are from conflicting secondary sources; web.dev states Safari 26, Chrome/Edge 113+, Firefox 141 (Windows) and 145 (macOS ARM64). No Can I Use value for 2026-11-10 was retrieved.
- WebGL context-count limits (about 8 on some Android, 16 on desktop Chrome/Firefox/Safari) are from forum and Q&A reports, not a specification; the pool of 3 is conservative.
- The scroll-lag claim for a single fixed canvas scissored to DOM rects is widely reported but I did not measure it.
- That half-float RGBA16F textures filter linearly without an extension in WebGL2 while float32 linear needs OES_texture_float_linear: I rely on spec knowledge; MDN best-practices confirmed only the blending side (float16 blending always supported, float32 not).
- How many fullscreen passes postprocessing's mipmap bloom issues at levels 5 vs 8 (I estimated about 10 small passes at 5): not counted.
- Whether public/assets/my_avatar.* is a photograph or a generated avatar (1480 x 826 landscape, so it needs a portrait crop); the synthetic-media disclosure rule in DESIGN.md applies if generated.
- Depth-Anything 3 (named in the Codrops summary) license and quality were not checked; I only verified V2 Small (Apache-2.0).
- typescript 5.9.3 compatibility with the repo's eslint 8.57 / @typescript-eslint stack and Next 15.5.25 was not tested; @types/three@0.187.0 requires TypeScript 5.6+.
- The committed firebase.json CSP (script-src includes 'unsafe-inline' and 'unsafe-eval', worker-src 'self' without blob:) differs from the brief's 'no eval, workers from self or blob:'; I did not check whether a deployed header differs from the committed file.
- Final gzip sizes were measured with gzip -9 on esbuild output; Firebase Hosting serving Brotli would be smaller, and Next's chunking will add framework overhead.
- The capability graph figures (32 nodes, 20 edges, 15 sources) were derived by regex over content/capabilities.ts; confirm the source list and counts before hard-coding anything.

# craft

_Craft that separates a top-tier animated portfolio from an average one in late 2026, plus the web-platform techniques worth using next to three.js (checked 2026-11-10 against npm, MDN BCD 8.1.8, library source, Codrops case studies and a headless-Chrome probe of live sites)_

## [must] 1. Scroll and canvas sync: native scroll, one shared canvas that rides the scroll position, one frame loop. No Lenis, no scroll-jacking.

**What:** Use one WebGL canvas for the whole page (one context, shared materials), absolutely positioned and translated to follow window.scrollY every frame (Lusion's non-scroll-jacking method, also used by the official three.js webgl_multiple_elements example). Each section stage is a DOM element whose rectangle becomes a viewport/scissor rect inside that canvas. Own ONE requestAnimationFrame loop (renderer.setAnimationLoop) that reads scrollY and the cached rects, updates uniforms, renders. DOM-only scroll effects use CSS scroll-driven animations. Do not add Lenis, GSAP ScrollSmoother or any virtual-scroll layer.

**Why:** Decisive answer for a site that forbids scroll hijacking: Lenis 1.3.27 (still npm latest; 2.0.0-dev.6 exists only on a dev tag, there is no released successor) calls event.preventDefault() on wheel and touch and replaces them with its own animated scrollTo (lenis.mjs lines ~618 and ~631 in the installed package) - that is scroll hijacking in the strict sense, even though it ends by moving native scroll. I measured ten.375.studio (Studio375 'Ten Years Away', a horizontal comic): html.lenis and document scrollHeight equals the viewport height (900), i.e. it has no native scroll extent at all, which is the anti-pattern the owner forbids. The reason studios use Lenis is the DOM/WebGL one-frame desync (Lusion's README: native scroll is not on the same thread as rAF). Lusion's answer needs no hijack: let the canvas scroll with the page (position:absolute; per rAF set transform translate(0, scrollY - pad)), so a late frame cannot drift against the DOM; hide the clipped edges with 25% vertical padding or an edge fade. three.js's own example does the same (canvas.style.transform = translateY(window.scrollY)px, line 183 of webgl_multiple_elements at r187). HAOQI.DESIGN (Codrops, 2026-08-15) documents what goes wrong with two loops: a consistent one-frame WebGL delay under fast scroll because Lenis and R3F each owned a rAF and ran in the wrong order. A site that never smooths scroll has no such ordering problem as long as there is one loop.

**How:** 1) Layout: <canvas id=stage aria-hidden=true> as the first child of <body>, position:absolute; top:0; left:0; width:100%; height:calc(100dvh + 2*var(--pad)); pointer-events:none; z-index:0; with --pad = 25dvh. Page content above it with position:relative; z-index:1. Do not use position:fixed (fixed is what produces the drift on compositor-threaded scroll).
2) One loop in a small class StageHost (vanilla three, no R3F; Giulio and Trionn both dropped R3F for control of the loop):
  const rects = new Map<HTMLElement, {top:number,left:number,w:number,h:number}>();
  function tick(now){
    const y = scrollY;
    canvas.style.transform = `translate3d(0, ${y - padPx}px, 0)`;
    renderer.setScissorTest(true);
    for (const s of stages) { if (!s.visible) continue; const r = s.rect; /* page-space, scroll-corrected */
      const top = r.top - (y - padPx); const bottom = canvasH - (top + r.h);
      renderer.setViewport(r.left, bottom, r.w, r.h); renderer.setScissor(r.left, bottom, r.w, r.h);
      s.update(now, dt); renderer.render(s.scene, s.camera); }
  }
3) Rect cache (copy HAOQI's DomTargetRectSampler idea): measure rects with getBoundingClientRect only on mount, on ResizeObserver, and on IntersectionObserver entry; between those, store page-space coordinates (rect.top + scrollY) and derive viewport position from the current scrollY. Never call getBoundingClientRect per card per frame. HAOQI refreshes near-viewport rects every frame and far ones every 12th frame, staggered by index (frame % 12 === index % 12); you will have 7 stages so measuring on resize + scrollend is enough.
4) Visibility: IntersectionObserver rootMargin '200px' sets stage.visible; the loop does not run at all (setAnimationLoop(null)) when no stage is visible, the tab is hidden, or the tier says static (see recommendation 3).
5) Shared scroll/pointer snapshots, not per-component listeners: export getScrollSnapshot() and getPointerSnapshot() from a tiny module that the loop writes once per frame; React reads them with useSyncExternalStore only where a value changes DOM output (HAOQI ScrollBus/PointerBus pattern). Scroll velocity = |scrollY - prev| / clamp(dt, 1/240, 0.1) (the clamp stops a backgrounded tab producing a spike).
6) DOM-only scroll effects: CSS `animation-timeline: view()` / `scroll()` wrapped in @supports. When JS needs progress for a section, use motion's scroll(callback, {target: el, offset: ['start end','end start']}) (3.8 KB gz measured) and write the value into a motion value that feeds uniforms (recommendation 6).
7) Pitfalls: iOS Safari dynamic toolbar changes innerHeight during scroll - size the canvas with dvh once and on orientationchange only, not on every resize event; keep the canvas pixel size capped (recommendation 3); set will-change:transform on the canvas only (not on content); if a stage must sit under sticky/transform ancestors, measure its rect from the DOM, not from layout math. Fallback if a section's canvas edge clipping is visible in review: raise --pad to 35dvh or render that stage to a framebuffer and fade the edges (Lusion's second option).

**Libraries:** three@0.187.0, @types/three@0.187.0, motion@14.12.0

**Licence:** three MIT; motion MIT. Lusion WebGL-Scroll-Sync is MIT (pattern only, no code needed).

**Cost/risk:** Bundle: a minimal graph (WebGLRenderer, Scene, OrthographicCamera, Mesh, ShaderMaterial, PlaneGeometry) bundles to 534 KB raw / 133.6 KB gzip with esbuild --minify (measured today); a real scene with more classes will be larger, so load it lazily after LCP (the existing VisualStage already does). Risk: one shared canvas means one context loss kills every stage - handle webglcontextlost/restored once centrally and fall back to CSS posters. Risk: Lusion states the method is 'imperfect' (clipping on fast scroll) - the padding is the mitigation. Not tested here on real iOS/Android hardware.

**Sources:** https://github.com/lusionltd/WebGL-Scroll-Sync (README and src/js/main.js read) https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_multiple_elements.html https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/ https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md lenis@1.3.27 dist/lenis.mjs (installed and read) https://tympanus.net/codrops/2026/07/08/ten-years-away-designing-an-interactive-comic-for-studio375s-tenth-anniversary/ https://motion.dev/docs/scroll

## [must] 2. One reusable full-width horizontal timeline: fit-to-width on desktop, native overflow-x scroller on phones, canvas ruler under real DOM controls

**What:** Build a single <HorizontalScale> primitive and use it for every timeline on the site (hero career scale, experience, any dated sequence). Desktop (>= 1024 px): the whole 2010-2026 axis is fitted to the full browser width, edge to edge, no horizontal scrolling needed; ticks and mono numerals are drawn from d3-scale's scaleTime; roles are DOM buttons positioned by the scale; a WebGL strip behind them draws the ruler, a spring-smoothed playhead that follows the pointer, and a lens that gently magnifies the years near the playhead. Phones/narrow: the same component becomes a native horizontal scroller (overflow-x:auto, scroll-snap-type:x proximity, overscroll-behavior-x:contain) at about 96 px per year, with native inertia. The vertical wheel is never remapped to horizontal.

**Why:** Satisfies the owner's binding rule (horizontal, full browser width) without scroll-jacking. The only chronological site I opened that goes horizontal, ten.375.studio, does it by hijacking vertical scroll (document height = viewport, Lenis) and its LCP element was a loader counter at 2.0 s with 32 MB transferred; its horizontal composition is the idea worth keeping, its mechanism is not. Fit-to-width is possible because the data is small (8 roles, 16 years): at 1440 px that is 90 px per year, at 2560 px 160 px per year, so the ruler can show every year as a major tick with mono numerals and quarter ticks as minor ticks, which is also the site's signature motif.

**How:** Layout without the 100vw scrollbar bug: define the page grid with named full-bleed tracks and put the timeline in the full track, never use width:100vw.
  .page{display:grid;grid-template-columns:[full-start] minmax(var(--gutter),1fr) [content-start] min(72rem,100% - 2*var(--gutter)) [content-end] minmax(var(--gutter),1fr) [full-end]}
  .page>*{grid-column:content} .page>.bleed{grid-column:full}
Scale: const x = scaleTime().domain([new Date(2010,0,1), new Date(2026,11,31)]).range([pad, width - pad]); rebuild in a ResizeObserver callback (not on window resize). Lanes: pack overlapping roles greedily by start date into the fewest lanes; role block left = x(start), width = x(end) - x(start), min width 44 px, label inside only if it fits else on the anchored hover card.
DOM: <ol class=scale role=list> with one <li><button aria-pressed> per role; roving tabindex, ArrowLeft/ArrowRight move between roles, Home/End jump to first/last; Enter/Space selects; selection state drives a detail panel. All content stays in the DOM and readable without WebGL (the canvas is aria-hidden decoration).
Canvas strip: one fullscreen-quad ShaderMaterial that draws minor/major ticks analytically with anti-aliasing from fwidth (crisp at any DPR, no geometry): uniforms uYears (vec2 start/end as decimal years), uWidthPx, uPlayhead (0..1), uLens (0..1). Numerals stay DOM (Geist Mono, tabular-nums) so they are selectable and sharp.
Playhead: pointermove sets a motion value px; const smooth = springValue(px, {stiffness: 300, damping: 30, mass: 0.6}); bind with threeEffect(material.uniforms, { uPlayhead: smooth }) (see recommendation 6). On leave/blur/hidden tab ease the playhead to the selected role (HAOQI's PointerBus returns to centre instead of jumping from a stale coordinate).
Selection transition: a single <m.div layoutId="role-marker"> moves between roles; the detail panel swaps with <AnimatePresence mode="wait" initial={false}>. Role hover card: CSS anchor positioning (anchor-name: --role-N on the button; the card gets position-anchor: --role-N; position-area: top span-right; position-try-fallbacks: flip-block, flip-inline) as an enhancement, with the always-visible detail panel as the fallback.
Phone: .track{overflow-x:auto;scroll-snap-type:x proximity;overscroll-behavior-x:contain;scroll-padding-inline:var(--gutter)} .inner{width:max(100%, calc(16 * 96px))}; role buttons get scroll-snap-align:start. Put layoutScroll on the scroller if motion layout animations run inside it. Optional desktop grab-to-pan for 1024-1279 px: <m.div drag="x" dragConstraints={ref} dragElastic={0.08} dragTransition={{power: 0.3, timeConstant: 300, bounceStiffness: 400, bounceDamping: 40}}> (prop names verified in motion-dom d.ts; numbers are starting points to tune).
Figures: the warm --proof colour only on measured figures; the ATO -92% marker sits at its real date on the axis.
Checks to automate: at 1280, 1440, 1920 and 2560 px wide the track's bounding box width equals the viewport width minus the vertical scrollbar, document.scrollWidth equals clientWidth, every role is reachable by keyboard, and no role block overlaps another.

**Libraries:** d3-scale@4.0.3, motion@14.12.0, three@0.187.0

**Licence:** d3-scale ISC (already in the repo); motion MIT; three MIT.

**Cost/risk:** Low runtime cost: one quad shader, 8 buttons. Risk: label collisions at 1024 px for short roles - solve with lanes and the hover card, test with a screenshot at 1024. Risk: `position-anchor` is only spec-compliant in Chrome 151+, Safari 27, Firefox 151 per MDN BCD (earlier Chrome 125-150 had a non-standard initial value), so always set position-anchor explicitly and keep the fallback panel. Risk: layout animations are blocked during horizontal window resize (motion docs) - expected, the scale rebuild handles resize.

**Sources:** https://tympanus.net/codrops/2026/07/08/ten-years-away-designing-an-interactive-comic-for-studio375s-tenth-anniversary/ https://motion.dev/docs/react-layout-animations https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning https://github.com/d3/d3-scale node_modules/@mdn/browser-compat-data 8.1.8 (css.properties.position-anchor, anchor-name, position-area)

## [must] 3. Stage governor: quality tiers, software-GL detection, render-on-demand, and a hero whose text stays the LCP

**What:** Wrap every WebGL visual in one governor that picks a tier at runtime and can drop it live: tier 3 full (DPR <= 1.5, post-processing on hero), tier 2 (DPR 0.75, no post), tier 1 (render one frame on state change only, no loop), tier 0 (CSS poster, no WebGL). Inputs: prefers-reduced-motion, software renderer detection, saveData, a frame-time monitor, webglcontextlost, tab visibility, section visibility. Offer a visible Quality control (Auto / Low) like Bruno Simon's site. The hero h1 and lede are server-rendered, visible with no JS, and nothing delays them.

**Why:** Evidence from the sites I ran in headless Chrome with SwiftShader (the repo's Playwright setup): award-level sites do not degrade. shader.se (Awwwards SOTD 2026-04-20, Dev Award 8.12, animations/transitions 9.40) timed out taking a screenshot after 30 s and accumulated 217 s of long tasks in the reduced-motion run, rAF p50 7 s; only 1 of 16 JS chunks even mentions prefers-reduced-motion; ten.375.studio ran at p50 frame 600 ms, haoqi.design 1400 ms, trionn.com 583 ms; corentinbernadou.com was the lightest at 67 ms with 1 s of total long tasks. Your test environment is software GL, so the governor is not optional: it is what lets the Playwright suite stay green and what protects mid-range phones. Reduced motion is also mishandled by the references: Trionn only slows the symbol's rotation (0.0015 vs 0.0042 rad/frame) instead of stopping it. LCP evidence: the LCP element on ten.375.studio, corentinbernadou.com and trionn.com was a loader counter ('0', '0%') or a logo image, not the headline; haoqi.design reported no LCP candidate within 3.5 s on desktop and a 9.8 s text LCP on the emulated phone; Trionn measured CLS 0.20-0.23 (threshold 0.1). The owner requires hero text to be the LCP, so avoid loaders and opacity-gated text.

**How:** Governor API (one module, one instance):
  type Tier = 0|1|2|3;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl2', {powerPreference:'high-performance', antialias:false, stencil:false, depth:false, failIfMajorPerformanceCaveat:false});
  const ext = gl?.getExtension('WEBGL_debug_renderer_info'); const rend = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
  const software = /swiftshader|llvmpipe|software/i.test(rend);
  const saveData = (navigator as any).connection?.saveData === true; // Chrome only, so treat as a hint
  let tier: Tier = !gl ? 0 : (reduced || software || saveData) ? 1 : (isCoarsePointer && lowMemory) ? 2 : 3;
  Frame monitor: after 45 frames compute the median dt; > 24 ms -> tier-1 step down; sample again every 2 s with hysteresis (never step up more than once per session). Step order: DPR 1.5 -> 1.0 -> 0.75 -> drop post -> one-frame mode -> poster.
  DPR cap: renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)) (Studio375 shipped 1.5 plus drei AdaptiveDpr; the existing VisualStage caps at 1280x720 pixels, keep that cap as a floor).
  Render on demand (Trionn): a section renders only while within one viewport of the screen AND something is still settling (hover easing, spring not at rest); when springs report isAnimating false and scroll velocity is 0, stop the loop and wait for the next input. Reduced motion = tier 1: draw the 'still frame' once (HeroField already uses STILL_FRAME), no loops, no scroll-linked uniforms, no pointer reactivity.
  Pause hooks: IntersectionObserver (already in VisualStage), document.visibilitychange, and for content-visibility:auto sections the contentvisibilityautostatechange event (Chrome 108, Safari 18, Firefox 130).
  Context loss: canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); setTier(0); }); on 'webglcontextrestored' rebuild textures and return to the previous tier.
  Ambient loops longer than 5 s need a pause mechanism (WCAG 2.2.2, level A): give the stage a visible pause toggle or stop ambient drift after 5 s.
  Test hook: `?stage=0|1|2|3` forces a tier so Playwright can assert each path; default in tests is the detected tier (1 on SwiftShader).
LCP/CLS guardrails for the hero:
  - h1 and lede are plain SSR text with fonts preloaded (Geist only, adjustFontFallback on) and a reserved box; no loader screen, no preloader counter.
  - Entrance animation must never start from opacity:0 on the LCP text via JS after hydration; use a CSS-only animation (keyframes on transform, filter blur <= 6 px, clip-path) defined in the stylesheet so the text is painted in the first frame. Whether a clip-path or blur start counts as an LCP paint is unverified - add a Playwright test that records the largest-contentful-paint entry via PerformanceObserver and asserts entry.element is the h1 (or its text node) and startTime <= 2500 ms under SwiftShader without WebGL (?stage=0).
  - The canvas fades in over the CSS poster after idle (requestIdleCallback is not in Safari; use scheduler.postTask where present else setTimeout 200).
  - Reserve every stage's height in CSS (aspect-ratio or fixed clamp) so mounting never shifts layout; CLS budget 0.05.

**Libraries:** three@0.187.0, web-vitals@6.2.3

**Licence:** three MIT; web-vitals Apache-2.0 (verify with npm view; used for tests only).

**Cost/risk:** UNMASKED_RENDERER can be masked by privacy settings (Firefox, some Safari modes), so software detection is a hint; the frame monitor is the real safety net. navigator.connection and deviceMemory are Chrome-only (MDN BCD), so never gate core behaviour on them. The governor is about 150 lines and removes the need for the third-party detect-gpu (5.0.70), whose benchmark data is fetched from a CDN by default and would violate the CSP unless self-hosted. Frame-time thresholds are my starting values, not sourced.

**Sources:** Headless probe run on 2026-11-10 (Playwright-core, system Chrome, SwiftShader flags from the repo's playwright.config.ts) against shader.se, ten.375.studio, haoqi.design, trionn.com, corentinbernadou.com https://github.com/brunosimon/folio-2025 (sources/Game/Quality.js, Rendering.js) https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/ https://tympanus.net/codrops/2026/07/08/ten-years-away-designing-an-interactive-comic-for-studio375s-tenth-anniversary/ https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html https://postprocessing.js.org (README powerPreference/antialias settings)

## [must] 4. A written, checkable motion system: tokens, durations, easing, stagger, staging, and a list of amateur tells

**What:** Define motion once as tokens and use them everywhere (CSS, motion/react, GLSL uniforms). Adopt the numeric rules below as the review contract. Time-based motion for entrances and state changes; scroll-linked motion only for things that represent position or progress.

**Why:** Premium motion is mostly restraint and consistency. The numbers below combine sourced values (NN/g, Material 3 tokens read from the @material/web package, Emil Kowalski, and measured values from the Trionn, HAOQI and Corentin Bernadou case studies) with a few labelled house rules. A reviewer can check every one of them with a grep or a frame strip.

**How:** Tokens (CSS custom properties in globals.css, mirrored in lib/motion.ts so JS and GLSL read the same numbers):
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);       /* Material 3 standard/emphasized in the shipped tokens */
  --ease-decel: cubic-bezier(0.05, 0.7, 0.1, 1);      /* M3 emphasized-decelerate: entrances */
  --ease-accel: cubic-bezier(0.3, 0, 0.8, 0.15);      /* M3 emphasized-accelerate: exits */
  --d-feedback: 100ms; --d-ui: 200ms; --d-panel: 300ms; --d-reveal: 600ms; --d-scene: 900ms; (M3: short2 100, short4 200, medium2 300, long4 600, extra-long3 900)
Rules (R = sourced, H = house rule):
 1 (R) Feedback 100 ms; small UI 150-250 ms; panels 200-300 ms; nothing in the UI over 400 ms; 500 ms starts to feel like a drag (NN/g); under 300 ms for UI (Emil Kowalski).
 2 (R) Editorial reveals are longer: 500-800 ms with a decelerating curve (Trionn chars 0.8 s power2.out; Corentin 0.5 s power3.out; HAOQI image 'develop' 0.8 s).
 3 (R) Enter slightly longer than exit (NN/g example 300 ms in, 200-250 ms out); enter on decel curve, exit on accel curve; never `linear` except for scroll-progress mapping and spinners.
 4 (R) No entrance from scale(0): start at 0.93-0.97 plus opacity (Emil Kowalski uses 0.93 and a 0.97 pressed state).
 5 (R) Frequency rule: the more often an interaction happens, the shorter/subtler; hover effects on elements used constantly get no motion beyond colour.
 6 (R+H) Stagger 60-80 ms per item (Trionn 80 ms; repo DESIGN.md says 60-80), H: cap the total stagger window at 480 ms (so at most ~8 items; beyond that group them). Ordered data (timeline roles, years) staggers from the start in reading/chronological order; random-order stagger only on decorative glyph reveals (Trionn from:'random').
 7 (H) Staging: one primary mover per beat. Secondary elements start when the primary reaches ~60% of its duration (overlap) and have <= 50% of its amplitude. Hero sequence: h1 painted on frame 1 (see rec 3), supporting items entering between 150 ms and 900 ms, whole sequence settled by 1.6 s.
 8 (R+H) Anticipation and settle use springs only for physical objects (markers, magnetic targets, tilt): Magic UI's card uses stiffness 250, damping 30, mass 0.6; motion docs example bounce 0.25. H: overshoot <= 4%, no bounce on text or opacity.
 9 (H) Scroll-linked (scrubbed) motion only for progress/position (ruler marker, progress line, the timeline lens) and parallax <= 8% of viewport height; body copy reveals are one-shot time-based (once), not scrubbed and not replayed on scroll-up.
10 (R) Velocity-linked effects are smoothed and clamped: HAOQI uses attack tau 0.025 s, release tau 0.175 s, dt clamped to [1/240, 0.1] and a maximum curl of 0.06; Lusion decays strength with exp(-dt*10) and caps it at 5 before clamping to 1.
11 (H) Loops: ambient drift is allowed only behind or beside text, at <= 0.12x shader time (the repo's DRIFT_SPEED), paused off-screen/hidden/reduced-motion, and stoppable after 5 s (WCAG 2.2.2). Never loop anything that carries information.
12 (R) Reduced motion means stop, not slow: keep opacity/colour changes, remove transform, layout and canvas motion (motion's MotionConfig reducedMotion="user" does this for transforms/layout already).
Amateur tells to fail in review: a different duration on every component; `transition: all`; animating width/height/top/left (use transform/opacity; the layout prop animates with transforms); the same 'fade up 20 px' on every block; everything staggering at once; scale(0) pops; bounce on type; scrubbed opacity on paragraphs; parallax speed differences that change reading position; scroll-jacked speed; replaying reveals on every scroll direction; a loader before content; dark-gradient banding (no dither); DOM and canvas visibly out of step by a frame; cursor followers lagging more than ~150 ms; will-change left on permanently (Trionn removes it after the animation); late-font layout shift (Trionn measured CLS 0.2).
Mechanical checks: grep CSS/TSX for durations not in the token set, for `transition: all`, for cubic-bezier outside tokens, for `animate={{ width|height|top|left`; a vitest asserting lib/motion.ts equals the CSS tokens.

**Libraries:** motion@14.12.0

**Licence:** motion MIT. Material tokens are Apache-2.0 (@material/web).

**Cost/risk:** No runtime cost. Risk is review drift: enforce through the lint/grep checks and the scorecard. Rules marked H are my judgement, not published standards.

**Sources:** https://www.nngroup.com/articles/animation-duration/ @material/web package, tokens/versions/latest/sass/_md-sys-motion.scss (read from the npm tarball) https://emilkowal.ski/ui/7-practical-animation-tips https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/ https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/ https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/magic-card.tsx https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html

## [must] 5. Objective quality harness: deterministic frame strips, pacing, long-animation-frames, web-vitals and a theme x width screenshot matrix

**What:** Add a Playwright 1.65 project set that (a) steps the animation clock deterministically and writes a frame strip per key moment, (b) measures frame pacing, long tasks/LoAF, CLS, LCP element and INP, (c) compares screenshots across dark/light and 390/820/1024/1440/2560 px, with reduced motion on and off, and (d) asserts that nothing animates when it should be idle.

**Why:** Smoothness and finish need numbers a reviewer can compare run to run. In this repo's environment (headless Chrome on SwiftShader) absolute fps is meaningless - I measured p50 frame times of 50 to 7000 ms on production WebGL sites - so budgets must be relative (this build vs last build) and structural (loop stops when idle, tier-1 path, no layout shift) rather than 60 fps targets. Playwright's page.clock fakes requestAnimationFrame, requestIdleCallback, performance and Date, so animation can be advanced frame by frame for exact, repeatable captures.

**How:** 1) Upgrade @playwright/test and playwright from 1.57.0 to 1.65.0 (npm registry latest today). Useful additions: WebP snapshots (1.62), standalone testOptions.reducedMotion/forcedColors/contrast (1.63), perfetto reporter (1.63), screencast fps option (1.64). Note 1.64 made device-descriptor `screen` apply (breaking; set screen: undefined to opt out).
2) Deterministic frame strip:
  await page.clock.install({ time: 0 }); await page.goto('/?stage=1&capture=1'); await page.clock.pauseAt(1000);
  for (let i = 0; i < 36; i++) { await page.clock.runFor(1000/60*2); await page.screenshot({ path: `strips/hero/${String(i).padStart(3,'0')}.png`, clip }); }
  then `ffmpeg -framerate 12 -pattern_type glob -i 'strips/hero/*.png' -vf tile=6x6 strips/hero.png` (ffmpeg and ImageMagick montage are installed on this machine). The reviewer reads the easing curve and staging off the strip. The stage must expose window.__stage = { renderOnce(), setTime(ms) } under ?capture=1 so canvas time follows the fake clock (the loop uses performance.now/rAF, which the fake clock drives).
3) Pacing and main-thread health (inject via page.addInitScript, report in test.info().attach): rAF delta histogram (p50, p95, count > 33 ms), PerformanceObserver for 'layout-shift' (sum without hadRecentInput), 'largest-contentful-paint' (assert element is the hero h1), 'longtask' and, on Chrome only, 'long-animation-frame' (Chrome 123+, not Safari/Firefox per MDN BCD). INP: import { onINP } from 'web-vitals/attribution' (web-vitals 6.2.3), drive real interactions with locator.hover()/click()/keyboard, read attribution.longAnimationFrameEntries for the offending script. Budgets (existing DESIGN.md): LCP <= 2.5 s, CLS <= 0.05, INP <= 200 ms, no long task > 50 ms during scroll after hydration. Compare to the previous build's JSON, fail on > 20% regression (my threshold).
4) Idle assertions: wrap window.requestAnimationFrame to count callbacks; with all stages scrolled out of view or reduced motion on, assert the count over 2 s is <= a small constant (the loop is stopped). Assert prefers-reduced-motion run has zero canvas time advance (capture two screenshots 1 s apart under the fake clock, they must be identical).
5) Screenshot matrix: projects desktop-1440, wide-2560, laptop-1024, tablet-820, phone-390 (hasTouch, isMobile); colorScheme dark/light; reducedMotion on/off. Use expect(page).toHaveScreenshot({ animations: 'disabled', maxDiffPixelRatio: 0.002, mask: [canvasLocator] }) for layout, and a separate canvas test at ?stage=1 with a fixed clock time and a looser threshold (SwiftShader output is deterministic on the same machine, not across machines). Timeline checks at each width: bounding box width equals viewport width, scrollWidth equals clientWidth, every role focusable.
6) Lighthouse 13.6.0 (or @lhci/cli 0.16.0) against `serve out/` for LCP/CLS/TBT with mobile throttling as a second opinion; treat its performance score as secondary to the Playwright budgets.
7) Real-hardware pass: run the same pacing script on a real GPU machine and a mid-range Android phone before sign-off; record p95 frame time per section. No such device was available in this research.
8) Perfetto: enable the perfetto reporter to inspect long frames when a budget fails.

**Libraries:** @playwright/test@1.65.0, playwright@1.65.0, web-vitals@6.2.3, lighthouse@13.6.0, @lhci/cli@0.16.0, pixelmatch@8.0.0, ssim.js@3.5.0

**Licence:** Playwright Apache-2.0; web-vitals Apache-2.0; Lighthouse Apache-2.0; @lhci/cli Apache-2.0; pixelmatch ISC; ssim.js MIT (all via npm view today).

**Cost/risk:** Dev-only. CI time grows with the matrix; run the full matrix nightly and a smoke subset on every push. SwiftShader makes WebGL screenshots slow (several seconds each). Playwright 1.57 to 1.65 crosses eight minor versions; run the existing suite first and read the 1.64 `screen` change. LoAF is Chrome-only, so Safari/Firefox regressions are not caught by this harness.

**Sources:** https://playwright.dev/docs/clock https://github.com/microsoft/playwright/releases (1.59.1 to 1.65.0 notes read) https://web.dev/articles/find-slow-interactions-in-the-field node_modules/@mdn/browser-compat-data 8.1.8 (api.PerformanceLongAnimationFrameTiming: Chrome 123 only) npm registry via npm view on 2026-11-10

## [should] 6. motion 14 wiring: springs and scroll drive WebGL uniforms through motion/three, scoped domMax for layout, and the right AnimatePresence mode

**What:** Use motion's built-in Three.js binding so DOM, springs and uniforms share one value graph: register threeEffect once, create motion values, smooth them with springValue, bind them to uniforms or objects, write in frame.preRender and render in frame.render. Keep LazyMotion with `m` and domAnimation globally (reveals, presence); scope domMax (layout, drag) to the timeline and capabilities islands only.

**Why:** motion 14.12.0 ships `motion/three` (threeEffect) and `motion/vgpu` as package exports - found by reading the installed package; the docs page https://motion.dev/docs/three confirms the API. It removes the usual hand-written lerp/useFrame glue and guarantees a single ordering: values update in frame.preRender, your render runs in frame.render, so a uniform never lags a frame behind the spring that drives it. Measured sizes (framer-motion size-rollup files, gzip): `m` alone 4.9 KB, m + domAnimation 30.2 KB, m + domMax 44.7 KB, scroll() 3.8 KB, animate() 25.2 KB.

**How:** Setup (client-only module, loaded with the stage chunk):
  import { animate, motionValue, springValue, frame } from 'motion';
  import { scroll } from 'motion';
  import { threeEffect } from 'motion/three';
  animate.addEffect(threeEffect);            // lets animate() target meshes, materials, uniforms
  const progress = motionValue(0);
  const smooth = springValue(progress, { stiffness: 120, damping: 24 });   // or { visualDuration: 0.7, bounce: 0.25 } via animate()
  const stopBind = threeEffect(material.uniforms, { uProgress: smooth });  // returns cleanup
  const stopScroll = scroll((p) => progress.set(p), { target: sectionEl, offset: ['start end', 'end start'] }); // returns cleanup
  frame.render(() => renderer.render(scene, camera), true);               // keepAlive true; written values land in preRender
Details verified in motion/dist/es/three.mjs: transforms use the HTML shorthands x, y, z, rotateX/Y/Z (degrees, converted to radians), scaleX/Y/Z, scale; a key matches a uniform name directly (uProgress -> uniforms.uProgress.value); vector uniforms animate per axis with an X/Y/Z/W suffix (uPointerX -> uniforms.uPointer.value.x); Color properties accept CSS strings; TSL uniform nodes are found via material.colorNode etc. Direct imperative use: animate(material.uniforms, { uLens: 1 }, { type: 'spring', visualDuration: 0.6, bounce: 0.2 }) after addEffect.
Themes: animate(material.uniforms, { uBg: tokens.bg, uAccent: tokens.accent }, { duration: 0 }) inside the theme-change callback (see recommendation 7).
React side (global): <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">...</MotionConfig></LazyMotion> and the `m` components. Island: <LazyMotion features={() => import('./domMax').then(m => m.domMax)} strict> around the timeline and capabilities lists only; layout and drag require domMax (verified: features-max.mjs = domAnimation + drag + layout).
Layout: <m.div layout> animates with transforms, so layout changes must come from className/style; use layout="position" for text/images that change aspect; layoutId for the shared role marker; <LayoutGroup id="experience"> when siblings re-render separately; layoutScroll on scroll containers (the phone timeline scroller); layoutRoot inside position:fixed. Corrected only when set via style/animate: borderRadius and boxShadow. Not supported: SVG layout animations, inline elements.
AnimatePresence: mode="wait" swaps the single role-detail child (one child only); mode="popLayout" for the capabilities filter so exiting tiles leave the flow immediately and siblings reflow (children must forward a ref); default "sync" for toasts; initial={false} to skip first-render entrances; usePresenceData with `custom` to pass direction (earlier/later role) to exits.
Other verified exports worth using: useScroll / useSpring / useTransform / useMotionValueEvent / useVelocity / useMotionTemplate (radial-gradient pointer spotlight), useFollowValue and followValue (value that follows a source), useAnimationFrame, hover() and press() (vanilla), inView(), stagger(), animateView() (rec 7). The <AnimateView> React component in motion/react-animate-view requires React 19.3+ (its own doc comment); the site is on 19.2.8, so use the vanilla animateView() or raw startViewTransition.

**Libraries:** motion@14.12.0, three@0.187.0

**Licence:** MIT

**Cost/risk:** Global shell stays about 30 KB gz (m + domAnimation); the domMax island adds about 14.5 KB gz and only loads with the experience/capabilities chunk. threeEffect writes every frame for bound values (cheap, but unbind when the stage stops: call the cleanup functions in the stage's dispose). Risk: motion/three is new surface area with thin docs; pin the exact version 14.12.0 and add a unit test that a spring-bound uniform reaches its target.

**Sources:** https://motion.dev/docs/three motion@14.12.0 dist/es/three.mjs, vgpu.mjs and framer-motion features-max.mjs (read from the installed package) https://motion.dev/docs/scroll https://motion.dev/docs/react-animate-presence https://motion.dev/docs/react-layout-animations https://motion.dev/docs/animate-view framer-motion@14.12.0 dist/size-rollup-*.js (gzip measured)

## [should] 7. View Transitions: circular theme reveal and keyed list reorder, with a canvas-safe update callback

**What:** Use same-document View Transitions for (1) a circular theme reveal from the toggle button and (2) animated reorder/filter of the capabilities list. Both degrade to an instant change where the API is missing or reduced motion is set.

**Why:** Same-document startViewTransition is in all three current stables per MDN BCD 8.1.8: Chrome 111, Safari 18, Firefox 144; the options-object form (types) is Chrome 125, Safari 18.2, Firefox 147; view-transition-name: match-element is Chrome 137, Safari 18.4, Firefox 144; view-transition-class is Chrome 125, Safari 18.2, Firefox 144. It replaces a lot of JS FLIP code. The WebGL-specific trap: the new-state snapshot is taken right after your update callback, so a canvas that only recolours on the next rAF will show the old theme inside the 'new' snapshot (a visible flash).

**How:** Theme reveal:
  async function setTheme(next: 'dark'|'light', x: number, y: number) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => {
      flushSync(() => applyTheme(next));      // sets data-theme + React state
      stageHost.setThemeUniforms(next);       // write uniforms synchronously
      stageHost.renderOnce();                 // draw one frame NOW so the snapshot has the new colours
    });
    await t.ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(0.2, 0, 0, 1)', pseudoElement: '::view-transition-new(root)' });
  }
CSS: ::view-transition-old(root), ::view-transition-new(root){ animation:none; mix-blend-mode:normal; } ::view-transition-old(root){ z-index:0 } ::view-transition-new(root){ z-index:1 }
Origin = the toggle's centre (getBoundingClientRect). Keep the transition <= 700 ms: the page is a non-interactive snapshot while it runs.
List reorder (capabilities filter/sort): give each tile a unique name only for the duration of the transition, or use the shared CSS: .cap{ view-transition-name: match-element; view-transition-class: cap } and ::view-transition-group(*.cap){ animation-duration: 450ms; animation-timing-function: var(--ease-standard) }. Trigger: document.startViewTransition(() => flushSync(() => setFilter(f))). Motion's vanilla wrapper does the naming for you: animateView(update).add('.cap-tile').layout({ duration: 0.45 }) (docs example; add() assigns a unique view-transition-name and removes it afterwards, and queues interrupted animations instead of snapping). Theme toggle alternative from the same docs: animateView(update, { duration: 0.4 }).old({ opacity: 0 }).new({ opacity: 1 }).
React's <ViewTransition> (react.dev) exists in 19.3 builds, needs startTransition/Suspense to trigger, and React then owns startViewTransition; React 19.3.1 is latest, but whether Next 15.5 (vendored React) exposes it is unverified, so do not depend on it.
Guard everything with `if (!document.startViewTransition)` and the reduced-motion query; skip when the stage tier is 0 (nothing to snapshot).

**Libraries:** motion@14.12.0

**Licence:** Platform API; motion MIT.

**Cost/risk:** Each named element is a separate snapshot layer; keep named tiles to a few dozen (the exact degradation point is unverified). Full-page snapshots of a large canvas cost GPU memory briefly. Pointer input is blocked during the transition. The React `flushSync` inside the callback is the supported pattern for sync DOM updates.

**Sources:** https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API node_modules/@mdn/browser-compat-data 8.1.8 (api.Document.startViewTransition and css.properties.view-transition-name/-class) https://motion.dev/docs/animate-view https://react.dev/reference/react/ViewTransition

## [should] 8. CSS platform layer: use scroll-driven animations, @property, sibling-index staggers, offset-path, popover and content-visibility; skip scroll-state, interpolate-size, speculation rules and worker canvas for now

**What:** A per-feature verdict, with current support from MDN browser-compat-data 8.1.8 (2026-11-02; current stables are Chrome 156, Firefox 159, Safari 27.2) and what to build with each.

**Why:** The platform now covers most DOM choreography natively, off the main thread, which protects INP and keeps the canvas loop free. Scroll-driven animations just became cross-browser: Firefox 159 shipped on 2026-10-27, which makes `animation-timeline` available in all three current stable engines.

**How:** USE:
- CSS scroll-driven animations (animation-timeline: scroll() | view(), animation-range, view-timeline-name, timeline-scope): Chrome 115, Safari 26, Firefox 159. Use for ruler-tick growth, section progress line, figure/rule reveals, parallax <= 8%. Pattern: @media (prefers-reduced-motion: no-preference){ @supports (animation-timeline: view()){ .reveal{ animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; } } } with content fully visible by default (no opacity:0 in base CSS). Use timeline-scope when a stage canvas needs to react to a DOM element's view timeline. Fallback for older engines: motion scroll(). Optional, unverified: new ViewTimeline({ subject }).currentTime read inside the rAF loop to avoid layout reads.
- @property (Chrome 85, Safari 16.4, Firefox 128): register --a (angle) for a conic-gradient border light, --mx/--my (length) for the pointer spotlight, --p (number) as a scroll/hover progress channel; animate registered properties in CSS instead of JS. e.g. @property --a{syntax:'<angle>';inherits:false;initial-value:0deg} and a border-light that only animates on :hover/:focus-visible (loops rule).
- sibling-index() (Chrome 138, Safari 26.2, Firefox 154): stagger without JS: animation-delay: calc(sibling-index() * 60ms) for <= 8 siblings.
- offset-path/offset-distance (Chrome 55, Safari 15.4/16, Firefox 72): move the 'now' marker along an SVG path() on the ruler/curve; drive offset-distance with animation-timeline: view(). Avoid ray().
- Popover API (Chrome 114, Safari 17, Firefox 125; iOS 18.3 for the JS API): popover="auto" with popovertarget for the nav menu, assistant panel and role detail on phones; combine with @starting-style (Chrome 117, Safari 17.5, Firefox 129) and transition-behavior: allow-discrete for JS-free enter/exit. Gives light dismiss, top-layer and focus handling for free.
- CSS anchor positioning (anchor-name Chrome 125/Safari 26/Firefox 147; position-area Chrome 129/Safari 26/Firefox 147): role hover cards on the timeline, with the fallback panel. Always declare position-anchor explicitly (spec-compliant from Chrome 151, Safari 27, Firefox 151).
- content-visibility: auto with contain-intrinsic-size: auto <height> (Chrome 85, Safari 18, Firefox 125) on below-the-fold sections; use `auto` so the last rendered size is remembered (prevents CLS); contentvisibilityautostatechange event (Chrome 108, Safari 18, Firefox 130) can start/stop stages. Do not apply to the hero or to a section whose stage rect you measure at load.
- scrollend event (Chrome 114, Safari 26.2, Firefox 109): re-measure stage rects once after scrolling settles.
SKIP / LATER:
- interpolate-size / calc-size: Chrome 129 only (BCD: experimental). Optional progressive enhancement for the 'known limits' disclosure (interpolate-size: allow-keywords on :root); other engines use motion layout.
- Scroll-state container queries (container-type: scroll-state): Chrome 133 only. Skip, or use for a 'stuck header' shadow with a plain fallback.
- Speculation rules: Chrome 109 only (Safari behind a flag, Firefox preview). The site is effectively one page; skip. An inline speculationrules script would also need the 'inline-speculation-rules' CSP source (unverified).
- OffscreenCanvas WebGL in a worker (OffscreenCanvas.getContext webgl: Chrome 69, Safari 17, Firefox 105): supported, and three ships webgl_worker_offscreencanvas plus three/addons/offscreen/*. Defer: it needs a module worker from 'self' (allowed by the current worker-src 'self'), pointer/resize proxying, a separate loader path, and is hard to test on SwiftShader. Revisit only if INP attribution shows the main-thread render loop is the culprit. @react-three/offscreen 0.0.8 is stale; do not use it.
- corner-shape: Chrome-only. Skip.

**Libraries:** motion@14.12.0

**Licence:** Platform features; motion MIT.

**Cost/risk:** Safari/Firefox behaviour of scroll-driven animations with sticky elements and with a transformed canvas could not be tested here (only Chrome was available). Anchor positioning had partial-implementation periods in Chrome 125-150 (BCD notes) - keep fallbacks. content-visibility can misreport rect sizes for skipped sections, so measure stage rects only when the section is rendered.

**Sources:** node_modules/@mdn/browser-compat-data 8.1.8 (queried for every feature listed) https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning https://developer.mozilla.org/en-US/docs/Web/API/Popover_API https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_worker_offscreencanvas.html

## [should] 9. Pointer and touch polish that reads as expensive: one pointer bus, springs, ring-constrained light, velocity coupling, with a touch equivalent for each

**What:** A small set of restrained interactions, each with a defined desktop behaviour and touch equivalent, all driven by one PointerBus and the shared motion tokens: magnetic targets (2-3 only), pointer spotlight and border light on cards, spring tilt on the project cards, a pointer-reactive uniform in the stages, and drag-with-inertia where a strip is wider than the screen.

**Why:** The references' polish comes from one coordinate system and well-smoothed values, not from more effects. HAOQI.DESIGN built a global PointerBus (browser coords converted once to UV, an inside flag, return to centre on leave/blur/hidden) after finding every effect repeated the same Y-flip and leave handling; its glass rim light follows the pointer's direction but not its distance (atan2 onto a fixed-radius ring, with shortest-arc angle damping) so the highlight never washes over the face; Trionn eases rotation toward the pointer with a 0.06 lerp and decays hover flashes with *0.92 per frame instead of one tween per mesh.

**How:** Gate: @media (hover: hover) and (pointer: fine) for pointer-only effects (hover/pointer media queries are universal, MDN BCD: Chrome 41/38, Safari 9, Firefox 64); everything else gets the touch equivalent.
- PointerBus: one pointermove listener (use getCoalescedEvents only if you need path fidelity: Chrome 58, Safari 18.2, Firefox 59), writes {x, y, inside, type} once per frame into a shared snapshot and into a mutable Vector2 for WebGL; resets to centre on pointerleave, window blur and visibilitychange.
- Smoothing helper (frame-rate independent): value += (target - value) * (1 - Math.exp(-lambda * dt)); lambda about 6 for camera/light (HAOQI uses 6); angle version wraps the difference with atan2(sin(d), cos(d)) before damping.
- Magnetic target: only the primary CTA, theme toggle and timeline playhead handle. Pull = 0.25-0.35 of the pointer's offset from the centre within 1.4x the target radius, max 10 px; apply to an inner span, not the hit box (the 24 px minimum target stays fixed); useMotionValue + useSpring({ stiffness: 250, damping: 30, mass: 0.6 }) (the values Magic UI's card uses). Touch equivalent: none; instead a pressed state, scale 0.97 over 100-120 ms (Emil Kowalski).
- Spotlight and border light: write pointer position into CSS vars through motion values and useMotionTemplate: background: radial-gradient(240px circle at ${x}px ${y}px, var(--accent-soft), transparent 70%) on a pseudo layer; border light = same gradient on a 1 px padded mask. Keep opacity <= the --accent-soft token. Touch equivalent: spotlight fixed at the card's top edge, brightened while :active; no hover-only information.
- Tilt with spring: rotateX/rotateY = (pointer offset) * 6 degrees max (my number), perspective 800 px, useSpring on both; a faint specular overlay moves opposite. Off for touch and reduced motion. Do not use DeviceOrientation as the touch substitute (iOS permission prompt; not verified here).
- Cursor-reactive shader: pass the PointerBus UV (0..1, Y flipped once) as uPointer; use it to bend the field or shift the light, with the ring constraint above; amplitude <= 10% of the stage. Touch equivalent: drive the same uniform from the touch contact point while pressed and from scroll velocity otherwise.
- Scroll-velocity coupling (works the same on touch): velocity = |dy| / clamp(dt, 1/240, 0.1); target = clamp(velocity / 800, 0, 1); attack tau 0.025 s, release tau 0.175 s; strength 0.06 (HAOQI curl) - apply to image/field skew or ruler tick blur, never to text.
- Drag with inertia: on touch use native overflow-x scroll (native inertia, snap). On desktop where a strip is wider than its box: <m.div drag="x" dragMomentum dragElastic={0.08} dragConstraints={ref} dragTransition={{ power: 0.3, timeConstant: 300, bounceStiffness: 400, bounceDamping: 40 }}> (prop names verified in motion-dom d.ts; defaults: power 0.8). Always keep keyboard and button paths. If you need velocity-aware gestures beyond this, @use-gesture/react 10.3.1 useDrag is available but unnecessary.
- Reduced motion: none of the above moves; focus-visible rings and colour changes remain.
Heavy-handed tells to avoid: a global custom cursor replacing the system cursor, magnetic everything, tilt on every card, hover-only content, effects that run when the pointer is outside the window.

**Libraries:** motion@14.12.0, three@0.187.0, @use-gesture/react@10.3.1

**Licence:** motion MIT; three MIT; @use-gesture/react MIT (optional).

**Cost/risk:** Low. Spring/pointer maths is negligible; the cost is design discipline. Tilt and spotlight pseudo-layers can add compositing cost on low-end phones - they are disabled on coarse pointers, which also removes the cost there. Numeric values here are starting points to tune in review, except the ones attributed to a named source.

**Sources:** https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/ https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/ https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/magic-card.tsx https://emilkowal.ski/ui/7-practical-animation-tips motion-dom@14.12.0 index.d.ts (dragElastic, dragMomentum, InertiaOptions)

## [should] 10. Shader finish and render stack: analytic anti-aliased ruler, dithering against dark banding, a light post stack on the hero only, keep WebGL (not WebGPU), and fix the CSP before adding WASM loaders

**What:** Keep three.js on WebGLRenderer with hand-written GLSL ShaderMaterials. Draw ruler ticks analytically in the fragment shader with fwidth-based anti-aliasing. Add a small dither in the final output of every stage so dark gradients never band. Use the `postprocessing` library (EffectComposer) only for the hero at tier 3. Do not render copy in WebGL. Defer WebGPU/TSL. Fix the CSP expectations before adding KTX2/Draco.

**Why:** Finish is where award sites separate from average ones, and it is cheap: HAOQI uses fwidth(squareDist) for crisp cell edges at any resolution; Giulio renders only the one or two scenes that are visible and adds a noise-masked band transition with a slight RGB split near the centre; the site's design is dark-first with soft radial glows, which is exactly where 8-bit banding shows. WebGPU: Bruno Simon's folio-2025 (three ^0.187.0) and Giulio use it, but for this site it costs more than it returns: I measured a minimal three/webgpu + TSL RenderPipeline at 831 KB raw / 228 KB gzip vs 534 KB / 133.6 KB for the WebGL minimum, WebGPU is not reachable in the headless SwiftShader test setup (it would silently take the WebGL2 fallback), and MDN BCD lists Firefox support as partial. r187 exports both RenderPipeline and PostProcessing from three/webgpu (verified in src/Three.WebGPU.js), so the TSL path can be adopted later.

**How:** Ruler shader (one fullscreen quad, uniforms from the HorizontalScale: uYear0, uYear1, uWidthPx):
  float yr = mix(uYear0, uYear1, vUv.x);
  float aa = fwidth(yr) * 1.0;
  float major = 1.0 - smoothstep(0.0, aa * 1.5, abs(fract(yr + 0.5) - 0.5));          // year ticks
  float minor = 1.0 - smoothstep(0.0, aa * 1.5, abs(fract(yr * 4.0 + 0.5) - 0.5) / 4.0); // quarter ticks
  Tick height from vUv.y; major taller; colours from tokens via uniforms (uLine, uLineStrong, uProof).
Dither (every stage's last write): float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); col += (n - 0.5) / 255.0; (interleaved gradient noise). Pair with the 3-4% DOM noise layer already in DESIGN.md.
Colour management: read palette tokens from computed style once (palette.ts already does), new Color(hex) then keep renderer.outputColorSpace = SRGBColorSpace; recolour on theme change through uniforms (rec 6/7). three's Color.setStyle support for oklch() was not checked - convert tokens to hex at build or use the existing hex palette.
Post (hero only, tier 3): renderer = new WebGLRenderer({ powerPreference: 'high-performance', antialias: false, stencil: false, depth: false }); const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: 0 }); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new EffectPass(camera, new BloomEffect({ mipmapBlur: true, intensity: 0.35, luminanceThreshold: 0.85 }), new NoiseEffect(), new VignetteEffect())); keep renderer.toneMapping at NoToneMapping (postprocessing README) and put ToneMappingEffect last only if you need it. Bloom only on the warm --proof marks; intensities are starting values. Measured: three + EffectComposer + RenderPass + EffectPass + BloomEffect = 596 KB raw / 148 KB gzip (about 14 KB gz over plain three). postprocessing 6.39.6 declares peer three >= 0.168.0 < 0.188.0, so it fits 0.187.0 but blocks a jump to 0.188 until it is bumped.
Transitions between stages: not needed (one section visible at a time). If a hero-to-figures transition is wanted, copy Giulio's approach (two render targets + noise-masked band + velocity-based zoom), but render only the two active scenes.
Text: all copy and numerals stay DOM. If WebGL text is ever needed, troika-three-text 0.53.1 (MIT) with a self-hosted font file via its `font` prop; it uses a blob: web worker (worker-src must allow it) and whether its default font/unicode-data fetches hit a CDN in this version was not verified.
Textures/geometry: the site's visuals are data-drawn, so KTX2/Draco/meshopt are probably unnecessary. If imagery or a model arrives: self-host the Basis transcoder and Draco decoder from /public, set ktx2Loader.setTranscoderPath('/basis/'), and note both are WebAssembly.
CSP: the repo's firebase.json (read today) currently has script-src 'self' 'unsafe-inline' 'unsafe-eval' and worker-src 'self' (no blob:), which differs from the brief ('no eval', workers from 'self' or blob:). If 'unsafe-eval' is removed, WebAssembly (KTX2/Draco) needs 'wasm-unsafe-eval' (MDN: without it WASM is blocked on a page with a CSP; it is narrower than 'unsafe-eval' and 'unsafe-eval' overrides it); blob: workers need worker-src 'self' blob:. Confirm what is actually deployed before relying on either.

**Libraries:** three@0.187.0, postprocessing@6.39.6, troika-three-text@0.53.1, @paper-design/shaders-react@0.0.82

**Licence:** three MIT; postprocessing Zlib; troika-three-text MIT; @paper-design/shaders-react Apache-2.0.

**Cost/risk:** postprocessing adds about 14 KB gz over plain three in my minimal graph, plus a full-resolution half-float buffer: only on tier 3 and only the hero. Half-float framebuffers are unsupported/slow on some mobile GPUs - the governor drops post at tier 2. Banding and dither are only visible on real displays and in 8-bit screenshots; add a reviewer check on a dark gradient crop. WebGPU deferral means no TSL post nodes (bloom, DOF) from three core; revisit when WebGPU is testable in CI.

**Sources:** https://github.com/brunosimon/folio-2025 (sources/Game/Rendering.js: WebGPURenderer, forceWebGL:false, RenderPipeline, bloom) https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/ https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/ https://github.com/pmndrs/postprocessing (README in the installed 6.39.6 package) https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src firebase.json in /home/aetheragent/work/forgotten-mistory esbuild size measurements run 2026-11-10 in a scratch directory

## [should] 11. A 10-point reviewer scorecard with anchors, hard-fail caps and the evidence each score needs

**What:** Score the build on ten criteria from 1 to 10 using the anchors below. Any hard fail caps the overall at 5. A release needs a mean of at least 8 with no criterion under 7.

**Why:** Awwwards weights Design 40%, Usability 30%, Creativity 20%, Content 10% (secondary sources agree; I could not retrieve the official Developer Award rubric). For this site the owner's own rules are the sharper test: horizontal full-width timelines, per-section data visualisation, and readable without WebGL. Each score is tied to an artefact from the harness in recommendation 5 so reviewers argue about evidence, not taste.

**How:** Hard fails (cap at 5): scroll is intercepted or remapped; any timeline is not horizontal or not full width at 1440 and 2560; content unreadable or missing with ?stage=0 (no WebGL) or JS disabled; reduced motion still moves anything non-essential; hero text is not the LCP element; CLS > 0.1; a figure shown without its scope line or the -38% qualifier; a visual not derived from real data.
Criteria, 8 = ship-quality, 10 = studio-quality:
1 First load. 8: h1 painted on first frame, LCP <= 2.0 s under the harness, hero sequence settled <= 1.8 s, no loader, CLS 0. 10: as 8 plus the canvas arrives by crossfade over an identical CSS poster so the swap is undetectable in the frame strip; settled <= 1.2 s.
2 Choreography. 8: every duration/easing from tokens; one primary mover per beat; strip shows decelerating entrances, shorter exits; no amateur tells. 10: overlap and anticipation/settle are visible and deliberate in the strip; the same rhythm repeats across all seven sections.
3 Scroll fidelity. 8: native scroll untouched; DOM and canvas stay aligned in a 60 px/frame fast-scroll test (max 1 px mismatch); no horizontal overflow. 10: zero visible edge clipping; velocity-coupled effect is smooth with a tau-based attack/release; the stage loop stops at rest.
4 Horizontal timelines. 8: edge-to-edge at 1280/1440/1920/2560 with every role visible and keyboard-reachable; phone scroller snaps; no label collisions. 10: ticks are crisp at every DPR; playhead, lens and detail swap feel one system; every other timeline on the site reuses the same component.
5 WebGL finish. 8: no banding on dark gradients, no aliasing on ticks, theme parity between dark and light, no popping on theme change. 10: dither, analytic AA, theme reveal captured correctly in the VT snapshot, bloom/grain restraint judged invisible-until-removed.
6 Interaction polish. 8: hover, focus-visible and press states consistent; every pointer effect has a touch equivalent; focus never hidden. 10: magnetic/spotlight/tilt are felt, not noticed, and never carry information; PointerBus resets cleanly on leave/blur.
7 Data truth. 8: each section's visual is generated from content/ and matches the numbers exactly (axis spans 2010-2026, eight roles at their real dates, 17 capabilities, 6 projects, 3 figures with scope lines). 10: hovering any mark reveals its source field; visual and text can never disagree because both read the same data module.
8 Resilience. 8: tiers 0-3 each verified; reduced motion stops motion; context loss recovers; software GL lands on tier 1 with a green suite. 10: also verified on a real mid-range phone with p95 frame <= 33 ms at tier 3 and an automatic step-down in under 2 s when throttled.
9 Performance. 8: INP <= 200 ms, no long task > 50 ms during scroll after hydration, lazy chunk <= 150 KB gz, DPR capped 1.5. 10: INP <= 100 ms, LoAF clean in the interaction trace, loops provably idle when nothing is visible.
10 Accessibility and type. 8: AA contrast in both themes, 24 px targets, full keyboard parity for timelines and filters, ambient motion pausable, nothing below 13 px. 10: screen-reader walkthrough of the experience timeline reads in chronological order with dates and figures, forced-colors and prefers-contrast handled.
Process: two independent reviewers score from the same artefacts (frame strips, JSON metrics, screenshot matrix); a gap of 2 or more on any criterion triggers a joint review of that artefact. Record scores in the repo next to the build id.

**Libraries:** @playwright/test@1.65.0

**Licence:** Not applicable (process).

**Cost/risk:** Anchors for 10 are aspirational (my definition of studio-quality, calibrated on the references I opened). The Awwwards-style scores seen on listings (SOTD scores 7.5-7.7 overall, Dev Award 8.12 for shader.se) use a different scale and jury process; do not compare directly.

**Sources:** https://awwwards.com/about-evaluation (weights reported by secondary sources) https://www.awwwards.com/sites/shader-development-studio (scores read) https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html docs/DESIGN.md in /home/aetheragent/work/forgotten-mistory (budgets: LCP 2.5 s, CLS 0.05, INP 200 ms)

## Reference sites and repositories

- https://haoqi.design/ (making-of: https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/) — OPENED (page loaded in headless Chrome, article read in full). Signature: a glass 'hello' with two-pass FBO refraction, chromatic dispersion and a theme-aware tint (Beer-Lambert-style transmittance in light mode, Hard Light in dark mode), lit by a rim light constrained to a ring around the glass, plus falling sticker atlas drawn as one InstancedMesh. Motion: project cards are DOM placeholders mirrored by fullscreen meshes (uRect uniform); hover is a dot-matrix reveal growing a square per cell; images 'develop' from negative to positive over 0.8 s as they enter (skipped under prefers-reduced-motion); scroll velocity bends images (curl strength capped 0.06, attack tau 0.025 s, release 0.175 s). Layering: DOM owns text and layout; one fixed canvas owns glass and image effects; Lenis autoRaf disabled and lenis.raf called from R3F's addEffect, with a ScrollBus snapshot read by every consumer. Phone/reduced motion: the author states he would set a mobile performance budget and per-effect shutoffs earlier; in my headless run the reduced-motion context still loaded the canvas, and the emulated phone's text LCP was 9.8 s under software GL. Take: ScrollBus and PointerBus snapshot pattern, rect sampler with staggered refresh, ring-constrained pointer light with dampAngle, tau-based velocity smoothing. Not the Lenis dependency.
- https://trionn.com/ (making-of: https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/) — OPENED (loaded in headless Chrome, article and code read). Signature: a Three.js hero symbol of individually animated panels whose spread is a single scalar explodeAmt fed by scroll, hover and hold; hover charge-ups via raycasting with per-mesh exponential decay (*0.92) instead of tweens; weld-spark lines; Web Audio synthesised sound. Choreography: BlurTextReveal splits the h1 into chars, blur(12px) to 0 over 0.8 s, each: 0.08 s random order, power2.out, delay 1.2 s waiting for the page transition, will-change removed after. Layering: DOM headline above the canvas using mix-blend-mode:difference; Lenis driven from gsap.ticker; vanilla Three (R3F rejected for control of the loop); gsap.matchMedia for desktop vs mobile values; scene helix renders from ScrollTrigger updates and a ticker subscribed only within one viewport while things are settling. Phone/reduced motion: reduced motion only slows rotation (0.0015 vs 0.0042), a pattern not to copy. My headless measurements: native tall page (scrollHeight 25,497), 3 canvases, 1.2 MB JS, LCP element a logo image (1.2-2.3 s), CLS 0.20-0.23. Take: single scalar state machine, render-on-demand ticker, blur-in with GPU-layer cleanup; avoid its CLS and its reduced-motion handling.
- https://ten.375.studio/en (making-of: https://tympanus.net/codrops/2026/07/08/ten-years-away-designing-an-interactive-comic-for-studio375s-tenth-anniversary/) — OPENED (loaded in headless Chrome, article read). Signature: a horizontal, ten-chapter timeline (one chapter per year) drawn as a comic; the camera drifts through illustrated panels in a fixed R3F canvas; a fBm shadow shader stretches into streaks with scroll velocity; two-pass halftone pointer trail; 3D flipbook with @use-gesture drag and GSAP. Layering: DOM caption layer over the canvas (GSAP), Lenis feeding scroll into the scene, panel frame positions hard-coded per year. Performance: KTX2 panel textures via useKTX2, one shared PlaneGeometry, DPR capped at 1.5, AdaptiveDpr, stencil and shadows off, next chapter's textures preloaded during the transition, audio skipped on saveData/2G/3G. My measurements: html.lenis, document scrollHeight equals the viewport (900), so scrolling is entirely virtual (a hijack), LCP element a loader counter at 2.0 s, 32 MB transferred, p50 frame 600 ms under software GL. Take: horizontal full-bleed chronology as a composition, DPR cap, preload-during-transition, saveData gate; reject the virtual scroll.
- https://corentinbernadou.com/ (making-of: https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/) — OPENED (loaded in headless Chrome, article read). Signature: a Swiss-style editorial grid where WebGL geometry is deliberately subtle, plus a click on the central cross that draws grid rules around the page title. Choreography: GSAP power3.out, about 0.5 s for the mask/position moves; Lenis; GSAP page transitions and preloader. Layering: clear 2D interface first, canvas as a secondary layer (his stated aim: a legible 2D interface with 3D adding depth). Measured: the lightest of the sites I probed (1 canvas, 791 KB JS, 1.0 s total long tasks and p50 frame 67 ms under software GL), LCP element the '0%' preloader at 0.55-0.76 s, CLS 0. Reduced-motion and mobile behaviour not described in the article and not probed to completion. Take: restraint and hierarchy; a grid-rule motif drawn on demand fits the ruler signature.
- https://www.theycallmegiulio.com/ (making-of: https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/) — PARTLY OPENED (HTML fetched; article read; behaviour not probed because the run did not finish). Signature: four cinematic Three.js scenes stacked behind a DOM text layer, with a noise-masked band transition between scene textures plus a slight RGB split and velocity zoom. Stack: vanilla three (R3F dropped because of multiple RenderTargets), TSL with WebGPU and WebGL fallback, Lenis plus a custom section switch at 30% of the viewport (50% felt like an obstacle), a SectionTransition class with an OrthographicCamera and post-processing that updates only one scene (two during a transition), a single LoadingManager for progress, InstancedMesh (100 cars) along CatmullRomCurve3 paths, Blender clips via AnimationMixer. Take: render only visible scenes, one loading manager, scene-transition shader; mobile and reduced-motion handling are not documented in the article.
- https://joseph-san.com/ (making-of: https://tympanus.net/codrops/?p=114641) — PARTLY OPENED (HTML fetched shows Three and GSAP; article read; behaviour not probed). Signature: a scroll-driven 3D world (Three.js, GSAP, Blender, GLSL) with two particle systems in separate scenes. Performance claims by the author (not verified by me): KTX2/Basis textures, Draco GLTF, atmospheric passes rendered at lower resolution on a smaller render target and composited back, 144 fps on capable hardware and steady on mid-range mobile. Take: low-resolution render target for atmospheric passes on tier 2.
- https://bruno-simon.com/ (source: https://github.com/brunosimon/folio-2025, MIT) — OPENED (HTML fetched; source cloned and read). Signature: a drivable physics world. Engineering: three ^0.187.0, THREE.WebGPURenderer from 'three/webgpu' with forceWebGL:false (automatic WebGL fallback), renderer.setAnimationLoop as the single ticker, THREE.RenderPipeline with TSL bloom, stats-gl, Tweakpane debug. User-facing Options panel: Audio, Quality (Low/High; level defaults to low on mobile by user-agent regex), Renderer label. Take: a visible quality control, a single loop owned by the renderer, an in-page ?inspector style debug route.
- https://github.com/lusionltd/WebGL-Scroll-Sync (demo: https://webgl-scroll-sync.lusion.co/, MIT) — SOURCE READ (README and src/js/main.js). The reference for scroll sync without scroll-jacking: a single canvas that scrolls with the page (transform translate(scrollX, scrollY - viewportHeight*padding) every rAF), 25% vertical padding to hide clipping, per-item DOM rects added to scroll offset, items hidden when outside the canvas bounds, scroll-speed strength with exponential decay. The authors call it imperfect and offer a framebuffer-with-edge-fade alternative.
- https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/webgl_multiple_elements.html — SOURCE READ. Official three.js pattern: one WebGLRenderer, per-element scene and camera, getBoundingClientRect then renderer.setViewport and setScissor, canvas.style.transform = translateY(scrollY). Also webgl_worker_offscreencanvas.html plus three/addons/offscreen/* for the OffscreenCanvas route.
- https://www.shader.se/ (Awwwards: https://www.awwwards.com/sites/shader-development-studio) — OPENED (HTML and 16 script chunks inspected, headless run). Awwwards Site of the Day 2026-04-20, overall 7.73, Dev Award 8.12, Animations/Transitions 9.40; Next.js with Turbopack chunks, R3F and three in a 1.28 MB chunk, Lenis, and navigator.gpu references (about 3.4 MB JS in total). Under software GL it never settled: screenshot timeout after 30 s, 217 s of long tasks, only one chunk mentions prefers-reduced-motion. Take: the animation bar to aim for (9.4) and the resilience gap to beat.
- https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/magic-card.tsx — SOURCE READ. Pointer spotlight with motion: useMotionValue for pointer, useSpring({ stiffness: 250, damping: 30, mass: 0.6 }), useMotionTemplate for the radial-gradient, reset on enter/leave/global pointer events.
- motion@14.12.0 package (dist/es/three.mjs, vgpu.mjs, framer-motion features-max.mjs) — SOURCE READ from the installed package. threeEffect and vgpuEffect via animate.addEffect; writes in frame.preRender; key mapping rules; domMax equals domAnimation plus drag plus layout; animateView and springValue declarations.
- https://awards.racing (Awwwards SOTD 2026-10-27, three.js, Bullet physics, Nuxt) — NOT OPENED: only its Awwwards listing was read (SOTD 7.54 overall, Dev 7.47). Listed for context, no behavioural claims made.

## Avoid

- Lenis (1.3.27), GSAP ScrollSmoother or any virtual-scroll layer: Lenis calls preventDefault on wheel and touch and re-animates scroll (read in lenis.mjs); ten.375.studio's hijacked scroll (document height = viewport) is the anti-pattern the owner forbids. Do not map vertical wheel to horizontal travel for the timelines.
- Remapping or pinning the timeline so the page must be scrolled to see it: fit to width on desktop instead.
- Width: 100vw bleed on sections (includes the vertical scrollbar and causes horizontal overflow); use named full-bleed grid tracks.
- Loaders, preloader counters or opacity-gated hero text: in my probe the LCP element on ten.375.studio, corentinbernadou.com and trionn.com was a loader counter or a logo, and Trionn measured CLS 0.20-0.23.
- Two independent rAF loops (one for scroll, one for rendering): the one-frame desync HAOQI documented; own a single loop.
- R3F for this site (9.8.2; peer react >=19 <19.4): the stage needs control of the loop, scissor viewports and multi-RenderTarget work; three of the references dropped it for that reason. Also avoid @react-three/offscreen 0.0.8 (stale).
- WebGPURenderer/TSL for now: 228 KB gz minimal graph vs 133.6 KB, not exercisable on headless SwiftShader, Firefox support partial.
- Rendering copy or numerals in WebGL, or using a canvas as the only carrier of any fact.
- Treating reduced motion as 'slower' (Trionn) or ignoring it (shader.se): reduced motion must stop non-essential motion and render one still frame.
- Continuous loops when idle or off-screen, will-change left on permanently, per-frame getBoundingClientRect for every card, per-mesh GSAP tweens for hover flashes.
- detect-gpu 5.0.70 with its default CDN benchmark data (violates the no-CDN CSP unless self-hosted); use the in-house frame governor.
- DeviceOrientation tilt on phones (permission prompt); touch gets press states and velocity coupling instead.
- Speculation rules, scroll-state container queries and interpolate-size as dependencies: each is Chrome-only today.
- The React <AnimateView> component from motion until React is on 19.3+; use animateView() or raw startViewTransition.
- Absolute fps targets measured on SwiftShader; use relative budgets and structural idle checks, and verify on real hardware.

## Unverified

- Real-GPU and real-phone performance: all measurements ran in headless Chrome on SwiftShader (software GL); absolute frame times are not representative, no iOS Safari, Android or Firefox was available.
- Safari and Firefox behaviour of scroll-driven animations (Firefox 159 shipped 2026-10-27), anchor positioning, and View Transitions combined with a WebGL canvas and sticky elements was not tested; support figures come from MDN browser-compat-data 8.1.8 (2026-11-02), not from running those browsers.
- Probe of theycallmegiulio.com and joseph-san.com did not complete before the run ended (only corentinbernadou.com desktop and reduced-motion results were obtained for the second batch); their descriptions rest on the Codrops articles and fetched HTML. awards.racing and the Gionatan Nese '26 and Telha Clarke Awwwards entries were not opened live.
- Codrops article pages return 403 to the fetch tool; I read them via curl with a browser user agent and text extraction, so figures such as durations and code come from that extraction.
- Whether clip-path, blur or opacity-based hero text reveals delay the LCP entry (Chrome excludes fully transparent elements from LCP candidates; effect of the other starts not tested).
- Whether Next 15.5's vendored React exposes <ViewTransition> (React 19.3.1 is npm latest; react.dev pins 19.3 canary builds in examples). The site's package.json pins React 19.2.8.
- Next.js static-export bundling of a module Worker for OffscreenCanvas (new Worker(new URL(...), { type: 'module' })) was not tried.
- Whether ViewTimeline.currentTime can be read in rAF without forcing layout.
- The number of simultaneously named view-transition elements at which performance degrades.
- Whether troika-three-text 0.53.1 fetches any font or unicode data from a CDN by default under the CSP; whether three's Color.setStyle accepts oklch().
- The deployed Content-Security-Policy: the repo's firebase.json has script-src with 'unsafe-eval' and worker-src 'self' (no blob:), while the brief says no eval and workers from 'self' or blob:. Confirm the live header before adding WASM loaders or blob workers. The 'inline-speculation-rules' CSP keyword was not checked.
- The official Awwwards Developer Award rubric (only the Design/Usability/Creativity/Content weighting from secondary sources); the unusual BCD value for api.GPU in desktop Chrome (reported 144) was not investigated.
- Bundle sizes are for minimal esbuild graphs (WebGL 133.6 KB gz, WebGL + postprocessing 148 KB gz, three/webgpu + TSL 228 KB gz) and motion rollups; the real lazy chunk depends on the scenes and should be measured with a bundle analyser.
- Numeric starting values marked 'my number' or house rules (stagger cap, tilt degrees, frame-time thresholds, bloom intensities, 20% regression threshold) are not published standards and need tuning in review.
