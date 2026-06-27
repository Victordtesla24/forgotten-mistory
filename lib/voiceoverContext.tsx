'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import { VoiceoverController } from './voiceoverController';

/**
 * VoiceoverContext — React context wrapping the VoiceoverController.
 *
 * Provides:
 *   - controller: the VoiceoverController instance
 *   - muted: boolean state
 *   - toggleMute: () => void
 *   - initAudio: () => void (call on user gesture)
 *   - triggerCue: (sectionId, audioSrc?) => void
 *   - startAmbient / stopAmbient
 *
 * Extends existing architecture: this provider is composed INSIDE
 * MotionProvider (which already provides Framer Motion reduced-motion
 * config), keeping the single provider chain (C3).
 */

interface VoiceoverContextValue {
  controller: VoiceoverController | null;
  muted: boolean;
  initialised: boolean;
  toggleMute: () => void;
  initAudio: () => void;
  triggerCue: (sectionId: string, audioSrc?: string) => void;
  startAmbient: () => void;
  stopAmbient: () => void;
}

const VoiceoverCtx = createContext<VoiceoverContextValue>({
  controller: null,
  muted: true,
  initialised: false,
  toggleMute: () => {},
  initAudio: () => {},
  triggerCue: () => {},
  startAmbient: () => {},
  stopAmbient: () => {},
});

export function VoiceoverProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const controllerRef = useRef<VoiceoverController | null>(null);
  const [muted, setMuted] = useState(true);
  const [initialised, setInitialised] = useState(false);
  const gestureHandledRef = useRef(false);

  // Lazy-create controller on first render
  if (!controllerRef.current) {
    controllerRef.current = new VoiceoverController(prefersReducedMotion ?? false);
    controllerRef.current.attach('__voiceoverController');
  }

  const ctrl = controllerRef.current;

  // Keep reduced-motion flag in sync
  useEffect(() => {
    if (prefersReducedMotion !== undefined && prefersReducedMotion !== null) {
      ctrl.state.reducedMotion = prefersReducedMotion;
    }
  }, [ctrl, prefersReducedMotion]);

  // Global user-gesture listener — inits audio on first click/tap/keydown
  useEffect(() => {
    const handleGesture = () => {
      if (gestureHandledRef.current) return;
      gestureHandledRef.current = true;

      // Init controller
      const ok = ctrl.init(prefersReducedMotion ?? false);
      if (ok) {
        setInitialised(true);
        setMuted(ctrl.state.muted);

        // Start ambient after short delay so the AudioContext is fully running
        setTimeout(() => {
          if (!ctrl.state.reducedMotion && !ctrl.state.muted) {
            ctrl.startAmbient();
          }
        }, 300);
      }
    };

    const events: Array<keyof HTMLElementEventMap> = ['click', 'keydown', 'touchstart'];
    for (const ev of events) {
      document.addEventListener(ev, handleGesture, { once: true, passive: true });
    }

    return () => {
      for (const ev of events) {
        document.removeEventListener(ev, handleGesture);
      }
    };
  }, [ctrl, prefersReducedMotion]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      ctrl.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Wire GSAP ScrollTrigger onEnter cues to voiceover controller ──────
  //
  // Section components (ProofScroll, SkillsScroll, ContactScroll, etc.)
  // already dispatch `gsap:<section>:enter` CustomEvents on ScrollTrigger
  // onEnter.  This listener maps those events → VoiceoverController.triggerCue()
  // so the voiceover layer fires without modifying individual section components
  // (C3: extends, no parallel system).
  useEffect(() => {
    const sectionToCue: Record<string, string> = {
      'gsap:hero:enter': 'hero',
      'gsap:proof:enter': 'proof',
      'gsap:experience:enter': 'experience',
      'gsap:work:enter': 'work',
      'gsap:skills:enter': 'skills',
      'gsap:contact:enter': 'contact',
    };

    const handler = (e: Event) => {
      const sectionId = sectionToCue[(e as CustomEvent).type];
      if (sectionId && ctrl) {
        ctrl.triggerCue(sectionId);
      }
    };

    for (const eventName of Object.keys(sectionToCue)) {
      document.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of Object.keys(sectionToCue)) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [ctrl]);

  const toggleMute = useCallback(() => {
    ctrl.toggleMute();
    setMuted(ctrl.state.muted);
  }, [ctrl]);

  const initAudio = useCallback(() => {
    const ok = ctrl.init(prefersReducedMotion ?? false);
    if (ok) setInitialised(true);
  }, [ctrl, prefersReducedMotion]);

  const triggerCue = useCallback(
    (sectionId: string, audioSrc?: string) => {
      ctrl.triggerCue(sectionId, audioSrc);
    },
    [ctrl],
  );

  const startAmbient = useCallback(() => {
    ctrl.startAmbient();
  }, [ctrl]);

  const stopAmbient = useCallback(() => {
    ctrl.stopAmbient();
  }, [ctrl]);

  return (
    <VoiceoverCtx.Provider
      value={{
        controller: ctrl,
        muted,
        initialised,
        toggleMute,
        initAudio,
        triggerCue,
        startAmbient,
        stopAmbient,
      }}
    >
      {children}
    </VoiceoverCtx.Provider>
  );
}

/**
 * Hook for accessing voiceover context.
 */
export function useVoiceover(): VoiceoverContextValue {
  return useContext(VoiceoverCtx);
}
