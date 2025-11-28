"use client";

import React, { useEffect, useRef, useState } from "react";
import { Copy, Play, RefreshCcw, Rocket, Send, Sparkles, Square, Volume2, VolumeX, X, Mic, MicOff, Video } from "lucide-react";

type ModeKey = "recruiter" | "engineer" | "story" | "scifi";

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

const PERSONA_MODES: { key: ModeKey; label: string; blurb: string }[] = [
  { key: "recruiter", label: "Hiring Fit", blurb: "Outcomes, budgets, velocity" },
  { key: "engineer", label: "Engineering", blurb: "Architecture, telemetry, trade-offs" },
  { key: "story", label: "Story", blurb: "Narrative, stakeholder clarity" },
  { key: "scifi", label: "Sci-Fi", blurb: "Star Wars/Trek analogies" },
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
  {
    label: "Explain in sci-fi",
    prompt: "Explain this portfolio like a Star Wars scene.",
    mode: "scifi",
  },
];

const MiniVicBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "bot",
      text: "I'm Vic's animated AI twin. Choose the persona, ask anything about teams, delivery, or architecture, and I'll answer in my own voice with lip-synced video.",
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
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>("/assets/my-avatar.mp4");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mouthCanvasRef = useRef<HTMLCanvasElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const AVATAR_VIDEO_URL = "/assets/my-avatar.mp4";

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

  useEffect(() => {
    if (isMuted) {
      stopAudio();
    }
  }, [isMuted, stopAudio]);

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
            console.error("Polling error", e);
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
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
          console.error("Speech recognition error", event.error);
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
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      analyserRef.current.getByteFrequencyData(dataArray as any);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw a holographic waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 115, 80, 0.8)'; // orange-400
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff7350';
      
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
      
      videoRef.current.play().catch(e => console.error("Video play failed", e));
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch (err) {
      console.error("Clipboard failed", err);
    }
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
      const res = await fetch("/api/chat-with-vic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend, 
          mode: modeToSend,
          history: historyPayload 
        }),
      });

      if (!res.ok) throw new Error("API Limit or Error");

      const data = await res.json();
      setLatencyMs(Math.round(performance.now() - startedAt));

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: data.text || "I'm here—ask me anything about how I deliver, lead teams, or architect AI.",
        audio: data.audio,
        polloTaskId: data.polloTaskId,
        mode: modeToSend,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setLastAnswerId(botMessage.id);

      if (!isMuted && data.audio) {
        setLastAudio(data.audio);
        playAudio(data.audio);
      } else {
        setIsSpeaking(false);
        stopMouth();
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          role: "bot",
          text: "My brain link glitched. Give it another go in a moment.",
          timestamp: Date.now(),
        },
      ]);
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-[22rem] md:w-[25rem] bg-gray-950/95 backdrop-blur-2xl border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-10 ring-1 ring-orange-900/50">
          <div className="relative h-60 w-full bg-black overflow-hidden group">
            <video
              ref={videoRef}
              src={currentVideoSrc}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                isSpeaking ? "scale-110" : "scale-100"
              }`}
              autoPlay
              loop={!isVideoPlaying}
              muted={!isVideoPlaying || isMuted}
              playsInline
            />

            {/* Dynamic Holographic Mouth Canvas - Only show if NOT playing generated video */}
            {!isVideoPlaying && (
              <canvas 
                ref={mouthCanvasRef}
                width={200}
                height={100}
                className="absolute left-1/2 top-[58%] w-24 h-12 -translate-x-1/2 pointer-events-none mix-blend-screen"
              />
            )}

            <div
              className={`absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent transition-opacity duration-500 ${
                isSpeaking ? "opacity-60" : "opacity-40"
              }`}
            />

            {/* Holographic Overlay Effect */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                isSpeaking ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-orange-400/5 mix-blend-overlay animate-pulse" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,115,80,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,115,80,0.15)_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
            </div>

            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
              <div className={`backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border transition-all duration-300 ${
                isSpeaking ? "bg-orange-950/60 border-orange-400/50" : "bg-black/40 border-white/10"
              }`}>
                <span className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-green-400 animate-ping" : "bg-orange-400"}`} />
                <span className="text-[10px] text-orange-50 font-mono tracking-wider uppercase">Vic AI</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/15 transition-all border border-white/10"
                  aria-label={isMuted ? "Unmute voice" : "Mute voice"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  onClick={() => {
                    stopAudio();
                    setIsOpen(false);
                  }}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500/20 hover:text-red-300 transition-all border border-white/10"
                  aria-label="Close mini Vic"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2 drop-shadow-lg">
                Mini Vic
                <Sparkles size={16} className={`${isSpeaking ? "text-orange-300 animate-spin-slow" : "text-gray-400"}`} />
              </h3>
              <div className={`text-xs px-2 py-1 rounded-full backdrop-blur transition-colors ${
                isSpeaking 
                  ? "text-orange-100 bg-orange-500/30 border border-orange-400/60" 
                  : isListening
                    ? "text-red-100 bg-red-500/30 border border-red-400/60 animate-pulse"
                    : "text-gray-400 bg-black/20 border border-white/10"
              }`}>
                {isSpeaking ? (isVideoPlaying ? "Video Playback" : "Voice Active") : isListening ? "Listening..." : "Online"}
              </div>
            </div>
          </div>

          <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2 items-center border-b border-gray-800 bg-gray-950/80">
            {PERSONA_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setActiveMode(mode.key)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  activeMode === mode.key
                    ? "bg-orange-600 text-white border-orange-300 shadow-orange-500/30 shadow-lg"
                    : "bg-gray-900/80 text-gray-200 border-gray-700 hover:border-orange-500/50"
                }`}
              >
                {mode.label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleReplay}
                disabled={!lastAudio || isMuted}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-200 hover:border-orange-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1">
                  <Play size={12} />
                  <span>Replay</span>
                </div>
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-200 hover:border-red-400/60"
              >
                <div className="flex items-center gap-1">
                  <RefreshCcw size={12} />
                  <span>Reset</span>
                </div>
              </button>
            </div>
          </div>

          <div className="px-3 pb-2 text-[11px] text-gray-300 flex items-center gap-3 bg-gray-950/60">
            <span className="px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-100">
              {PERSONA_MODES.find((m) => m.key === activeMode)?.blurb}
            </span>
            {latencyMs !== null && (
              <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
                {latencyMs} ms response
              </span>
            )}
            <span className="px-2 py-1 rounded-md bg-gray-800/80 border border-gray-700 text-gray-200">
              {isMuted ? "Muted" : "Voice on"}
            </span>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-950/70 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 text-sm leading-relaxed rounded-2xl shadow-sm border ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white rounded-tr-none border-orange-400/60"
                      : "bg-gray-900/80 text-gray-100 border-gray-700/70 rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] mb-1 opacity-80">
                    <span>{msg.role === "user" ? "You" : "Vic"}</span>
                    <div className="flex gap-1 items-center">
                      {msg.mode && (
                        <span className="px-2 py-[2px] rounded-full bg-gray-800/60 border border-gray-700 text-[10px] uppercase tracking-wide">
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
                          className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-100 border border-orange-500/30 hover:bg-orange-500/20 disabled:opacity-40"
                        >
                          <div className="flex items-center gap-1">
                            <Play size={12} />
                            <span>Play voice</span>
                          </div>
                        </button>
                      )}
                      {msg.polloTaskId && !msg.videoUrl && (
                         <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-200 border border-yellow-500/30 flex items-center gap-1 animate-pulse">
                           <Sparkles size={12} /> Generating Video...
                         </span>
                      )}
                      {msg.videoUrl && (
                        <button
                          onClick={() => playGeneratedVideo(msg.videoUrl!)}
                          disabled={isMuted}
                          className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-100 border border-purple-500/30 hover:bg-purple-500/20 disabled:opacity-40"
                        >
                          <div className="flex items-center gap-1">
                            <Video size={12} />
                            <span>Play HD Video</span>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="px-2 py-1 rounded-md bg-gray-800/70 text-gray-200 border border-gray-700 hover:border-orange-400/60"
                      >
                        <div className="flex items-center gap-1">
                          <Copy size={12} />
                          <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-900/80 p-3 rounded-2xl rounded-tl-none border border-gray-800 shadow-[0_0_15px_rgba(255,115,80,0.1)]">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <div className="text-[10px] text-orange-500 mt-1 animate-pulse">Accessing neural memory...</div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-3 pb-3 flex gap-2 overflow-x-auto scrollbar-hide bg-gray-950/80">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleSend(item.prompt, item.mode)}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-orange-500/40 rounded-xl text-xs text-gray-100 transition-colors whitespace-nowrap"
              >
                {item.mode === "scifi" ? <Rocket size={14} /> : <Sparkles size={14} className="text-orange-300" />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask me anything—teams, budgets, AI stack..."}
                className={`w-full bg-gray-800 text-gray-100 text-sm rounded-xl pl-4 pr-10 py-2.5 border transition-all placeholder-gray-500 ${
                  isListening 
                    ? "border-orange-500/50 ring-1 ring-orange-500/30 bg-orange-500/5" 
                    : "border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                }`}
              />
              
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  isListening 
                    ? "text-orange-400 hover:text-orange-300 bg-orange-500/10" 
                    : "text-gray-400 hover:text-orange-300 hover:bg-gray-700"
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
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-300"
                  title="Copy last answer"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-orange-900/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative h-16 w-16 rounded-full border-2 border-orange-400 shadow-[0_0_20px_rgba(255,115,80,0.4)] overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "ring-4 ring-orange-500/20" : ""
        }`}
      >
        <video src={AVATAR_VIDEO_URL} className="h-full w-full object-cover" autoPlay loop muted playsInline />
        <span className="absolute top-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-black"></span>
        </span>
      </button>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default MiniVicBot;
