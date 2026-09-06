'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { atmosphereFragmentShader, atmosphereVertexShader } from './atmosphere.glsl';

/**
 * The hero's only moving part. Renders inside the shared GL stage (see
 * `components/gl/GLStage.tsx`) — it never creates a context of its own.
 *
 * Cost: one full-screen quad, one fragment program, no textures, no geometry
 * uploads, no post-processing pass. The pointer is lerped on the CPU so the
 * shader never has to smooth anything itself.
 *
 * Deep-space parallax: pointer + scroll depth drive layered mist/stars at
 * different rates. Disabled under prefers-reduced-motion.
 */
export default function HeroAtmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerSmoothed = useRef(new THREE.Vector2(0, 0));
  const scrollTarget = useRef(0);
  const scrollSmoothed = useRef(0);
  const reduceMotion = useRef(false);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0 },
      // Full strata above the width where a phone stops being a phone. Below
      // it the ridged near layer and the shafts are dropped: sixteen noise
      // lookups a pixel is the wrong budget for a backdrop on a device whose
      // whole frame is the width of one of these light shafts.
      uQuality: { value: 1 },
      // HERO-SETPIECE-v3 §4.2. Both are written from the DOM by `readPlane()`
      // below; the defaults are the constants they replace, so a frame drawn
      // before the first measurement is the frame this shader always drew.
      uFigure: { value: new THREE.Vector2(0.875, 0.46) },
      uCopyGuard: { value: new THREE.Vector4(0.055, 0.1, 0.635, 0.945) },
      // Colours come from lib/palette.ts — the single place raw hex is allowed
      // to live for WebGL, so the scene can never drift off the ink palette.
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  /**
   * Measure the two things the shader has to aim at: the photograph's centre and
   * the union of the fold's text rects, both in this shader's uv (origin
   * bottom-left, so `y` is flipped out of the DOM's top-left).
   *
   * The brief's §3 table is the design intent; the DOM is the source (R7). The
   * text union is walked the same way the SPD instrument walks it — every
   * element inside `#hero` that owns a non-empty text node and paints inside the
   * fold — so the guard is bounded by exactly the rects the measure calls ink,
   * and the two cannot drift apart.
   *
   * The union is also published on `window.__heroCopyGuard` in CSS px, because a
   * bound that only exists inside a fragment program is a bound no reviewer can
   * check (tests/a11y/hero-contrast.spec.ts prints and asserts it).
   */
  const readPlane = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (W === 0 || H === 0) return null;

    const figureEl = document.querySelector('[data-testid="hero-portrait"]');
    let figure: THREE.Vector2 | null = null;
    if (figureEl) {
      const r = figureEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        figure = new THREE.Vector2(
          (r.left + r.width / 2) / W,
          1 - (r.top + r.height / 2) / H,
        );
      }
    }

    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    let guardPx: { x: number; y: number; w: number; h: number } | null = null;
    const hero = document.querySelector('#hero');
    if (hero) {
      for (const el of Array.from(hero.querySelectorAll('*'))) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType !== Node.TEXT_NODE || !(node.textContent || '').trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            if (r.width <= 0 || r.height <= 0) continue;
            if (r.top >= H || r.bottom <= 0) continue;
            x1 = Math.min(x1, Math.max(0, r.left));
            y1 = Math.min(y1, Math.max(0, r.top));
            x2 = Math.max(x2, Math.min(W, r.right));
            y2 = Math.max(y2, Math.min(H, r.bottom));
          }
        }
      }
    }
    let guard: THREE.Vector4 | null = null;
    if (x2 > x1 && y2 > y1) {
      guardPx = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      // uv, y up: the DOM's top edge becomes the uv rect's high y.
      guard = new THREE.Vector4(x1 / W, 1 - y2 / H, x2 / W, 1 - y1 / H);
    }
    (window as unknown as { __heroCopyGuard?: typeof guardPx }).__heroCopyGuard = guardPx;
    return { figure, guard };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    const apply = () => {
      const read = readPlane();
      const m = materialRef.current;
      if (!read || !m) return;
      if (read.figure) m.uniforms.uFigure.value.copy(read.figure);
      if (read.guard) m.uniforms.uCopyGuard.value.copy(read.guard);
    };
    apply();
    // The fold settles after fonts land and the entrance finishes; re-read then
    // rather than every frame, which would cost a layout flush per frame.
    const timers = [120, 600, 1800].map((ms) => window.setTimeout(apply, ms));
    window.addEventListener('resize', apply);
    if (document.fonts && 'ready' in document.fonts) {
      document.fonts.ready.then(apply).catch(() => {});
    }
    void material;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', apply);
    };
  }, [readPlane]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduceMotion.current = mq.matches;
      if (mq.matches) {
        pointerTarget.current.set(0, 0);
        pointerSmoothed.current.set(0, 0);
        scrollTarget.current = 0;
        scrollSmoothed.current = 0;
      }
    };
    sync();
    mq.addEventListener('change', sync);

    const onScroll = () => {
      if (reduceMotion.current) return;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollTarget.current = Math.min(Math.max(window.scrollY / max, 0), 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = reduceMotion.current ? 0 : state.clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);
    material.uniforms.uQuality.value = size.width >= 900 ? 1 : 0;

    // Pointer in -1..1, then a critically-damped follow so the parallax lags the
    // cursor by a beat instead of snapping to it.
    if (!reduceMotion.current) {
      pointerTarget.current.set(state.pointer.x, state.pointer.y);
    } else {
      pointerTarget.current.set(0, 0);
    }
    pointerSmoothed.current.lerp(pointerTarget.current, Math.min(delta * 1.6, 1));
    material.uniforms.uPointer.value.copy(pointerSmoothed.current);

    scrollSmoothed.current += (scrollTarget.current - scrollSmoothed.current) * Math.min(delta * 1.4, 1);
    material.uniforms.uScroll.value.set(scrollSmoothed.current, 0);

    // Entrance: the atmosphere fades up over roughly a second and a half once
    // the scene mounts, so it arrives behind the type rather than with it.
    const intensity = material.uniforms.uIntensity;
    intensity.value = Math.min(intensity.value + delta * 0.65, 1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
