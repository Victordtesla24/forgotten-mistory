"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Volume2, VolumeX, Sparkles, X, Rocket } from 'lucide-react';

/**
 * MINI-VIC CHATBOT (Gemini Powered)
 * * Instructions:
 * 1. Place 'my-avatar.mp4' in your public folder
 * 2. Ensure /api/chat-with-vic is running with GEMINI_API_KEY
 */

const MiniVicBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Yo!! I'm Vic. Vic's AI twin—built by Vic, trained on Vic, answering like Vic. I'm Vic in silicon, custom-trained on all his work and the portfolio you see here. If you have any questions, don't hesitate to ask. I speak in his voice and rigor, with instant answers from his own narratives. If you'd like, I can even demo how he works. Anything on your mind... I'm here." }
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // REFS
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ASSETS
  const AVATAR_VIDEO_URL = "/my-avatar.mp4"; 

  // AUTO-SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // HANDLE SEND
  const handleSend = async (overrideText?: string, mode?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user', text: textToSend };
    
    if (!overrideText) {
        setMessages(prev => [...prev, userMsg]);
    } else if (mode === 'scifi') {
        // For special modes, show the action taken by the user
        setMessages(prev => [...prev, { role: 'user', text: "Explain that in Star Wars terms!" }]);
    }
    
    if (!overrideText) setInput('');
    setIsLoading(true);

    try {
      // HIT THE API ROUTE
      const res = await fetch('/api/chat-with-vic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, mode: mode || 'normal' }),
      });

      if (!res.ok) throw new Error("API Limit or Error");

      const data = await res.json();
      
      // ADD BOT RESPONSE
      setMessages(prev => [...prev, { role: 'bot', text: data.text }]);

      // PLAY AUDIO
      if (!isMuted && data.audio) {
        if (audioRef.current) {
          audioRef.current.src = data.audio;
          audioRef.current.play();
          setIsSpeaking(true);
          
          audioRef.current.onended = () => setIsSpeaking(false);
          audioRef.current.onerror = () => setIsSpeaking(false);
        }
      } else {
        // Fallback animation
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 3000);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Gemini link unstable. Try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
      
      {/* --- MAIN CHAT WINDOW --- */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-gray-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-10 ring-1 ring-cyan-900/50">
          
          {/* AVATAR HEADER */}
          <div className="relative h-56 w-full bg-black overflow-hidden group">
            
            {/* VIDEO LOOP */}
            <video
              ref={videoRef}
              src={AVATAR_VIDEO_URL}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
              autoPlay
              loop
              muted
              playsInline
            />
            
            {/* "TALKING" OVERLAY EFFECT */}
            <div className={`absolute inset-0 bg-cyan-400/20 mix-blend-overlay transition-opacity duration-150 ${isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
            
            {/* BOTTOM GRADIENT MASK */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90" />

            {/* HEADER CONTROLS */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start z-10">
              <div className="bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
                 <span className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-cyan-500'}`} />
                 <span className="text-xs text-cyan-50 font-mono tracking-wider">AI ARCHITECT</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* NAME TAG */}
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-white font-bold text-xl flex items-center gap-2 drop-shadow-lg">
                Mini-Vic <Sparkles size={16} className="text-cyan-400" />
              </h3>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-950/50 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 text-sm leading-relaxed rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-cyan-600 text-white rounded-tr-none' 
                      : 'bg-gray-800/80 text-gray-100 border border-gray-700/50 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/80 p-3 rounded-2xl rounded-tl-none border border-gray-700/50">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* QUICK ACTIONS */}
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
             <button
                onClick={() => handleSend("Explain that in Star Wars terms!", "scifi")}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/50 hover:bg-indigo-800/70 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 transition-colors whitespace-nowrap"
             >
                <Rocket size={12} />
                <span>✨ Sci-Fi Mode</span>
             </button>
             <button
                onClick={() => handleSend("Summarize your tech stack concisely.")}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-500/30 rounded-lg text-xs text-cyan-200 transition-colors whitespace-nowrap"
             >
                <span>⚡ Stack Check</span>
             </button>
          </div>

          {/* INPUT BAR */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-gray-800 text-gray-100 text-sm rounded-xl px-4 py-2.5 border border-gray-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder-gray-500"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-cyan-900/20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* --- TRIGGER BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative h-16 w-16 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'ring-4 ring-cyan-500/20' : ''}`}
      >
        <video
          src={AVATAR_VIDEO_URL}
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        <span className="absolute top-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-black"></span>
        </span>
      </button>

      {/* HIDDEN AUDIO ELEMENT */}
      <audio ref={audioRef} className="hidden" />

    </div>
  );
};

export default MiniVicBot;
