'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * AvatarSpeakingContext — shared state so MiniVicBot can pulse the hero avatar
 * when voice output is active. HeroAvatar reads the `speaking` flag; MiniVicBot
 * sets it via `setSpeaking`. Separated from MiniVicBot's own `isSpeaking` so the
 * hero pulse is independent of the bot's internal audio state machine.
 *
 * Contract (R1 AVATAR §7.4):
 *  - `setSpeaking(true)` → hero avatar shows a subtle pulse/glow ring.
 *  - `setSpeaking(false)` → hero avatar returns to resting state.
 *  - Zero-CLS: the avatar box is reserved at layout time regardless of pulse state.
 *  - Reduced-motion: pulse is disabled; context writes but avatar ignores it.
 */
interface AvatarSpeakingState {
  speaking: boolean;
  setSpeaking: (v: boolean) => void;
}

const AvatarSpeakingContext = createContext<AvatarSpeakingState>({
  speaking: false,
  setSpeaking: () => {},
});

export function AvatarSpeakingProvider({ children }: { children: ReactNode }) {
  const [speaking, setSpeakingState] = useState(false);

  const setSpeaking = useCallback((v: boolean) => {
    setSpeakingState(v);
  }, []);

  return (
    <AvatarSpeakingContext.Provider value={{ speaking, setSpeaking }}>
      {children}
    </AvatarSpeakingContext.Provider>
  );
}

/**
 * Hook for consumers that need to read the current speaking state.
 * Used by HeroAvatar to know when to pulse.
 */
export function useAvatarSpeaking(): boolean {
  const { speaking } = useContext(AvatarSpeakingContext);
  return speaking;
}

/**
 * Hook for MiniVicBot to control the avatar speaking state.
 * Returns a stable setter function.
 */
export function useSetAvatarSpeaking(): (v: boolean) => void {
  const { setSpeaking } = useContext(AvatarSpeakingContext);
  return setSpeaking;
}
