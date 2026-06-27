"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { askMiniVicBrain, type BrainTurn } from "@/lib/miniVicBrain";
import { GREETING, type PersonaMode } from "@/app/data/miniVicKnowledge";
import { Copy, Play, RefreshCcw, Send, Sparkles, Volume2, VolumeX, X, Mic, MicOff, Video } from "lucide-react";
import { useSetAvatarSpeaking } from "@/lib/avatarContext";
import { PALETTE } from "@/lib/palette";

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
  },
  {
    label: "Ship a roadmap",
    prompt: "How would you land a 90-day roadmap for an AI telemetry platform in a bank?",
  },
  {
    label: "Tech stack read",
    prompt: "Summarize your preferred stack for building reliable real-time dashboards.",
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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
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
  /** Build-time ElevenLabs render of the greeting in Vikram's cloned voice. */
  const GREETING_AUDIO_URL = "/assets/minivic-greeting.mp3";
  const hasPlayedGreetingRef = useRef(false);

  // R1: wire MiniVicBot voice output to the hero avatar speaking pulse.
  const setAvatarSpeaking = useSetAvatarSpeaking();

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
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }
    if (videoRef.current && isVideoPlaying) {
        // Revert to loop
        setCurrentVideoSrc(AVATAR_VIDEO_URL);
        setIsVideoPlaying(false);
        videoRef.current.muted = true;
        videoRef.current.loop = true;
    }
    setIsSpeaking(false);
    stopMouth();
  }, [isVideoPlaying, AVATAR_VIDEO_URL, stopMouth]);

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
        stopAudio();
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, stopAudio]);

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
  // any in-flight browser speech synthesis.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
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
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');
          setInput(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          logMiniVicIssue("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      stopAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio]);

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

  const startMouth = () => {
    if (!ensureAnalyser() || !mouthCanvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    const canvas = mouthCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = dataArrayRef.current;
    const bufferLength = analyserRef.current.frequencyBinCount;

    const loop = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw a holographic waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexToRgba(PALETTE.steel, 0.8);
      ctx.shadowBlur = 8;
      ctx.shadowColor = PALETTE.steel;
      
      ctx.beginPath();
      
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      // Calculate average for mouth opening simulation
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const openAmount = Math.min(15, average / 10); // Max 15px opening

      // Draw upper lip (dynamic)
      ctx.moveTo(0, canvas.height / 2 - openAmount * 0.5);
      for(let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * openAmount) + (canvas.height / 2) - (openAmount);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          
          x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2 - openAmount * 0.5);
      ctx.stroke();

      // Draw lower lip (dynamic reflection)
      ctx.beginPath();
      x = 0;
      ctx.moveTo(0, canvas.height / 2 + openAmount * 0.5);
      for(let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (canvas.height / 2) + (openAmount) - (v * openAmount * 0.5); // Less movement on bottom
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          
          x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2 + openAmount * 0.5);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };


  /**
   * Synthetic mouth animation for browser-voice replies (no audio element to
   * analyse). Draws the same holographic waveform style as startMouth, driven
   * by layered sine waves instead of an AnalyserNode.
   */
  const startSyntheticMouth = () => {
    const canvas = mouthCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const started = performance.now();
    const loop = () => {
      const t = (performance.now() - started) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexToRgba(PALETTE.steel, 0.8);
      ctx.shadowBlur = 8;
      ctx.shadowColor = PALETTE.steel;

      const openAmount = 6 + Math.abs(Math.sin(t * 7.3)) * 7 + Math.abs(Math.sin(t * 3.1)) * 2;
      const segments = 48;
      const sliceWidth = canvas.width / segments;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const wave = Math.sin(i * 0.55 + t * 9) * 0.5 + Math.sin(i * 0.21 - t * 5) * 0.5;
        const y = canvas.height / 2 - openAmount * (0.4 + 0.6 * Math.abs(wave));
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * sliceWidth, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const wave = Math.sin(i * 0.48 - t * 8) * 0.5 + Math.sin(i * 0.19 + t * 4) * 0.5;
        const y = canvas.height / 2 + openAmount * (0.3 + 0.5 * Math.abs(wave));
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * sliceWidth, y);
      }
      ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  /**
   * Browser text-to-speech for replies that arrive without provider audio
   * (the normal case on static hosting). Prefers an Australian English voice.
   */
  const speakText = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === "en-AU" && /male|lee|daniel/i.test(v.name)) ||
      voices.find((v) => v.lang === "en-AU") ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
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
    const el = audioRef.current;
    el.src = audioSrc;
    el.onplay = () => {
      setIsSpeaking(true);
      stopMouth();
      startMouth();
    };
    el.onended = () => {
      setIsSpeaking(false);
      stopMouth();
    };
    el.onerror = () => {
      setIsSpeaking(false);
      stopMouth();
    };
    el.play().catch(() => {
      setIsSpeaking(false);
      stopMouth();
    });
  };

  /**
   * Voice a dynamic answer in Vikram's ElevenLabs cloned voice via the same-origin
   * /api/tts function (Stage 2 / TC-FR-VOICE-DYN — a Firebase Function reached
   * through a Hosting rewrite, so it works even on the static export where the Next
   * /api/* routes don't). The returned MP3 plays through playAudio, so the
   * holographic mouth-canvas lip-syncs off the audio amplitude in realtime. Falls
   * back to browser speech synthesis when the function is unavailable (local dev or
   * a transient error) so a reply is always voiced.
   */
  const speakReply = async (text: string) => {
    if (isMuted || !text.trim()) return;
    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok || !(resp.headers.get("content-type") || "").includes("audio")) {
        throw new Error("cloned-voice TTS unavailable");
      }
      const url = URL.createObjectURL(await resp.blob());
      setLastAudio(url);
      playAudio(url);
    } catch (err) {
      logMiniVicIssue("Cloned-voice TTS unavailable; using browser voice", err);
      speakText(text);
    }
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
            reject(new Error(formatProviderError(envelope.payload)));
            return;
          }
          if (envelope.eventType === "session.done") {
            if (completed) return;
            completed = true;
            clearTimeout(timeout);
            ws.close();

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
        reject(new Error("Realtime websocket failed"));
      };

      ws.onclose = () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeout);
        resolve({ text: textBuffer.trim() });
      };
    });

    return realtimeResult;
  };

  const handleSend = async (overrideText?: string, overrideMode?: ModeKey) => {
    const textToSend = (overrideText ?? input).trim();
    const modeToSend = overrideMode || activeMode;
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
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
        id: `bot-${Date.now()}`,
        role: "bot",
        text: text || "I'm here—ask me anything about how I deliver, lead teams, or architect AI.",
        audio,
        mode: modeToSend,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setLastAnswerId(botMessage.id);

      if (!isMuted && audio) {
        setLastAudio(audio);
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
        id: `bot-${Date.now()}`,
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
    setLastAudio(null);
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
          className="mb-4 flex h-[min(37rem,calc(100dvh-7rem))] w-[22rem] md:w-[27rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-zinc-300/20 bg-[linear-gradient(150deg,rgba(14,15,20,0.92),rgba(10,8,24,0.9))] backdrop-blur-xl shadow-[0_24px_70px_rgba(4,8,22,0.65),0_0_40px_rgba(201,205,214,0.14)] ring-1 ring-neutral-400/25 animate-in slide-in-from-bottom-8 duration-300 focus:outline-none"
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
                <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? "bg-white animate-pulse" : "bg-white/70"}`} />
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
                <button
                  onClick={() => {
                    stopAudio();
                    setIsOpen(false);
                    toggleRef.current?.focus();
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
                    ? "animate-pulse border-white/40 bg-white/15 text-white"
                    : "border-white/20 bg-white/5 text-white/85"
              }`}>
                {isSpeaking ? (isVideoPlaying ? "On video" : "Speaking") : isListening ? "Listening" : "Online"}
              </span>
            </div>
          </div>
          <div className="shrink-0 border-b border-white/10 bg-black/30 px-3 py-3">
            <div className="flex items-center gap-2.5">
              {/* Persona segmented control — one clean toggle instead of three cramped pills */}
              <div className="flex flex-1 rounded-xl border border-white/12 bg-white/[0.03] p-0.5">
                {PERSONA_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    data-testid={`minivic-mode-${mode.key}`}
                    onClick={() => setActiveMode(mode.key)}
                    aria-pressed={activeMode === mode.key}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-all ${
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
              {latencyMs !== null && (
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
                  className={`max-w-[86%] px-3.5 py-2.5 text-[13.5px] leading-relaxed rounded-2xl shadow-sm border ${
                    msg.role === "user"
                      ? "rounded-tr-sm border-white/25 bg-white/90 text-neutral-950"
                      : "rounded-tl-sm border-white/10 bg-white/[0.04] text-white/90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] mb-1 opacity-80">
                    <span>{msg.role === "user" ? "You" : "Vic"}</span>
                    <div className="flex gap-1 items-center">
                      {msg.mode && (
                        <span className="rounded-full border border-zinc-200/25 bg-zinc-500/10 px-2 py-[2px] text-[10px] uppercase tracking-wide text-zinc-100">
                          {msg.mode}
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
                  <div className="mt-1 animate-pulse text-[10px] text-zinc-100">Accessing neural memory...</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-black/25 px-3 py-2.5">
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
            className="flex shrink-0 gap-2 border-t border-white/10 bg-neutral-950/95 p-3"
          >
            <div className="flex-1 relative">
              <input
                data-testid="minivic-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask me anything…"}
                className={`w-full rounded-xl border bg-white/[0.04] py-2.5 pl-4 pr-10 text-[13.5px] text-white placeholder-white/55 transition-all ${
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
        onClick={() => setIsOpen(!isOpen)}
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
          className="h-full w-full object-cover"
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
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default MiniVicBot;
