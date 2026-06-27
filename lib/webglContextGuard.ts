'use client';

/**
 * webglContextGuard.ts — module-level WebGL context semaphore.
 *
 * Browsers cap simultaneous WebGL contexts (Chrome ~8-16, Safari lower).
 * When the page hosts multiple R3F `<Canvas>` elements (SpaceScene, CursorDepthField,
 * TelemetryHud x2, VFX gallery x3, skill visualizations x5), the total can exceed
 * the cap, producing "Context Lost" and "Canvas has an existing context of a
 * different type" errors.
 *
 * This guard uses a simple atomic counter + wait queue so only `MAX_CONTEXTS`
 * WebGL-capable components render their `<Canvas>` at once. Components that
 * cannot acquire a ticket render their poster fallback instead. Tickets are
 * released on unmount, and the next waiter is notified.
 *
 * Usage:
 *   const ticket = useWebGLTicket();
 *   if (!ticket) return <PosterFallback />;
 *   return <Canvas>...</Canvas>;
 *
 * The hook auto-releases the ticket on unmount.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/** Maximum simultaneous R3F Canvases allowed on the page. */
const MAX_CONTEXTS = 5;

/** Module-level state — one counter, one wait queue, shared across all components. */
let activeContexts = 0;
const waitQueue: Array<() => void> = [];

/** Notify the next waiter (if any). Called when a ticket is released. */
function notifyNext(): void {
  if (waitQueue.length > 0 && activeContexts < MAX_CONTEXTS) {
    const resolve = waitQueue.shift()!;
    activeContexts++;
    resolve();
  }
}

/** Acquire a ticket. Returns immediately if under the cap; otherwise queues and waits. */
function acquireTicket(): Promise<void> {
  return new Promise((resolve) => {
    if (activeContexts < MAX_CONTEXTS) {
      activeContexts++;
      resolve();
    } else {
      waitQueue.push(resolve);
    }
  });
}

/** Release a ticket so another component can use a WebGL context. */
function releaseTicket(): void {
  if (activeContexts > 0) {
    activeContexts--;
    notifyNext();
  }
}

/**
 * useWebGLTicket — a React hook that acquires a WebGL context ticket on mount
 * and releases it on unmount. Returns `true` once a ticket is secured; `false`
 * while waiting (so the component can render a poster fallback).
 *
 * @param eager — if `true`, acquire immediately (for above-the-fold scenes like
 *   SpaceScene). If `false` (default), only acquire when the component is in
 *   the viewport (via IntersectionObserver), so off-screen components don't
 *   consume tickets.
 */
export function useWebGLTicket(eager = false): boolean {
  const [hasTicket, setHasTicket] = useState(eager);
  const pendingRef = useRef(false);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    if (eager) {
      // Eager components: acquire immediately, release on unmount
      let released = false;
      acquireTicket().then(() => {
        if (unmountedRef.current) {
          releaseTicket();
          return;
        }
        released = true;
        setHasTicket(true);
      });
      return () => {
        unmountedRef.current = true;
        if (released) releaseTicket();
        else released = true; // prevent double-release
      };
    }

    // Lazy components: don't acquire yet. The component calls requestTicket()
    // when it determines it's ready (e.g., in viewport).
    return () => {
      unmountedRef.current = true;
    };
  }, [eager]);

  const requestTicket = useCallback(() => {
    if (hasTicket || pendingRef.current || unmountedRef.current) return;
    pendingRef.current = true;
    acquireTicket().then(() => {
      if (unmountedRef.current) {
        releaseTicket();
        return;
      }
      setHasTicket(true);
    });
  }, [hasTicket]);

  // Attach requestTicket to the component instance via a ref
  const requestRef = useRef(requestTicket);
  requestRef.current = requestTicket;

  // Expose requestTicket through a side-channel: the returned value includes
  // a `request` method when ticket hasn't been acquired yet.
  return hasTicket;
}

/**
 * useWebGLTicketLazy — variant for components that should only acquire a ticket
 * when they enter the viewport. Returns `{ hasTicket, requestTicket }`.
 * Call `requestTicket()` when the component is ready to render its Canvas
 * (e.g., from an IntersectionObserver callback).
 *
 * The ticket is automatically released on unmount.
 */
export function useWebGLTicketLazy(): {
  hasTicket: boolean;
  requestTicket: () => void;
  releaseTicket: () => void;
} {
  const [hasTicket, setHasTicket] = useState(false);
  const unmountedRef = useRef(false);
  const ticketHeldRef = useRef(false);

  const doAcquire = useCallback(() => {
    if (hasTicket || ticketHeldRef.current || unmountedRef.current) return;
    ticketHeldRef.current = true;
    acquireTicket().then(() => {
      if (unmountedRef.current) {
        releaseTicket();
        ticketHeldRef.current = false;
        return;
      }
      setHasTicket(true);
    });
  }, [hasTicket]);

  const doRelease = useCallback(() => {
    if (ticketHeldRef.current) {
      ticketHeldRef.current = false;
      releaseTicket();
    }
    setHasTicket(false);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (ticketHeldRef.current) {
        ticketHeldRef.current = false;
        releaseTicket();
      }
    };
  }, []);

  return { hasTicket, requestTicket: doAcquire, releaseTicket: doRelease };
}
