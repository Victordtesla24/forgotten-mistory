/**
 * gsap.ts — single GSAP + ScrollTrigger entry point. ScrollTrigger touches
 * window/document, so registration is guarded to the client. Import { gsap,
 * ScrollTrigger } from here everywhere (never register the plugin ad-hoc).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// registerPlugin is idempotent — safe to call once per client load.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
