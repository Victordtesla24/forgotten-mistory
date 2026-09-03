'use client';

import { useEffect, useState } from 'react';

export type GLCapability = 'probing' | 'supported' | 'unsupported';

/**
 * Module-level memo. The probe allocates a throwaway WebGL context, so it must
 * run exactly once per page load no matter how many components ask.
 */
let cached: GLCapability | null = null;

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
    const isSoftware = /swiftshader|llvmpipe|software|basic render/i.test(renderer);

    // Release the probe context immediately — it counts against the browser's cap.
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    cached = isSoftware ? 'unsupported' : 'supported';
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
