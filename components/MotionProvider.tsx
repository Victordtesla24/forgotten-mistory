"use client";

import { MotionConfig } from "framer-motion";
import { VoiceoverProvider } from "@/lib/voiceoverContext";

/**
 * MotionProvider — Framer Motion config + Voiceover context.
 *
 * Composes VoiceoverProvider within the existing MotionConfig boundary
 * so the voiceover state machine respects reduced-motion via Framer's
 * useReducedMotion() hook (C3: extends, does not replace).
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <VoiceoverProvider>{children}</VoiceoverProvider>
    </MotionConfig>
  );
}