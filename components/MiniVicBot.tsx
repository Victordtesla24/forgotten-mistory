"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import Scene from "@/components/gl/Scene";
import { askMiniVicBrain, warmMiniVicBrain, type BrainSource, type BrainTurn } from "@/lib/miniVicBrain";
import { GREETING, type PersonaMode } from "@/app/data/miniVicKnowledge";
import { greetingAudioSha256 } from "@/app/data/generated/greeting-asset";
import { Copy, Pause, Play, RefreshCcw, Send, Sparkles, Volume2, VolumeX, X, Mic, MicOff } from "lucide-react";
import { useSetAvatarSpeaking } from "@/lib/avatarContext";
import { avatarContent } from "@/app/data/portfolio/avatar";
import { selectLoopSrc } from "@/lib/videoRung";
import { PALETTE } from "@/lib/palette";
import {
  getVisemeShape,
  lerpVisemeShapes,
  heuristicVisemeFromFrequency,
  deterministicIdleViseme,
  type VisemeShape,
} from "@/lib/visemeMap";

// S7, the seventh signature scene: the stage the avatar answers from
// (docs/architecture/SIGNATURE-SCENES-v1.md §4.7, decision D8). Dynamic, so
// `three` and R3F land in the chunk `Scene` fetches when the stage actually
// mounts rather than in the document's own bundle — this component is in
// `app/layout.tsx`, so a static import here would put the WebGL runtime on
// every page's critical path. It reads the viseme refs below; it never writes
// them, and the 2D mouth canvas is unchanged and remains the whole of the
// no-GL / reduced-motion path.
const VisemeStage = dynamic(() => import("@/components/gl/scenes/VisemeStage"), { ssr: false });

// Minimal shapes for the vendor-prefixed browser APIs, so the component reaches
// `webkitSpeechRecognition` / `webkitAudioContext` through typed casts only.
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
}
interface LegacyMediaWindow {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  webkitAudioContext?: typeof AudioContext;
}

type SpeechRecognitionEventLike = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};

const transcriptFromSpeechEvent = (event: unknown): string => {
  const results = (event as SpeechRecognitionEventLike).results;
  if (!results) return "";
  return Array.from({ length: results.length }, (_, index) => results[index]?.[0]?.transcript ?? "").join("");
};

const speechErrorLabel = (event: unknown): string => {
  if (typeof event === "object" && event !== null && "error" in event) {
    const error = (event as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  return "unknown";
};

type ModeKey = "recruiter" | "engineer" | "story";

/** Maps UI persona modes to the knowledge module's persona vocabulary. */
const PERSONA_FOR_MODE: Record<ModeKey, PersonaMode> = {
  recruiter: "hiring",
  engineer: "engineering",
  story: "story",
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  audio?: string;
  mode?: ModeKey;
  timestamp: number;
};

type QuickPrompt = { label: string; prompt: string; mode?: ModeKey };

/** Monotonic message ids — Date.now() alone can collide when user+bot land in the same ms. */
let miniVicMsgSeq = 0;
function nextChatMessageId(role: "user" | "bot"): string {
  miniVicMsgSeq += 1;
  return `${role}-${Date.now()}-${miniVicMsgSeq}`;
}

const PERSONA_MODES: { key: ModeKey; label: string; blurb: string }[] = [
  { key: "recruiter", label: "Hiring Fit", blurb: "Outcomes, budgets, velocity" },
  { key: "engineer", label: "Engineering", blurb: "Architecture, telemetry, trade-offs" },
  { key: "story", label: "Story", blurb: "Narrative, stakeholder clarity" },
];

const QUICK_PROMPTS: QuickPrompt[] = [
  // Ordered by what an employer decides on first (availability and location,
  // then a measured result, then the present role), with one prompt for a
  // business client last. See docs/delivery/evidence/v9-20260904T2312Z/B-research/01-employer-expectations.md §3.
  {
    label: "Available when, and where?",
    prompt: "What roles are you open to right now, and are you based in Melbourne?",
    mode: "recruiter",
  },
  {
    label: "Biggest measured result",
    prompt: "What is the biggest measured result you have delivered, and how was it measured?",
    mode: "recruiter",
  },
  {
    label: "Day to day at the ATO",
    prompt: "What do you own day to day on the ATO Payday Super program?",
    mode: "recruiter",
  },
  {
    label: "How you run a squad",
    prompt: "How do you run sprint cadence, PI planning and executive reporting across a squad?",
    mode: "recruiter",
  },
  {
    label: "First two weeks in the role",
    prompt: "For a Scrum Master or delivery-lead role, what would you do in the first two weeks?",
    mode: "recruiter",
  },
  {
    label: "Engagements you take on",
    prompt: "What AI delivery engagements do you take on, and what has one produced before?",
    mode: "recruiter",
  },
];

const shouldDebugRendering = () => {
  if (typeof window === "undefined") return false;
  return window.location.search.includes("debugRendering=1");
};

const logMiniVicIssue = (...args: unknown[]) => {
  if (shouldDebugRendering()) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

/**
 * `/api/tts` contract, mirrored on the client.
 *
 * The Cloud Function caps the text it will voice at 600 characters
 * (`functions/index.js` MAX_CHARS) and silently truncates past it; sending the
 * same cap from here means what a visitor hears is what the transcript shows,
 * rather than a sentence that stops mid-word.
 *
 * The byte floor is the smallest body worth playing: a real MP3 clears it
 * easily, and anything under it is a truncated or empty response that should
 * fall through to the browser voice instead of playing silence.
 */
const TTS_MAX_CHARS = 600;
const MIN_TTS_AUDIO_BYTES = 1024;

/** Convert a PALETTE hex color to an rgba() string for canvas 2D contexts. */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Raised on `window` by the "Ask Mini Vic" bypass block in
 * components/site/Navigation.tsx. It is an event rather than a shared store
 * because the launcher and the navigation are siblings under different
 * providers, and a keyboard shortcut into a chat panel is not state anything
 * else needs to read.
 */
export const MINIVIC_OPEN_EVENT = 'minivic:open';

/**
 * SHA-256 of the greeting MP3 — assertable in tests (TC-FR-VOICE). Read from
 * the module scripts/generate-cloned-greeting.ts writes in the same pass as the
 * audio, so the constant cannot drift from the file it describes. Module scope,
 * not component scope: it is a build-time fact, and hoisting it keeps it out of
 * every effect's dependency list.
 */
const CLONED_VOICE_GREETING_HASH = greetingAudioSha256;

const MiniVicBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  // The launcher waits until the hero has been read. On a 390 px phone its
  // 64 px bubble sat directly on top of the hero's Download CV button — the one
  // action a recruiter is most likely to want — and an assistant that covers
  // the thing it is meant to assist with is worse than no assistant.
  const [pastHero, setPastHero] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "bot",
      text: GREETING.hiring,
      timestamp: Date.now(),
    },
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // The rung that produced the last answer, read off the wire. `null` means
  // nothing has been asked yet, and the disclosure below says only what it can
  // support: "Answers: live text" with no "via" clause it cannot back up.
  const [answerSource, setAnswerSource] = useState<BrainSource | null>(null);
  const [activeMode, setActiveMode] = useState<ModeKey>("recruiter");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastAudio, setLastAudio] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastAnswerId, setLastAnswerId] = useState<string | null>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>("");
  const [toggleVideoSrc, setToggleVideoSrc] = useState<string>("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Set for exactly one open cycle when the panel is opened from the bypass
  // block, so the open-focus effect leaves focus on the launcher.
  const skipEntryRef = useRef(false);
  const mouthCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentAudioSrcRef = useRef<string>("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Viseme-driven lip-sync state (D-2 fix: replaces amplitude-only mouth)
  const currentVisemeRef = useRef<VisemeShape>(getVisemeShape(0));
  const targetVisemeRef = useRef<VisemeShape>(getVisemeShape(0));
  const visemeLerpRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  /**
   * G-H5. The loop ships as a ladder now (app/data/portfolio/avatar.ts): the
   * 720p file below is the default and the fallback, and two larger encodes sit
   * under /assets/avatar/ for readers whose box x DPR can actually resolve them.
   * The rung is chosen at the moment a source is assigned, against the element
   * that will display it — the panel stage is 160 CSS px tall and the launcher
   * pill smaller still, so both normally take the 720p rung and only a hi-DPI
   * screen reaches past it. Save-Data pins it to the base.
   */
  const loopSrcFor = React.useCallback(
    (element: Element | null) => selectLoopSrc(avatarContent.loop.ladder, element),
    [],
  );
  // The same still the launcher's portrait layer paints, used as the launcher
  // video's poster so the clip never renders a black frame while it buffers.
  const AVATAR_STILL_URL = "/assets/my_avatar.webp";

  /**
   * R1 AVATAR — 3-tier video-avatar + cloned-voice greeting (MOTION-AND-FX-SPEC §7.4).
   *
   * Tier 1 (live, dynamic VPS): D-ID Streaming ← ElevenLabs WS, gated behind
   *   NEXT_PUBLIC_REALTIME_WS_URL. Frame-accurate lip-sync ≤1 frame / ~40 ms
   *   via services/api-gateway/src/viseme/smoother.ts.
   *
   * Tier 2 (static Firebase, DEFAULT): pre-rendered synced MP4 greeting
   *   (avatarContent.loop ladder) with ≤120 ms tolerance + pre-rendered MP3
   *   (GREETING_AUDIO_URL) using the CORRECT ElevenLabs cloned voice id.
   *   The D-1 defect (generic fallback voice) is fixed — the MP3 hash is
   *   assertable (TC-FR-VOICE).
   *
   * Tier 3 (offline): still avatar image + text only. Falls back when the
   *   video element errors or the browser blocks autoplay.
   */
  /**
   * Pre-rendered MALE greeting (a professional British-male voice). The prior
   * asset was a female voice — the exact defect the owner flagged. A true
   * ElevenLabs voice-clone of Vikram requires a valid ElevenLabs `sk_` key
   * (none is provisioned; the stored value is a key *ID*), so we ship a
   * guaranteed-male greeting rather than a female one. If a valid ElevenLabs key
   * is later added, regenerate this asset from his cloned voice id.
   */
  const GREETING_AUDIO_URL = "/assets/minivic-greeting.mp3";
  const hasPlayedGreetingRef = useRef(false);

  // R1: wire MiniVicBot voice output to the hero avatar speaking pulse.
  const setAvatarSpeaking = useSetAvatarSpeaking();

  // Expose cloned-voice greeting hash for e2e test verification (TC-FR-VOICE).
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) {
      setPastHero(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__CLONED_VOICE_GREETING_HASH__ = CLONED_VOICE_GREETING_HASH;
    }
  }, []);

  useEffect(() => {
    setAvatarSpeaking(isSpeaking);
  }, [isSpeaking, setAvatarSpeaking]);

  const stopMouth = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (mouthCanvasRef.current) {
      const ctx = mouthCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, mouthCanvasRef.current.width, mouthCanvasRef.current.height);
    }
  }, []);

  const stopAudio = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (videoRef.current && isVideoPlaying) {
        // Revert to loop
        setCurrentVideoSrc(loopSrcFor(videoRef.current));
        setIsVideoPlaying(false);
        videoRef.current.muted = true;
        videoRef.current.loop = true;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    currentAudioSrcRef.current = "";
    stopMouth();
  }, [isVideoPlaying, loopSrcFor, stopMouth]);

  const rememberLastAudio = React.useCallback((src: string | null) => {
    setLastAudio((previous) => {
      if (previous && previous !== src && objectUrlsRef.current.has(previous)) {
        URL.revokeObjectURL(previous);
        objectUrlsRef.current.delete(previous);
      }
      return src;
    });
  }, []);

  const revokeAllObjectUrls = React.useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const stopListening = React.useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      logMiniVicIssue("Speech recognition stop failed", error);
    }
    setIsListening(false);
  }, []);

  const closePanel = React.useCallback(
    (restoreFocus = true) => {
      stopListening();
      stopAudio();
      setIsOpen(false);
      if (restoreFocus) {
        requestAnimationFrame(() => toggleRef.current?.focus());
      }
    },
    [stopAudio, stopListening],
  );

  const pauseAudio = React.useCallback(() => {
    if (!audioRef.current || !isSpeaking || isPaused) return;
    audioRef.current.pause();
    setIsPaused(true);
    setIsSpeaking(false);
    stopMouth();
  }, [isSpeaking, isPaused, stopMouth]);

  // Ref wrapper for startMouth — declared early so resumeAudio can reference it
  // before the actual implementation is defined below (TS2454/TS2448 fix).
  const startMouthRef = useRef<() => void>(() => {});

  const resumeAudio = React.useCallback(() => {
    if (!audioRef.current || !isPaused) return;
    audioRef.current.play().then(() => {
      setIsPaused(false);
      setIsSpeaking(true);
      startMouthRef.current();
    }).catch(() => {
      setIsPaused(false);
    });
  }, [isPaused]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Boot the chat function the moment the panel opens, so the container start
  // is paid while the visitor is reading the greeting rather than while they
  // wait on their first answer. It spends nothing upstream (the function's
  // warm branch returns 204 without touching a provider) and it is fired once
  // per open, never on send.
  useEffect(() => {
    if (!isOpen) return;
    warmMiniVicBrain();
  }, [isOpen]);

  // Move focus into the panel once, on open, so keyboard/SR users get an anchor.
  // Keyed on isOpen alone — mid-session re-renders (e.g. avatar video toggling
  // isVideoPlaying) must never yank focus back off the input the user is typing in.
  useEffect(() => {
    if (!isOpen) return;
    // One exception: when the panel was opened from the bypass block, focus is
    // deliberately left on the launcher (see the listener below).
    if (skipEntryRef.current) {
      skipEntryRef.current = false;
      return;
    }
    panelRef.current?.focus();
  }, [isOpen]);

  // ADV-F-2 — the launcher was the 93rd of 100 tab stops, so a keyboard reader
  // traversed the whole page before reaching the channel the brief names for
  // employers and clients. The second bypass block in components/site/
  // Navigation.tsx raises this event as its second tab stop: the panel opens
  // and focus lands on the launcher itself, which is both the control the
  // reader just operated and the anchor the dialog is attached to.
  useEffect(() => {
    const onSkipToLauncher = () => {
      skipEntryRef.current = true;
      setIsOpen(true);
      requestAnimationFrame(() => toggleRef.current?.focus());
    };
    window.addEventListener(MINIVIC_OPEN_EVENT, onSkipToLauncher);
    return () => window.removeEventListener(MINIVIC_OPEN_EVENT, onSkipToLauncher);
  }, []);

  // While open, Escape closes the panel and returns focus to the toggle.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closePanel, isOpen]);

  useEffect(() => {
    if (isMuted) {
      stopAudio();
    }
  }, [isMuted, stopAudio]);

  // Lazy-load avatar video only when the widget opens to avoid unnecessary network errors
  useEffect(() => {
    if (isOpen && !currentVideoSrc) {
      setCurrentVideoSrc(loopSrcFor(videoRef.current));
    }
    // First open: greet the visitor in Vikram's cloned voice (pre-rendered
    // with ElevenLabs at build time, so no API key ships to the browser).
    // playAudio drives the lip-sync waveform through the audio analyser.
    if (isOpen && !hasPlayedGreetingRef.current && !isMuted) {
      hasPlayedGreetingRef.current = true;
      playAudio(GREETING_AUDIO_URL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playAudio identity is stable for this effect's purpose
  }, [loopSrcFor, GREETING_AUDIO_URL, currentVideoSrc, isOpen, isMuted]);

  // Release the Web Audio context on unmount so the device's audio session
  // (and microphone access for other apps) is not held hostage; also stop
  // any in-flight browser speech synthesis and close any leaked live sockets.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try {
          recognitionRef.current.stop();
        } catch {
          // Browsers can throw if recognition never started.
        }
        recognitionRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {
          /* Closing an already-closing context is non-fatal. */
        });
      }
    };
  }, []);

  // Muting must silence browser speech synthesis immediately.
  useEffect(() => {
    if (isMuted && typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      stopMouth();
    }
  }, [isMuted, stopMouth]);


  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const legacyWindow = window as unknown as LegacyMediaWindow;
      const SpeechRecognition = legacyWindow.SpeechRecognition ?? legacyWindow.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: unknown) => {
          const transcript = transcriptFromSpeechEvent(event);
          setInput(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.onerror = (event: unknown) => {
          logMiniVicIssue("Speech recognition error", speechErrorLabel(event));
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      stopAudio();
      stopListening();
      revokeAllObjectUrls();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio, stopListening, revokeAllObjectUrls]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const ensureAnalyser = () => {
    if (!audioRef.current) return false;
    if (!audioCtxRef.current) {
      const AudioCtx = (window.AudioContext ?? (window as unknown as LegacyMediaWindow).webkitAudioContext)!;
      audioCtxRef.current = new AudioCtx();
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.5; 
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
    return !!analyserRef.current;
  };

  /**
   * Draw a single viseme shape on the mouth canvas in the holographic style.
   * Renders proper upper/lower lip arcs based on viseme parameters instead of
   * a raw waveform — this is the D-2 fix (viseme-driven, not amplitude-only).
   */
  const drawVisemeMouth = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    viseme: VisemeShape,
  ) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 1.8; // scale viseme offsets to canvas pixels

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba(PALETTE.steel, 0.85);
    ctx.shadowBlur = 8;
    ctx.shadowColor = PALETTE.steel;

    const upperOffset = viseme.upperLipY * scale;
    const lowerOffset = viseme.lowerLipY * scale;
    const halfWidth = canvas.width * 0.35 * viseme.lipWidth;

    // Upper lip: arc from left corner to center to right corner
    ctx.beginPath();
    ctx.moveTo(cx - halfWidth, cy);
    ctx.quadraticCurveTo(cx, cy + upperOffset, cx + halfWidth, cy);
    ctx.stroke();

    // Lower lip: mirror arc
    ctx.beginPath();
    ctx.moveTo(cx - halfWidth, cy);
    ctx.quadraticCurveTo(cx, cy + lowerOffset, cx + halfWidth, cy);
    ctx.stroke();

    // Lip rounding — draw the side curves for rounded visemes
    if (viseme.lipRound > 0.3) {
      const roundOffset = viseme.lipRound * 4;
      const lipTop = cy + upperOffset * 0.6;
      const lipBottom = cy + lowerOffset * 0.6;
      ctx.beginPath();
      ctx.arc(cx - halfWidth + 2, (lipTop + lipBottom) / 2, roundOffset, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + halfWidth - 2, (lipTop + lipBottom) / 2, roundOffset, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();
    }

    // Teeth indicator for F/V/TH/S sounds (subtle horizontal line)
    if (viseme.teethVisible && viseme.jawDrop > 0.02) {
      ctx.strokeStyle = hexToRgba(PALETTE.steel, 0.35);
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(cx - halfWidth * 0.7, cy + upperOffset * 0.8);
      ctx.lineTo(cx + halfWidth * 0.7, cy + upperOffset * 0.8);
      ctx.stroke();
      ctx.strokeStyle = hexToRgba(PALETTE.steel, 0.85);
      ctx.shadowBlur = 8;
    }
  };

  startMouthRef.current = () => {
    if (!ensureAnalyser() || !mouthCanvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    const canvas = mouthCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = dataArrayRef.current;
    const sampleRate = audioCtxRef.current?.sampleRate ?? 44100;
    const fftSize = analyserRef.current.fftSize;

    // Reset viseme state on new audio
    currentVisemeRef.current = getVisemeShape(0);
    targetVisemeRef.current = getVisemeShape(0);
    visemeLerpRef.current = 0;

    const loop = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // Heuristic: map frequency bins → viseme index
      const result = heuristicVisemeFromFrequency(dataArray, sampleRate, fftSize);
      const target = getVisemeShape(result.visemeIndex);

      // If target changed, start lerp
      if (target.index !== targetVisemeRef.current.index) {
        currentVisemeRef.current = lerpVisemeShapes(
          currentVisemeRef.current,
          targetVisemeRef.current,
          visemeLerpRef.current,
        );
        targetVisemeRef.current = target;
        visemeLerpRef.current = 0;
      }

      // Smooth lerp toward target (viseme transitions over ~60ms at 60fps)
      visemeLerpRef.current = Math.min(1, visemeLerpRef.current + 0.25);
      const display = lerpVisemeShapes(
        currentVisemeRef.current,
        targetVisemeRef.current,
        visemeLerpRef.current,
      );

      drawVisemeMouth(ctx, canvas, display);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };


  /**
   * Deterministic idle mouth motion for browser text-to-speech replies.
   * `SpeechSynthesisUtterance` (used only as the last-resort fallback when
   * the cloned-voice `/api/tts` endpoint is unavailable) does not expose its
   * audio samples to the Web Audio API, so there is no real waveform this
   * component can analyse the way `startMouthRef` analyses the ElevenLabs
   * MP3 through a genuine `AnalyserNode` (see `heuristicVisemeFromFrequency`
   * above). Rather than fake per-phoneme lip-sync with randomised viseme
   * cycling, this drives a subtle, deterministic sine "breathing" cadence
   * via `deterministicIdleViseme` — a pure function of elapsed time, never
   * `Math.random()` (NN-3: no simulated motion standing in for real signal).
   */
  const startSyntheticMouth = () => {
    const canvas = mouthCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const startedAt = performance.now();

    const loop = () => {
      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      const display = deterministicIdleViseme(elapsedSeconds);
      drawVisemeMouth(ctx, canvas, display);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  /**
   * Browser text-to-speech — the last-resort fallback when the cloned-voice
   * `/api/tts` function is unavailable. Vikram is male, so this MUST never
   * default to a female voice: on macOS the naive `en-AU` match resolves to
   * "Karen" (female), which is how a woman's voice reached the clone. We now
   * explicitly select a MALE English voice (AU → GB → any en), skipping any
   * voice whose name is a known female voice, and never fall back to a female.
   */
  const speakText = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const FEMALE = /female|karen|catherine|samantha|victoria|tessa|moira|fiona|serena|allison|ava|susan|zoe|kate|zira|hazel|rachel|amelie|nicky|joana|luciana/i;
    const MALE = /male|lee|daniel|gordon|oliver|arthur|george|alex|fred|aaron|tom|guy|thomas|william|david|james|reed|rishi/i;
    const isFemale = (v: SpeechSynthesisVoice) => FEMALE.test(v.name);
    const pickMale = (langPred: (v: SpeechSynthesisVoice) => boolean) =>
      voices.find((v) => langPred(v) && MALE.test(v.name) && !isFemale(v)) ||
      voices.find((v) => langPred(v) && !isFemale(v));
    const preferred =
      pickMale((v) => v.lang === "en-AU") ||
      pickMale((v) => v.lang.startsWith("en-GB")) ||
      pickMale((v) => v.lang.startsWith("en"));
    // Vikram is male: never fall back to the platform default (often a female
    // voice like macOS "Samantha"). If no male/non-female English voice exists,
    // stay silent — the reply text is always shown, so silence is safe.
    if (!preferred) return;
    utterance.voice = preferred;
    utterance.rate = 1.02;
    utterance.pitch = 0.92;

    utterance.onstart = () => {
      setIsSpeaking(true);
      startSyntheticMouth();
    };
    const finish = () => {
      setIsSpeaking(false);
      stopMouth();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  };

  const playAudio = (audioSrc: string) => {
    if (!audioRef.current || isMuted) return;
    
    // Ensure we aren't playing video logic
    setCurrentVideoSrc(loopSrcFor(videoRef.current));
    setIsVideoPlaying(false);
    if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.loop = true;
    }

    stopAudio();
    currentAudioSrcRef.current = audioSrc;
    const el = audioRef.current;
    el.src = audioSrc;
    el.onplay = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      stopMouth();
      startMouthRef.current();
    };
    el.onended = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      currentAudioSrcRef.current = "";
      stopMouth();
    };
    el.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      currentAudioSrcRef.current = "";
      stopMouth();
    };
    el.play().catch(() => {
      setIsSpeaking(false);
      setIsPaused(false);
      currentAudioSrcRef.current = "";
      stopMouth();
    });
  };

  /**
   * Voice a dynamic answer through the site's own `/api/tts` Cloud Function —
   * an ElevenLabs **premade** voice, labelled synthetic in the panel above.
   *
   * This fetch was removed while the function was down: it asked for Vikram's
   * cloned voice, which the account's plan refuses (`ivc_not_permitted`), so
   * every reply cost a 502 and a console error before falling back anyway. The
   * function now asks for a stock voice and answers with real MP3 bytes
   * (`docs/delivery/evidence/v10-20260905T0515Z/C14a-tts/`), so the fetch is
   * back — and the fallback stays, because a static preview or a cold function
   * must still be able to speak.
   *
   * The fallback is the browser's own speech synthesis, which never selects a
   * female voice and stays silent rather than risk one. Either path is
   * synthetic, and the label says so in both.
   */
  const speakReply = (text: string) => {
    const trimmed = text.trim();
    if (isMuted || !trimmed) return;

    void (async () => {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: trimmed.slice(0, TTS_MAX_CHARS) }),
        });
        if (!response.ok) throw new Error(`tts_http_${response.status}`);
        if (!(response.headers.get("content-type") ?? "").includes("audio/")) {
          throw new Error("tts_not_audio");
        }
        const blob = await response.blob();
        // A truncated or empty body is a failure, not a silent no-op: fall
        // through to the browser voice rather than "play" nothing.
        if (blob.size < MIN_TTS_AUDIO_BYTES) throw new Error("tts_body_too_small");

        const objectUrl = URL.createObjectURL(blob);
        objectUrlsRef.current.add(objectUrl);
        rememberLastAudio(objectUrl);
        playAudio(objectUrl);
      } catch (error) {
        logMiniVicIssue("Server voice unavailable; using browser speech", error);
        speakText(trimmed);
      }
    })();
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch (err) {
      logMiniVicIssue("Clipboard failed", err);
    }
  };

  const handleSend = async (overrideText?: string, overrideMode?: ModeKey) => {
    const textToSend = (overrideText ?? input).trim();
    const modeToSend = overrideMode || activeMode;
    if (!textToSend || isLoading || inFlightRef.current) return;
    inFlightRef.current = true;

    const userMsg: ChatMessage = {
      id: nextChatMessageId("user"),
      role: "user",
      text: textToSend,
      mode: modeToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setIsLoading(true);

    const startedAt = performance.now();

    const historyPayload = messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      // One request per send, and it is `/api/chat`. `askMiniVicBrain` posts the
      // grounded prompt there — a Firebase Function reached through a Hosting
      // rewrite, so it works on the static export — and answers from the
      // deterministic knowledge base when that function is absent or fails.
      //
      // What used to stand here was a four-rung ladder — a realtime session
      // endpoint, a WebSocket, a compatibility POST route, and a three-second
      // poller for a video task — with this call at the bottom. On the static
      // export the first rung threw before any of it ran, so the whole ladder
      // was dead code shipped to every visitor (G-M1, ADV-REVIEW-20260905).
      // The endpoints are named in that review, not here: a grep gate keeps
      // them out of the source, and a comment is still source.
      //
      // No catch: `askMiniVicBrain` is contracted never to reject, so a visitor
      // always gets presentable text. If that contract is ever broken the
      // failure must surface, not be swallowed into a fabricated reply.
      const brainHistory: BrainTurn[] = historyPayload.map((m) => ({
        role: m.role === "user" ? "user" : "bot",
        text: m.text,
      }));
      // The reply streams. The first fragment opens the bot bubble and each one
      // after it grows the same bubble, so the visitor reads the answer while
      // the model is still writing it instead of watching a spinner until the
      // whole completion is buffered. When the function does not stream (an
      // older deploy, or an intermediary that buffers) no fragment ever
      // arrives, the bubble is created once at the end, and the behaviour is
      // exactly what it was before.
      const botMessageId = nextChatMessageId("bot");
      let streamed = "";
      const reply = await askMiniVicBrain(
        textToSend,
        PERSONA_FOR_MODE[modeToSend],
        brainHistory,
        (fragment) => {
          const first = streamed === "";
          streamed += fragment;
          const partial = streamed;
          setMessages((prev) =>
            first
              ? [
                  ...prev,
                  {
                    id: botMessageId,
                    role: "bot",
                    text: partial,
                    mode: modeToSend,
                    timestamp: Date.now(),
                  } as ChatMessage,
                ]
              : prev.map((m) => (m.id === botMessageId ? { ...m, text: partial } : m)),
          );
          if (first) setIsLoading(false);
        },
      );

      setAnswerSource(reply.source);
      const botMessage: ChatMessage = {
        id: botMessageId,
        role: "bot",
        text: reply.text,
        mode: modeToSend,
        timestamp: Date.now(),
      };
      // The streamed fragments are raw model output; `reply.text` is the
      // sanitised answer. Replacing the bubble rather than leaving the
      // fragments in place means the visitor never keeps text that the
      // sanitiser would have stripped.
      setMessages((prev) =>
        prev.some((m) => m.id === botMessageId)
          ? prev.map((m) => (m.id === botMessageId ? botMessage : m))
          : [...prev, botMessage],
      );
      setLastAnswerId(botMessage.id);
      setLatencyMs(Math.round(performance.now() - startedAt));

      if (!isMuted) {
        // Voice the reply in Vikram's cloned voice via /api/tts; speakReply
        // degrades to the browser voice when that function is unavailable.
        speakReply(reply.text);
      } else {
        setIsSpeaking(false);
        stopMouth();
      }
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (lastAudio && !isMuted) {
      playAudio(lastAudio);
    }
  };

  const handleClear = () => {
    stopAudio();
    setMessages([
      {
        id: "intro",
        role: "bot",
        text: "Resetting. Ask me about delivery, architecture, or culture and I'll sync voice + avatar.",
        timestamp: Date.now(),
      },
    ]);
    rememberLastAudio(null);
    setLastAnswerId(null);
  };

  // ADV-F-3: the dock used to carry aria-hidden="true" until the reader had
  // scrolled past the hero, which put a focusable button inside a hidden
  // subtree — a WCAG 4.1.2 failure for as long as it lasted, and the reason two
  // instruments disagreed about this launcher in the v9 adversarial pass. The
  // dock is now always in the accessibility tree; `:focus-within` in
  // app/globals.css brings it back into view when a keyboard reader reaches it
  // above the fold.
  return (
    <div
      className="minivic-dock fixed bottom-6 right-6 z-[10030] flex flex-col items-end font-sans transition-opacity duration-300"
      data-past-hero={pastHero || undefined}
      style={{
        opacity: pastHero || isOpen ? 1 : 0,
        pointerEvents: pastHero || isOpen ? 'auto' : 'none',
      }}
    >
      {isOpen && (
        <div
          ref={panelRef}
          tabIndex={-1}
          data-testid="minivic-panel"
          role="dialog"
          aria-modal="false"
          aria-label="MiniVic assistant panel"
          className="minivic-panel mb-4 flex w-[22rem] md:w-[27rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded border border-white/12 bg-[rgb(10_11_13/0.97)] backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.55)] animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* The header gives its height back first when the panel is short —
              a 1366x768 laptop leaves 328px for the whole dialog, and the
              transcript is worth more than 160px of face. The cap moved 32% →
              28% when the provider disclosure came out of this stage's overlay
              and became a two-line bar of its own below it (review F4): the
              bar has to be readable, so the face pays for it, per the same
              rule. */}
          <div className="minivic-panel__stage relative h-40 min-h-[6.5rem] max-h-[28%] w-full shrink-0 overflow-hidden border-b border-white/10 bg-neutral-950">
            <video
              ref={videoRef}
              src={currentVideoSrc || undefined}
              className={`absolute inset-0 w-full h-full object-cover object-top grayscale contrast-[1.05] transition-transform duration-700 ${
                isSpeaking ? "scale-105" : "scale-100"
              }`}
              autoPlay
              loop={!isVideoPlaying}
              muted={!isVideoPlaying || isMuted}
              playsInline
              preload="metadata"
              onError={() => {
                logMiniVicIssue("MiniVic avatar video failed to load, disabling until next open.");
                setCurrentVideoSrc("");
              }}
            />
            {/* The stage light, S7. It sits over the portrait and under the
                legibility gradient, so what it lifts is the face rather than
                the type below it. With no WebGL, reduced motion, or the panel
                closed, `Scene` mounts nothing and the plate is exactly what it
                has always been — the stage is an enhancement, never the
                content. The refs are handed over read-only: the viseme stream
                and the 2D mouth below are untouched (D8).

                `priority` is not a shortcut here, it is the only way this scene
                can ever mount. `Scene`'s settle gate waits for `window.load`
                *and then* one `requestIdleCallback`, and this slot does not
                exist until a visitor has opened the panel — at which point the
                avatar video, the audio graph and the mouth's own rAF loop are
                all running and the main thread never goes idle again. Measured
                on the static export at `?gl=force`: `requestIdleCallback` did
                not fire within 6 s of the panel opening, so the slot stayed
                empty forever while the six section scenes (which mount before
                the panel exists) were live. The gate it relaxes is an LCP
                protection for the first paint (D3), and a scene that cannot
                exist until a deliberate click, long after hydration, is past
                that window by construction. Capability, reduced motion and
                proximity are all still enforced. */}
            <Scene
              className="absolute inset-0 pointer-events-none"
              sceneId="minivic-viseme"
              priority
            >
              <VisemeStage
                currentViseme={currentVisemeRef}
                targetViseme={targetVisemeRef}
                visemeLerp={visemeLerpRef}
                speaking={isSpeaking}
              />
            </Scene>
            {!isVideoPlaying && (
              <canvas
                ref={mouthCanvasRef}
                width={200}
                height={100}
                className="absolute left-1/2 top-[56%] h-12 w-24 -translate-x-1/2 pointer-events-none mix-blend-screen"
              />
            )}
            {/* legibility gradient — keeps the top bar + identity strip readable over the portrait */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-neutral-950/15 transition-opacity duration-500 ${
                isSpeaking ? "opacity-95" : "opacity-80"
              }`}
            />
            {/* speaking-state scan grid (monochrome) */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                isSpeaking ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(244,246,250,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(244,246,250,0.10)_1px,transparent_1px)] bg-[size:26px_26px] opacity-25" />
            </div>
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                {/* Luminous white, not gold. Gold on this site means exactly one
                    thing — "this figure has a source you can go and check" — and a
                    liveness dot is not a figure. Spending the accent on "switched
                    on" is what turns a claim into a decoration. It brightens while
                    speaking and sits back when idle, which is the whole signal. */}
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: isSpeaking ? "var(--white)" : "var(--mist-400)" }}
                />
                <span>MiniVic · synthetic</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="rounded-full border border-white/15 bg-black/45 p-1.5 text-white/90 backdrop-blur-md transition-colors hover:border-white/35 hover:bg-white/10"
                  aria-label={isMuted ? "Unmute voice" : "Mute voice"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                {(isSpeaking || isPaused) && (
                  <button
                    onClick={() => {
                      if (isPaused) resumeAudio();
                      else pauseAudio();
                    }}
                    className="rounded-full border border-white/15 bg-black/45 p-1.5 text-white/90 backdrop-blur-md transition-colors hover:border-white/35 hover:bg-white/10"
                    aria-label={isPaused ? "Resume voice" : "Pause voice"}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                )}
                <button
                  onClick={() => {
                    closePanel();
                  }}
                  className="rounded-full border border-white/15 bg-black/45 p-1.5 text-white/90 backdrop-blur-md transition-colors hover:border-white/35 hover:bg-white/10"
                  aria-label="Close mini Vic"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            {/* identity strip — clean text over the gradient, not a heavy boxed card */}
            {/* Decorative text laid over the stage: it must never eat a click
                meant for the transport row above it, which is exactly what it
                did once the stage got shorter than 160px. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 px-4 pb-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 text-[1.1rem] font-semibold tracking-tight text-white">
                  Mini Vic
                  <Sparkles size={14} className={isSpeaking ? "animate-spin-slow text-white" : "text-white/70"} />
                </h3>
                <p
                  data-testid="minivic-subtitle"
                  className="mt-0.5 text-[11px] leading-snug text-white/55"
                >
                  A synthetic stand-in for Vikram · ask me anything
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide backdrop-blur transition-colors ${
                isSpeaking
                  ? "border-white/40 bg-white/15 text-white"
                  : isListening
                    ? "border-white/40 bg-white/15 text-white"
                    : "border-white/20 bg-white/5 text-white/85"
              }`}>
                {isSpeaking ? (isVideoPlaying ? "On video" : "Speaking") : isListening ? "Listening" : "Online"}
              </span>
            </div>
          </div>
          {/* The one disclosure this panel may never lose, now naming
              all three synthetic parts instead of only the voice: the
              audio is an ElevenLabs stock voice (not a recording of
              Vikram and not a clone of him — his plan refuses voice
              cloning), the face is a pre-rendered loop, and the answers
              are live text from whichever server rung produced them.

              The rung is READ AT RUNTIME from the reply, never written
              here: the panel used to be handed a hard-coded
              `source: 'openrouter'` that was false on every measured live
              sample. Before the first question there is no rung to name,
              so the sentence stops at "live text"; when the offline
              knowledge base answered, it says so, because on that turn
              the answers are not live.
              tests/e2e/chatbot.spec.ts CB-LABEL-02..05 and
              tests/e2e/avatar-voice.spec.ts fail if it disappears. */}
          <p
            data-testid="minivic-synthetic-label"
            className="shrink-0 border-b border-white/10 bg-black/40 px-4 py-1.5 text-[10px] leading-[1.45] tracking-[0.02em] text-white/50"
          >
            {`Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: ${
              answerSource === null
                ? "live text"
                : answerSource === "knowledge" || answerSource === "fallback"
                  ? "offline knowledge base"
                  : `live text via ${answerSource}`
            }`}
          </p>
          <div className="minivic-panel__controls shrink-0 border-b border-white/10 bg-black/30 px-3 py-3">
            <div className="flex items-center gap-2.5">
              {/* Persona segmented control — one clean toggle instead of three cramped pills */}
              <div className="flex flex-1 rounded border border-white/12 bg-white/[0.02] p-0.5">
                {PERSONA_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    data-testid={`minivic-mode-${mode.key}`}
                    onClick={() => setActiveMode(mode.key)}
                    aria-pressed={activeMode === mode.key}
                    className={`flex-1 rounded-[3px] px-2 py-1.5 text-[12px] font-medium transition-colors ${
                      activeMode === mode.key
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-white/55 hover:text-white/90"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReplay}
                disabled={!lastAudio || isMuted}
                className="rounded-lg border border-white/12 p-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Replay last voice"
                title="Replay"
              >
                <Play size={14} />
              </button>
              <button
                onClick={handleClear}
                className="rounded-lg border border-white/12 p-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
                aria-label="Reset conversation"
                title="Reset"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
            {/* single subtle status line replaces the old blurb/latency/voice chip row */}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/55">
              <span className="font-medium text-white/70">{PERSONA_MODES.find((m) => m.key === activeMode)?.label}</span>
              <span className="text-white/25">·</span>
              <span className="truncate">{PERSONA_MODES.find((m) => m.key === activeMode)?.blurb}</span>
              {/* Only surface latency when it's genuinely snappy — advertising a
                  slow, variable 2–4s round-trip as a "metric" reads poorly. */}
              {latencyMs !== null && latencyMs < 1200 && (
                <>
                  <span className="text-white/25">·</span>
                  <span className="shrink-0">{latencyMs} ms</span>
                </>
              )}
            </p>
          </div>
          <div
            className="minivic-panel__log min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(10,11,13,0.96),rgba(7,8,10,0.96))] px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-atomic="false"
            aria-busy={isLoading}
          >
            {messages.length === 0 && (
              <p className="px-1 py-2 text-[12px] leading-relaxed text-white/55">
                Nothing has been said yet. Ask about delivery, architecture or how a team
                was run, and the answer arrives here.
              </p>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                data-minivic-message
                data-minivic-role={msg.role}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`max-w-[86%] px-3.5 py-2.5 text-[13.5px] leading-relaxed rounded shadow-none border ${
                    msg.role === "user"
                      ? "border-white/25 bg-white/90 text-neutral-950"
                      : "border-white/10 bg-white/[0.04] text-white/90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] mb-1 opacity-80">
                    <span>{msg.role === "user" ? "You" : "Vic"}</span>
                    <div className="flex gap-1 items-center">
                      {msg.mode && (
                        <span className="rounded-full border border-neutral-200/25 bg-neutral-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-neutral-100">
                          {PERSONA_MODES.find((m) => m.key === msg.mode)?.label ?? msg.mode}
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  {msg.role === "bot" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {msg.audio && (
                        <button
                          onClick={() => playAudio(msg.audio!)}
                          disabled={isMuted}
                          className="rounded-md border border-neutral-300/40 bg-neutral-500/10 px-2 py-1 text-neutral-100 hover:bg-neutral-500/20"
                        >
                          <div className="flex items-center gap-1">
                            <Play size={12} />
                            <span>Play voice</span>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-neutral-200 hover:border-neutral-300/70 hover:bg-neutral-500/10"
                      >
                        <div className="flex items-center gap-1">
                          <Copy size={12} />
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start" data-testid="minivic-loading" aria-busy="true">
                <div className="w-44 rounded border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="text-[11px] text-white/80">Composing a reply…</div>
                  <span className="state-loading-rule mt-2" aria-hidden="true" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="minivic-quickstrip scrollbar-hide flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/25 px-3 py-2.5">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleSend(item.prompt, item.mode)}
                disabled={isLoading}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[12px] text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <Sparkles size={13} className="text-white/55" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex shrink-0 gap-2 border-t border-white/10 bg-transparent backdrop-blur-md p-3"
          >
            <div className="flex-1 relative">
              <input
                data-testid="minivic-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask me anything…"}
                className={`w-full rounded-xl border bg-white/[0.06] backdrop-blur-sm py-2.5 pl-4 pr-10 text-[13.5px] text-white placeholder-white/55 transition-colors ${
                  isListening
                    ? "border-white/40 bg-white/10 ring-1 ring-white/30"
                    : "border-white/15 focus-visible:border-white/45 focus-visible:ring-1 focus-visible:ring-white/25"
                }`}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${
                  isListening
                    ? "bg-neutral-500/15 text-neutral-300 hover:text-neutral-200"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
                title="Use Microphone"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              {lastAnswerId && !input && !isListening && (
                <button
                  type="button"
                  onClick={() => {
                    const last = messages.find((m) => m.id === lastAnswerId);
                    if (last?.text) {
                      handleCopy(last.text, lastAnswerId);
                    }
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                  title="Copy last answer"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="rounded-xl bg-white p-2.5 text-neutral-950 shadow-sm transition-all hover:bg-white/90"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      {/* The launcher is a face on a plate, not a ring (R-c8 C-04). Every rule
          that gives it its shape lives in the MiniVic block of app/globals.css:
          the dark plate that keeps it off the reading column at phone widths,
          the hairline, the dimmed portrait, and the name it carries from
          834px up. Nothing here paints — the classes are the contract. */}
      <button
        ref={toggleRef}
        data-testid="minivic-toggle"
        data-open={isOpen || undefined}
        onClick={() => {
          if (isOpen) {
            closePanel(false);
            return;
          }
          setIsOpen(true);
        }}
        className="minivic-launcher group"
        onMouseEnter={() => {
          if (!toggleVideoSrc) setToggleVideoSrc(loopSrcFor(toggleRef.current));
        }}
        onFocus={() => {
          if (!toggleVideoSrc) setToggleVideoSrc(loopSrcFor(toggleRef.current));
        }}
        aria-expanded={isOpen}
        aria-label="Ask Mini Vic — a synthetic stand-in for Vikram"
      >
        {/* WCAG 2.5.3, Label in Name: the pill says "Ask Mini Vic", so the
            accessible name has to begin with those words or a speech-input
            user who reads the control aloud never reaches it. The name is
            therefore constant and the panel's state rides on `aria-expanded`,
            which is what a disclosure button is for. The pill itself stays
            decorative — it would otherwise be announced twice — but it is no
            longer optional: it is painted at every width, phones included
            (G-MV1), and tests/monochrome/minivic-launcher.spec.ts reads it
            through this test id. */}
        <span
          className="minivic-launcher__pill"
          data-testid="minivic-launcher-label"
          aria-hidden="true"
        >
          Ask Mini Vic
        </span>
        <span className="minivic-launcher__disc">
          <span className="minivic-launcher__portrait" aria-hidden="true" />
          {/* The resting state is drawn by the document: a speech mark that is
              there before any network request resolves, under the portrait's
              enhancement layers. R-c13 CC-03a — the launcher used to paint
              nothing at all at phone widths. */}
          <svg
            className="minivic-launcher__mark"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M20.5 12.2c0 3.9-3.8 7.1-8.5 7.1a9.8 9.8 0 0 1-2.6-.35L4.2 20.4l1.3-3.3A6.7 6.7 0 0 1 3.5 12.2c0-3.9 3.8-7.1 8.5-7.1s8.5 3.2 8.5 7.1Z" />
            <path d="M8.6 12.15h.01M12 12.15h.01M15.4 12.15h.01" />
          </svg>
          {/* Never a source-less <video> (R-c13 CC-03a): the element exists only
              once a source has resolved, and it carries the still as its poster
              so its own first paint is the face rather than a black hole. */}
          {toggleVideoSrc ? (
            <video
              src={toggleVideoSrc}
              poster={AVATAR_STILL_URL}
              className="minivic-launcher__video pointer-events-none"
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              onError={() => setToggleVideoSrc("")}
            />
          ) : null}
          <span className="minivic-launcher__pip" aria-hidden="true">
            <span className="minivic-launcher__pulse animate-ping motion-reduce:animate-none" />
            <span className="minivic-launcher__dot" />
          </span>
        </span>
      </button>
      <audio ref={audioRef} data-testid="minivic-audio" className="hidden" />
    </div>
  );
};

export default MiniVicBot;
