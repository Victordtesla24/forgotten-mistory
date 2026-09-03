"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { askMiniVicBrain, type BrainTurn } from "@/lib/miniVicBrain";
import { GREETING, type PersonaMode } from "@/app/data/miniVicKnowledge";
import { Copy, Pause, Play, RefreshCcw, Send, Sparkles, Volume2, VolumeX, X, Mic, MicOff, Video } from "lucide-react";
import { useSetAvatarSpeaking } from "@/lib/avatarContext";
import { PALETTE } from "@/lib/palette";
import {
  getVisemeShape,
  lerpVisemeShapes,
  heuristicVisemeFromFrequency,
  deterministicIdleViseme,
  type VisemeShape,
} from "@/lib/visemeMap";

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
  polloTaskId?: string;
  videoUrl?: string;
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

type RealtimeServerEnvelope = {
  sessionId: string;
  eventType: string;
  payload?: {
    token?: string;
    text?: string;
    audioBase64?: string;
    audioMimeType?: string;
    streamId?: string;
    provider?: string;
    code?: string;
    status?: number;
    retryable?: boolean;
    details?: string;
    metrics?: { firstTokenToDoneMs?: number };
    error?: string;
  };
  emittedAtMs?: number;
};

type ProviderErrorPayload = {
  error?: string;
  provider?: string;
  code?: string;
  status?: number;
  retryable?: boolean;
  details?: string;
};

const PERSONA_MODES: { key: ModeKey; label: string; blurb: string }[] = [
  { key: "recruiter", label: "Hiring Fit", blurb: "Outcomes, budgets, velocity" },
  { key: "engineer", label: "Engineering", blurb: "Architecture, telemetry, trade-offs" },
  { key: "story", label: "Story", blurb: "Narrative, stakeholder clarity" },
];

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Fit me to a role",
    prompt: "Give me a 2-sentence fit for an enterprise AI delivery role and what you would do in week 1.",
    mode: "recruiter",
  },
  {
    label: "Ship a roadmap",
    prompt: "How would you land a 90-day roadmap for an AI telemetry platform in a bank?",
    mode: "recruiter",
  },
  {
    label: "Tech stack read",
    prompt: "Summarize your preferred stack for building reliable real-time dashboards.",
    mode: "engineer",
  },
  {
    label: "Services & rates",
    prompt: "What services do you offer and what engagement models do you work with for AI consulting?",
    mode: "recruiter",
  },
  {
    label: "Teams at scale",
    prompt: "Describe how you manage large distributed teams with onsite and offshore practitioners.",
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

/** Convert a PALETTE hex color to an rgba() string for canvas 2D contexts. */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MiniVicBot = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const mouthCanvasRef = useRef<HTMLCanvasElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
  // Track live WebSocket connections for clean teardown (no leaked sockets)
  const liveSocketsRef = useRef<Set<WebSocket>>(new Set());
  
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const AVATAR_VIDEO_URL = "/assets/my-avatar.mp4";

  /**
   * R1 AVATAR — 3-tier video-avatar + cloned-voice greeting (MOTION-AND-FX-SPEC §7.4).
   *
   * Tier 1 (live, dynamic VPS): D-ID Streaming ← ElevenLabs WS, gated behind
   *   NEXT_PUBLIC_REALTIME_WS_URL. Frame-accurate lip-sync ≤1 frame / ~40 ms
   *   via services/api-gateway/src/viseme/smoother.ts.
   *
   * Tier 2 (static Firebase, DEFAULT): pre-rendered synced MP4 greeting
   *   (AVATAR_VIDEO_URL) with ≤120 ms tolerance + pre-rendered MP3
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
  /** SHA-256 of the greeting MP3 — assertable in tests (TC-FR-VOICE). */
  const CLONED_VOICE_GREETING_HASH = "369e1eb2e0e072a8b07a56976cc5479f2187a06066f0ab696b540d8f8f9dddb3";
  const hasPlayedGreetingRef = useRef(false);

  // R1: wire MiniVicBot voice output to the hero avatar speaking pulse.
  const setAvatarSpeaking = useSetAvatarSpeaking();

  // Expose cloned-voice greeting hash for e2e test verification (TC-FR-VOICE).
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
        setCurrentVideoSrc(AVATAR_VIDEO_URL);
        setIsVideoPlaying(false);
        videoRef.current.muted = true;
        videoRef.current.loop = true;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    currentAudioSrcRef.current = "";
    stopMouth();
  }, [isVideoPlaying, AVATAR_VIDEO_URL, stopMouth]);

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

  // Move focus into the panel once, on open, so keyboard/SR users get an anchor.
  // Keyed on isOpen alone — mid-session re-renders (e.g. avatar video toggling
  // isVideoPlaying) must never yank focus back off the input the user is typing in.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

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
      setCurrentVideoSrc(AVATAR_VIDEO_URL);
    }
    // First open: greet the visitor in Vikram's cloned voice (pre-rendered
    // with ElevenLabs at build time, so no API key ships to the browser).
    // playAudio drives the lip-sync waveform through the audio analyser.
    if (isOpen && !hasPlayedGreetingRef.current && !isMuted) {
      hasPlayedGreetingRef.current = true;
      playAudio(GREETING_AUDIO_URL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playAudio identity is stable for this effect's purpose
  }, [AVATAR_VIDEO_URL, GREETING_AUDIO_URL, currentVideoSrc, isOpen, isMuted]);

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
      // Clean teardown: close any live WebSocket connections (FR-CLONE-LIVE)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- ref, not React node; we want current value at teardown
      const sockets = liveSocketsRef.current;
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "component unmounted");
        }
      });
      sockets.clear();
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

  // Calculate active tasks for dependency tracking
  const hasActiveTasks = messages.some(m => m.polloTaskId && !m.videoUrl);

  useEffect(() => {
    if (hasActiveTasks) {
      pollingIntervalRef.current = setInterval(async () => {
        // Use ref to get latest messages inside the interval closure
        const currentMessages = messagesRef.current;
        const activeTasks = currentMessages.filter(m => m.polloTaskId && !m.videoUrl);

        if (activeTasks.length === 0) {
           return;
        }

        const updates = new Map<string, { videoUrl?: string; removeTask?: boolean }>();

        for (const msg of activeTasks) {
          try {
            const res = await fetch(`/api/chat-with-vic?taskId=${msg.polloTaskId}`);
            if (res.ok) {
              const data = await res.json();
              // Check for completion status (Pollo API structure varies, assuming 'status' and 'output'/'data.url')
              if (data.status === 'succeeded' || data.data?.status === 'succeeded' || data.status === 'completed') {
                 const videoUrl = data.output?.[0] || data.data?.url || data.url;
                 if (videoUrl) {
                   updates.set(msg.id, { videoUrl });
                 }
              } else if (data.status === 'failed' || data.data?.status === 'failed') {
                  // Stop polling for this one
                  updates.set(msg.id, { removeTask: true });
              }
            }
          } catch (e) {
            logMiniVicIssue("Polling error", e);
          }
        }

        if (updates.size > 0) {
          setMessages((prev) => prev.map((m) => {
            const update = updates.get(m.id);
            if (!update) return m;
            
            if (update.removeTask) {
               const { polloTaskId, ...rest } = m;
               return rest;
            }
            if (update.videoUrl) {
               return { ...m, videoUrl: update.videoUrl };
            }
            return m;
          }));
        }
      }, 3000);
    }

    return () => {
       if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
       }
    };
  }, [hasActiveTasks]);


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
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
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
    setCurrentVideoSrc(AVATAR_VIDEO_URL);
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
   * Voice a dynamic answer in a MALE voice via the browser's speech synthesis.
   * (Server-side cloned-voice TTS is not provisioned — see the body — so we no
   * longer POST /api/tts, which only 502'd per reply.)
   */
  const speakReply = (text: string) => {
    if (isMuted || !text.trim()) return;
    // No server-side cloned-voice TTS is provisioned on this deployment (the
    // ElevenLabs key is invalid and OpenAI/Gemini TTS are not accessible on this
    // account). Calling /api/tts only produced a 502 per reply — a visible
    // console error — before falling back anyway. Voice the reply directly with
    // the browser's speech synthesis in a MALE voice (speakText never selects a
    // female voice, and stays silent rather than risk one). Restore the /api/tts
    // fetch here once a valid ElevenLabs `sk_` key is set for the function.
    speakText(text);
  };

  const playGeneratedVideo = (videoSrc: string) => {
      if (!videoRef.current) return;
      
      // Stop any background audio
      if (audioRef.current) {
          audioRef.current.pause();
      }
      stopMouth();

      setCurrentVideoSrc(videoSrc);
      setIsVideoPlaying(true);
      setIsSpeaking(true); // Use same visual indicator for active bot

      videoRef.current.src = videoSrc;
      videoRef.current.loop = false;
      videoRef.current.muted = isMuted;
      
      videoRef.current.onended = () => {
          setIsSpeaking(false);
          setIsVideoPlaying(false);
          setCurrentVideoSrc(AVATAR_VIDEO_URL);
          videoRef.current!.loop = true;
          videoRef.current!.muted = true;
          videoRef.current!.play();
      };
      
      videoRef.current.play().catch(e => logMiniVicIssue("Video play failed", e));
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

  const wsBaseUrl = () => {
    if (typeof window === "undefined") return "";
    const explicit = process.env.NEXT_PUBLIC_REALTIME_WS_URL;
    if (explicit && explicit.length > 0) {
      return explicit.replace(/\/$/, "");
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostName = window.location.hostname;
    const isLocal = hostName === "localhost" || hostName === "127.0.0.1";
    const host = isLocal ? `${hostName}:8000` : window.location.host;
    return `${protocol}//${host}`;
  };

  const OFFLINE_MESSAGE =
    "MiniVic's realtime backend isn't connected on this deployment, so I can't chat live right now. You can reach Vikram directly at sarkar.vikram@gmail.com or +61 433 224 556.";

  /**
   * On the static Firebase deployment every unknown route rewrites to
   * /index.html with a 200 status, so a missing API surfaces as an HTML
   * response rather than an error status. Treat any non-JSON response as
   * "backend unavailable" instead of attempting to parse it.
   */
  const isJsonResponse = (response: Response): boolean =>
    (response.headers.get("content-type") || "").toLowerCase().includes("application/json");

  const formatProviderError = (input?: ProviderErrorPayload): string => {
    if (!input) return "The AI service is unavailable right now.";
    const providerLabel = input.provider ? `${input.provider.toUpperCase()} ` : "";
    const base = input.error || "provider request failed";
    const retryHint = input.retryable ? " Please retry in a moment." : "";
    return `${providerLabel}${base}.${retryHint}`.trim();
  };

  const parseProviderErrorPayload = async (response: Response): Promise<ProviderErrorPayload> => {
    try {
      const json = await response.json() as ProviderErrorPayload;
      return json;
    } catch {
      try {
        const text = await response.text();
        return { error: text || `HTTP ${response.status}`, status: response.status };
      } catch {
        return { error: `HTTP ${response.status}`, status: response.status };
      }
    }
  };

  const sendRealtimeMessage = async (textToSend: string, modeToSend: ModeKey) => {
    const createSessionResp = await fetch("/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: modeToSend,
        userId: "mini-vic-client"
      })
    });

    if (!createSessionResp.ok) {
      const payload = await parseProviderErrorPayload(createSessionResp);
      throw new Error(formatProviderError(payload));
    }
    if (!isJsonResponse(createSessionResp)) {
      throw new Error(OFFLINE_MESSAGE);
    }

    const created = await createSessionResp.json() as { sessionId: string; wsPath: string };
    const sessionId = created.sessionId;
    if (!sessionId || !created.wsPath) {
      throw new Error("Realtime session response missing identifiers");
    }

    const realtimeResult = await new Promise<{
      text: string;
      audioDataUrl?: string;
      firstTokenToDoneMs?: number;
      didStreamId?: string;
    }>((resolve, reject) => {
      let completed = false;
      let textBuffer = "";
      let didStreamId = "";
      const timeout = window.setTimeout(() => {
        if (completed) return;
        completed = true;
        reject(new Error("Realtime session timed out"));
      }, 45000);

      const ws = new WebSocket(`${wsBaseUrl()}${created.wsPath}`);
      liveSocketsRef.current.add(ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({ eventType: "session.start", message: textToSend, requestId: `${Date.now()}` }));
      };

      ws.onmessage = (event) => {
        try {
          const envelope = JSON.parse(String(event.data)) as RealtimeServerEnvelope;
          if (envelope.eventType === "llm.token" && envelope.payload?.token) {
            textBuffer += envelope.payload.token;
          }
          if (envelope.eventType === "avatar.state" && envelope.payload?.streamId) {
            didStreamId = envelope.payload.streamId;
          }
          if (envelope.eventType === "session.error") {
            if (completed) return;
            completed = true;
            clearTimeout(timeout);
            ws.close();
            liveSocketsRef.current.delete(ws);
            reject(new Error(formatProviderError(envelope.payload)));
            return;
          }
          if (envelope.eventType === "session.done") {
            if (completed) return;
            completed = true;
            clearTimeout(timeout);
            ws.close();
            liveSocketsRef.current.delete(ws);

            const finalText = envelope.payload?.text || textBuffer.trim();
            const audioDataUrl = envelope.payload?.audioBase64
              ? `data:${envelope.payload.audioMimeType || "audio/mpeg"};base64,${envelope.payload.audioBase64}`
              : undefined;
            resolve({
              text: finalText,
              audioDataUrl,
              firstTokenToDoneMs: envelope.payload?.metrics?.firstTokenToDoneMs,
              didStreamId
            });
          }
        } catch (err) {
          logMiniVicIssue("Realtime payload parse error", err);
        }
      };

      ws.onerror = () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);
        liveSocketsRef.current.delete(ws);
        reject(new Error("Realtime websocket failed"));
      };

      ws.onclose = () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);
        liveSocketsRef.current.delete(ws);
        resolve({ text: textBuffer.trim() });
      };
    });

    return realtimeResult;
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
      // Static deployments have no /api routes — go straight to the
      // client-side brain instead of probing endpoints that would 404.
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
        throw new Error(OFFLINE_MESSAGE);
      }

      let text = "";
      let audio: string | undefined;
      let measuredLatency = 0;

      try {
        const realtime = await sendRealtimeMessage(textToSend, modeToSend);
        text = realtime.text;
        audio = realtime.audioDataUrl;
        measuredLatency = realtime.firstTokenToDoneMs || Math.round(performance.now() - startedAt);
      } catch (realtimeError) {
        logMiniVicIssue("Realtime flow failed; falling back to compatibility route", realtimeError);
        if (realtimeError instanceof Error && realtimeError.message === OFFLINE_MESSAGE) {
          throw realtimeError;
        }
        const res = await fetch("/api/chat-with-vic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            mode: modeToSend,
            history: historyPayload
          }),
        });
        if (!res.ok) {
          const fallbackPayload = await parseProviderErrorPayload(res);
          throw new Error(formatProviderError(fallbackPayload));
        }
        if (!isJsonResponse(res)) {
          throw new Error(OFFLINE_MESSAGE);
        }
        const data = await res.json() as { text?: string; audio?: string };
        text = data.text || "";
        audio = data.audio;
        measuredLatency = Math.round(performance.now() - startedAt);
      }

      setLatencyMs(measuredLatency);

      const botMessage: ChatMessage = {
        id: nextChatMessageId("bot"),
        role: "bot",
        text: text || "I'm here—ask me anything about how I deliver, lead teams, or architect AI.",
        audio,
        mode: modeToSend,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setLastAnswerId(botMessage.id);

      if (!isMuted && audio) {
        rememberLastAudio(audio);
        playAudio(audio);
      } else if (!isMuted && text) {
        // Provider returned text without audio — voice it in Vikram's cloned voice
        // via /api/tts (speakReply falls back to browser TTS if unavailable).
        speakReply(text);
      } else {
        setIsSpeaking(false);
        stopMouth();
      }
    } catch (error) {
      // Backend unavailable (static hosting) or provider failure: answer with
      // the client-side brain — Gemini grounded in the knowledge base, with a
      // deterministic local fallback. Visitors always get a real answer.
      logMiniVicIssue("Backend flow failed; using client-side brain", error);
      const brainHistory: BrainTurn[] = historyPayload.map((m) => ({
        role: m.role === "user" ? "user" : "bot",
        text: m.text,
      }));
      const reply = await askMiniVicBrain(textToSend, PERSONA_FOR_MODE[modeToSend], brainHistory);

      const botMessage: ChatMessage = {
        id: nextChatMessageId("bot"),
        role: "bot",
        text: reply.text,
        mode: modeToSend,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setLastAnswerId(botMessage.id);
      setLatencyMs(Math.round(performance.now() - startedAt));

      if (!isMuted) {
        // Voice the brain's reply in Vikram's cloned voice via /api/tts (this is the
        // static-site path); speakReply degrades to browser TTS if the function is down.
        speakReply(reply.text);
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

  return (
    <div className="fixed bottom-5 right-5 z-[10030] flex flex-col items-end font-sans">
      {isOpen && (
        <div
          ref={panelRef}
          tabIndex={-1}
          data-testid="minivic-panel"
          role="dialog"
          aria-modal="false"
          aria-label="MiniVic assistant panel"
          className="mb-4 flex h-[min(37rem,calc(100dvh-7rem))] w-[22rem] md:w-[27rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded border border-white/12 bg-[rgb(10_11_13/0.97)] backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.55)] animate-in slide-in-from-bottom-4 duration-200 focus:outline-none"
        >
          <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-white/10 bg-neutral-950">
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
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: isSpeaking ? "var(--gold-light)" : "var(--gold)" }}
                />
                <span>MiniVic Live</span>
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
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 px-4 pb-3">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 text-[1.1rem] font-semibold tracking-tight text-white">
                  Mini Vic
                  <Sparkles size={14} className={isSpeaking ? "animate-spin-slow text-white" : "text-white/70"} />
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-white/55">Vikram&apos;s AI clone · ask me anything</p>
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
          <div className="shrink-0 border-b border-white/10 bg-black/30 px-3 py-3">
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
                className="rounded-lg border border-white/12 p-2 text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(10,11,13,0.96),rgba(7,8,10,0.96))] px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-atomic="false"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                data-minivic-message
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
                        <span className="rounded-full border border-zinc-200/25 bg-zinc-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-zinc-100">
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
                          className="rounded-md border border-neutral-300/40 bg-neutral-500/10 px-2 py-1 text-neutral-100 hover:bg-neutral-500/20 disabled:opacity-40"
                        >
                          <div className="flex items-center gap-1">
                            <Play size={12} />
                            <span>Play voice</span>
                          </div>
                        </button>
                      )}
                      {msg.polloTaskId && !msg.videoUrl && (
                         <span className="flex animate-pulse items-center gap-1 rounded-md border border-neutral-300/40 bg-neutral-500/10 px-2 py-1 text-neutral-200">
                           <Sparkles size={12} /> Generating Video...
                         </span>
                      )}
                      {msg.videoUrl && (
                        <button
                          onClick={() => playGeneratedVideo(msg.videoUrl!)}
                          disabled={isMuted}
                          className="rounded-md border border-zinc-300/40 bg-zinc-500/10 px-2 py-1 text-zinc-100 hover:bg-zinc-500/20 disabled:opacity-40"
                        >
                          <div className="flex items-center gap-1">
                            <Video size={12} />
                            <span>Play HD Video</span>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-slate-200 hover:border-neutral-300/70 hover:bg-neutral-500/10"
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
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none border border-zinc-300/20 bg-slate-950/90 p-3 shadow-[0_0_15px_rgba(201,205,214,0.15)]">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300" style={{ animationDelay: "300ms" }} />
                  </div>
                  <div className="mt-1 animate-pulse text-[10px] text-zinc-100">Composing a reply…</div>
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
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white disabled:opacity-40"
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
                className={`w-full rounded-xl border bg-white/[0.06] backdrop-blur-sm py-2.5 pl-4 pr-10 text-[13.5px] text-white placeholder-white/55 transition-all ${
                  isListening
                    ? "border-white/40 bg-white/10 ring-1 ring-white/30"
                    : "border-white/15 focus:border-white/45 focus:outline-none focus:ring-1 focus:ring-white/25"
                }`}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors ${
                  isListening
                    ? "bg-neutral-500/15 text-neutral-300 hover:text-neutral-200"
                    : "text-slate-300 hover:bg-slate-800 hover:text-zinc-200"
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
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-zinc-200"
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
              className="rounded-xl bg-white p-2.5 text-neutral-950 shadow-sm transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      <button
        ref={toggleRef}
        data-testid="minivic-toggle"
        onClick={() => {
          if (isOpen) {
            closePanel(false);
            return;
          }
          setIsOpen(true);
        }}
        className={`group relative h-16 w-16 overflow-hidden rounded-full border-2 border-zinc-300/70 shadow-[0_0_26px_rgba(201,205,214,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "ring-4 ring-zinc-300/30" : ""
        }`}
        onMouseEnter={() => {
          if (!toggleVideoSrc) setToggleVideoSrc(AVATAR_VIDEO_URL);
        }}
        onFocus={() => {
          if (!toggleVideoSrc) setToggleVideoSrc(AVATAR_VIDEO_URL);
        }}
        aria-label={isOpen ? "Close Mini Vic assistant" : "Open Mini Vic assistant"}
      >
        <video
          src={toggleVideoSrc || undefined}
          className="pointer-events-none h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          onError={() => setToggleVideoSrc("")}
        />
        <span className="absolute right-1 top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full border border-black bg-zinc-500"></span>
        </span>
      </button>
      <audio ref={audioRef} data-testid="minivic-audio" className="hidden" />
    </div>
  );
};

export default MiniVicBot;
