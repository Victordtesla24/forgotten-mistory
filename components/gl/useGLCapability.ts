'use client';

import { useEffect, useState } from 'react';

export type GLCapability = 'probing' | 'supported' | 'unsupported';

/**
 * Module-level memo. The probe allocates a throwaway WebGL context, so it must
 * run exactly once per page load no matter how many components ask.
 */
let cached: GLCapability | null = null;

/**
 * The frame budget a renderer has to fit the page's largest scene inside to be
 * worth mounting: 30 fps, not 60. The scenes are ambient — fog, a ring of
 * light, drifting sediment — and half a display's refresh is the point at which
 * they stop reading as motion and start reading as a stutter.
 */
const FRAME_BUDGET_MS = 33;

/** Edge of the square the benchmark fills, in device pixels. */
const BENCH_EDGE = 256;

/** Frames drawn before the elapsed time is divided down to a per-pixel cost. */
const BENCH_FRAMES = 3;

/**
 * Resolution ceiling the projection assumes, matching `GLCanvas`'s own
 * `DPR_CEILING`. A scene never computes more fragments than this, so projecting
 * against a higher ratio would reject renderers over work they never do.
 */
const DPR_CEILING = 1.75;

/**
 * A fragment program with the per-pixel cost of the scenes this gate admits.
 *
 * These are all full-screen fragment programs whose cost is a handful of
 * transcendentals and two or three value-noise lookups per pixel, so the
 * benchmark does the same: a hash-based noise sampled three times, plus the
 * trig every one of them uses for its polar frame. A probe that drew a flat
 * colour would measure the rasteriser's fill rate and tell us nothing about
 * whether it can run *these*.
 */
const BENCH_FRAGMENT = `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
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
    vec2 p = (gl_FragCoord.xy / uResolution - 0.5) * 2.0;
    float r = length(p);
    float a = atan(p.x, p.y);
    float v = noise(p * 3.1 + uTime);
    v += noise(vec2(a * 2.4, r * 2.2 - uTime));
    v += noise(p * 1.1 + vec2(uTime, 0.0));
    v *= 0.5 + 0.5 * sin(a * 2.0 - uTime);
    gl_FragColor = vec4(vec3(v / 3.0), 1.0);
  }
`;

const BENCH_VERTEX = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

/**
 * How long one full-viewport frame of this page's scenes would take on this
 * renderer, in milliseconds — or `null` if the measurement could not be taken.
 *
 * The renderer *name* is a screen, not a verdict. It is cheap and it is right
 * about the common cases, but it is a string match: it refuses "Apple Software
 * Renderer" and "llvmpipe" on a workstation that would in fact hold 60 fps, and
 * it would refuse any future driver whose name happens to contain one of those
 * words. That is a false negative, and the reader pays for it by being shown
 * the static page on hardware that could have run the scenes.
 *
 * So a renderer the name test rejects is not rejected — it is measured. The
 * benchmark draws `BENCH_FRAMES` frames of a representative fragment program
 * into an offscreen `BENCH_EDGE` square, blocking on `finish()` so the time
 * includes the work rather than just the queueing, and divides the elapsed time
 * down to a cost per fragment. These scenes are fill-bound (evidence
 * `tests/perf/scene-framerate.spec.ts`, G-X1-01), so that cost scales with area:
 * projecting it onto the viewport at the resolution `GLCanvas` actually renders
 * at gives the frame time the reader would get.
 *
 * It runs only for renderers the name test rejected, so a GPU never pays for
 * it; on those it costs a quarter of a megapixel of work, once per page load.
 */
function projectedFrameMs(): number | null {
  const canvas = document.createElement('canvas');
  canvas.width = BENCH_EDGE;
  canvas.height = BENCH_EDGE;
  const gl = (canvas.getContext('webgl2') ||
    canvas.getContext('webgl')) as WebGLRenderingContext | null;
  if (!gl) return null;

  const program = gl.createProgram();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!program || !vertex || !fragment) return null;

  gl.shaderSource(vertex, BENCH_VERTEX);
  gl.compileShader(vertex);
  gl.shaderSource(fragment, BENCH_FRAGMENT);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // One triangle large enough to cover the clip square: three vertices instead
  // of a quad's six, and no index buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), BENCH_EDGE, BENCH_EDGE);

  const time = gl.getUniformLocation(program, 'uTime');
  gl.viewport(0, 0, BENCH_EDGE, BENCH_EDGE);

  // One untimed frame first: the driver compiles and uploads on first use, and
  // charging a renderer for its own warm-up is how a fast one gets refused.
  gl.uniform1f(time, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.finish();

  const started = performance.now();
  for (let frame = 0; frame < BENCH_FRAMES; frame += 1) {
    gl.uniform1f(time, frame + 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  gl.finish();
  const elapsed = performance.now() - started;

  gl.getExtension('WEBGL_lose_context')?.loseContext();

  const benchFragments = BENCH_EDGE * BENCH_EDGE * BENCH_FRAMES;
  const perFragment = elapsed / benchFragments;
  const ratio = Math.min(window.devicePixelRatio || 1, DPR_CEILING);
  const viewportFragments =
    Math.max(window.innerWidth, 1) * Math.max(window.innerHeight, 1) * ratio * ratio;
  return perFragment * viewportFragments;
}

function probe(): GLCapability {
  if (cached) return cached;
  if (typeof document === 'undefined') return 'probing';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      cached = 'unsupported';
      return cached;
    }

    // Software rasterisers (SwiftShader, llvmpipe) report a working context and
    // then render three frames a second. Treat them as unsupported: a static
    // page beats a stuttering one.
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
      : '';
    let refused = /swiftshader|llvmpipe|software|basic render/i.test(renderer);

    // `?gl=force` overrides the software check. The build and verification host
    // has no GPU, so without this escape hatch every scene would be shipped
    // having only ever been tested down its fallback path. Opt-in per URL, so a
    // real visitor on a software rasteriser still gets the static page.
    if (refused && window.location.search.includes('gl=force')) {
      refused = false;
    }

    // Release the probe context immediately — it counts against the browser's cap.
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    // The name test is a screen, and a string match has false negatives: a
    // renderer that would in fact hold the frame budget can be refused because
    // of what it is called. So a refused renderer is measured before it is
    // turned away, and admitted if it actually clears the budget. This is not
    // the `gl=force` escape hatch in another shape — force skips the question,
    // this one answers it, and a renderer that misses the budget is still
    // refused. A measurement that cannot be taken leaves the name test standing.
    if (refused) {
      const projected = projectedFrameMs();
      if (projected !== null && projected <= FRAME_BUDGET_MS) refused = false;
    }

    cached = refused ? 'unsupported' : 'supported';
    return cached;
  } catch {
    cached = 'unsupported';
    return cached;
  }
}

/**
 * Reports whether this device can render the shared WebGL stage well enough to
 * be worth mounting. Returns `'probing'` on the server and on the first client
 * render so server and client markup agree; the real answer lands in an effect.
 */
export function useGLCapability(): GLCapability {
  const [capability, setCapability] = useState<GLCapability>('probing');

  useEffect(() => {
    setCapability(probe());
  }, []);

  return capability;
}
