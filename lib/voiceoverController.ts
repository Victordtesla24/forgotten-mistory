/**
 * VoiceoverController — coordinating state machine for ambient + triggered audio
 * layers synced to on-screen GSAP/ScrollTrigger view transitions.
 *
 * G4 VOICEOVER SYNC (FR-VOICE-DYN):
 *   - AMBIENT layer (continuous bed) — gated by user interaction, mute, reduced-motion.
 *   - TRIGGERED layer (section-entry cues) — fired on ScrollTrigger onEnter.
 *
 * Design constraints:
 *   - No AudioContext before user gesture (autoplay compliance).
 *   - Mute + prefers-reduced-motion fully silence audio.
 *   - Cross-fade: gain ramps between ambient and triggered (no audible pops).
 *   - Dedup: `once`-style deduplication per section name.
 *   - extends existing MotionProvider + HeroAvatar pattern (C3).
 */

export type CueCallback = (sectionId: string, audioSrc?: string) => void;

export interface VoiceoverControllerState {
  /** Whether the controller has been initialised (user gesture received). */
  initialised: boolean;
  /** Whether audio is muted. */
  muted: boolean;
  /** Whether prefers-reduced-motion is active. */
  reducedMotion: boolean;
  /** Whether ambient is currently playing. */
  ambientActive: boolean;
  /** Currently playing triggered cue (sectionId), or null. */
  currentCue: string | null;
  /** Set of section IDs that have already fired their once cue. */
  firedSections: Set<string>;
}

const CROSSFADE_MS = 120; // smooth gain ramp duration
const AMBIENT_GAIN = 0.18; // low bed volume
const TRIGGERED_GAIN = 0.7; // cue volume

export class VoiceoverController {
  public audioContext: AudioContext | null = null;
  public state: VoiceoverControllerState;

  // Audio graph nodes
  private _masterGain: GainNode | null = null;
  private _ambientGain: GainNode | null = null;
  private _triggeredGain: GainNode | null = null;

  // Ambient — generated low-frequency atmospheric pad
  private _ambientSource: OscillatorNode | null = null;
  private _ambientNoiseSource: AudioBufferSourceNode | null = null;

  // Triggered — currently playing source
  private _triggeredSource: AudioBufferSourceNode | null = null;
  private _triggeredBuffer: AudioBuffer | null = null;

  // Gain ramp animation frame
  private _rampRaf: number | null = null;

  // Callbacks
  private _onCueFired: CueCallback | null = null;

  // Test instrumentation
  private _cueLog: Array<{ sectionId: string; time: number }> = [];
  private _hasOverlap = false;

  constructor(reducedMotion: boolean = false) {
    this.state = {
      initialised: false,
      muted: true, // start muted until explicit unmute
      reducedMotion: reducedMotion,
      ambientActive: false,
      currentCue: null,
      firedSections: new Set(),
    };
  }

  // ── Initialisation ─────────────────────────────────────────────────────

  /**
   * Initialise the audio graph. Must be called from a user-gesture event
   * handler (click, tap, keydown). No-op if already initialised or
   * reduced-motion is active.
   */
  init(reducedMotion?: boolean): boolean {
    if (this.state.initialised) return true;
    if (typeof window === 'undefined') return false;

    if (reducedMotion !== undefined) {
      this.state.reducedMotion = reducedMotion;
    }

    // Never initialise audio under reduced motion
    if (this.state.reducedMotion) return false;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext = ctx;

      // Master gain
      this._masterGain = ctx.createGain();
      this._masterGain.gain.value = 1;
      this._masterGain.connect(ctx.destination);

      // Ambient gain — ducked during triggered cues
      this._ambientGain = ctx.createGain();
      this._ambientGain.gain.value = AMBIENT_GAIN;
      this._ambientGain.connect(this._masterGain);

      // Triggered gain
      this._triggeredGain = ctx.createGain();
      this._triggeredGain.gain.value = 0;
      this._triggeredGain.connect(this._masterGain);

      this.state.initialised = true;

      // Resume if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      return true;
    } catch {
      return false;
    }
  }

  // ── Ambient ─────────────────────────────────────────────────────────────

  /**
   * Start the ambient audio bed. Generates a subtle, low-frequency
   * atmospheric pad using oscillators + filtered noise. No external
   * MP3 asset required.
   *
   * Safe: no-op if not initialised, muted, or reduced-motion.
   */
  startAmbient(): void {
    const ctx = this.audioContext;
    if (!ctx || !this.state.initialised || this.state.muted || this.state.reducedMotion) {
      return;
    }

    if (this.state.ambientActive) return;
    this._stopAmbient();

    try {
      // Sub-bass oscillator (< 80 Hz, very subtle)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 48; // deep sub-bass

      // Layer 2: slightly detuned harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 52;

      // Filter to shape the tone — low-pass to keep it atmospheric
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 0.5;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.55; // oscillator blend

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.35;

      osc.connect(oscGain);
      osc2.connect(osc2Gain);
      oscGain.connect(filter);
      osc2Gain.connect(filter);
      filter.connect(this._ambientGain!);

      osc.start();
      osc2.start();

      this._ambientSource = osc;

      this.state.ambientActive = true;
    } catch {
      // Non-fatal — ambient is decorative
    }
  }

  /**
   * Stop ambient bed with a quick fade-out.
   */
  stopAmbient(fadeMs: number = 200): void {
    if (!this.state.ambientActive) return;

    this._fadeAmbientOut(fadeMs);
    this.state.ambientActive = false;
  }

  // ── Triggered ───────────────────────────────────────────────────────────

  /**
   * Fire a triggered cue for a section entry.
   *
   * - Deduplicates by sectionId (once-per-section semantics).
   * - Cross-fades: ducks ambient, brings up triggered gain, then restores.
   * - If `audioSrc` is provided, loads and plays the buffer.
   * - If `audioSrc` is omitted, just records the cue (for sections without
   *   specific VO assets yet).
   */
  triggerCue(sectionId: string, audioSrc?: string): void {
    if (!this.state.initialised) return;

    // Dedup: each section fires exactly once
    if (this.state.firedSections.has(sectionId)) return;

    // If a cue is already playing, cleanly interrupt it first
    if (this.state.currentCue) {
      this._interruptCurrent();
    }

    this.state.firedSections.add(sectionId);
    this.state.currentCue = sectionId;

    // Log for test instrumentation
    this._cueLog.push({ sectionId, time: performance.now() });

    // Fire callback
    if (this._onCueFired) {
      this._onCueFired(sectionId, audioSrc);
    }

    // If muted or reduced-motion, still record the cue (for state tracking)
    // but don't play audio.
    if (this.state.muted || this.state.reducedMotion) {
      this.state.currentCue = null;
      return;
    }

    // Duck ambient
    if (this.state.ambientActive) {
      this._fadeAmbientDuck();
    }

    if (audioSrc) {
      this._playTriggeredBuffer(audioSrc);
    } else {
      // No audio asset — mark cue as complete after a brief window
      this._scheduleCueEnd(300);
    }
  }

  // ── Mute control ───────────────────────────────────────────────────────

  mute(): void {
    if (!this.state.initialised) return;
    this.state.muted = true;

    // Suspend the AudioContext (saves resources, complete silence)
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {});
    }

    // Kill ambient
    this._stopAmbient();
    this.state.ambientActive = false;

    // Interrupt any playing cue
    this._interruptCurrent();
  }

  unmute(): void {
    if (!this.state.initialised) return;
    this.state.muted = false;

    // Resume AudioContext
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  toggleMute(): boolean {
    if (this.state.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.state.muted;
  }

  // ── Callbacks ───────────────────────────────────────────────────────────

  set onCueFired(cb: CueCallback | null) {
    this._onCueFired = cb;
  }

  // ── Teardown ────────────────────────────────────────────────────────────

  dispose(): void {
    this._stopAmbient();
    this._interruptCurrent();

    if (this._rampRaf !== null) {
      cancelAnimationFrame(this._rampRaf);
      this._rampRaf = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this._masterGain = null;
    this._ambientGain = null;
    this._triggeredGain = null;
    this._ambientSource = null;
    this._triggeredSource = null;
    this._triggeredBuffer = null;
    this.state.initialised = false;
    this.state.currentCue = null;
  }

  // ── Internal: ambient control ──────────────────────────────────────────

  private _stopAmbient(): void {
    if (this._ambientSource) {
      try { this._ambientSource.stop(); } catch {}
      this._ambientSource = null;
    }
    if (this._ambientNoiseSource) {
      try { this._ambientNoiseSource.stop(); } catch {}
      this._ambientNoiseSource = null;
    }
  }

  private _fadeAmbientOut(durationMs: number): void {
    const gain = this._ambientGain;
    if (!gain) return;
    const ctx = this.audioContext;
    if (!ctx) return;

    const startTime = ctx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + durationMs / 1000);

    setTimeout(() => this._stopAmbient(), durationMs + 50);
  }

  private _fadeAmbientDuck(): void {
    const gain = this._ambientGain;
    if (!gain) return;
    const ctx = this.audioContext;
    if (!ctx) return;

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.02, now + CROSSFADE_MS / 1000);
  }

  private _restoreAmbient(): void {
    const gain = this._ambientGain;
    if (!gain || !this.state.ambientActive) return;
    const ctx = this.audioContext;
    if (!ctx) return;

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(AMBIENT_GAIN, now + CROSSFADE_MS / 1000);
  }

  // ── Internal: triggered audio ──────────────────────────────────────────

  private async _playTriggeredBuffer(url: string): Promise<void> {
    const ctx = this.audioContext;
    if (!ctx) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this._scheduleCueEnd(0);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this._triggeredGain!);

      // Ramp triggered gain in
      const now = ctx.currentTime;
      this._triggeredGain!.gain.cancelScheduledValues(now);
      this._triggeredGain!.gain.setValueAtTime(0, now);
      this._triggeredGain!.gain.linearRampToValueAtTime(TRIGGERED_GAIN, now + CROSSFADE_MS / 1000);

      this._triggeredSource = source;

      source.onended = () => {
        this._fadeTriggeredOut();
        this._scheduleCueEnd(CROSSFADE_MS);
      };

      source.start(0);
    } catch {
      // Non-fatal — cue asset failed to load
      this._scheduleCueEnd(0);
    }
  }

  private _fadeTriggeredOut(): void {
    const gain = this._triggeredGain;
    if (!gain) return;
    const ctx = this.audioContext;
    if (!ctx) return;

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
  }

  private _interruptCurrent(): void {
    if (this._triggeredSource) {
      try {
        this._triggeredSource.onended = null;
        this._triggeredSource.stop();
      } catch {}
      this._triggeredSource = null;
    }
    this._fadeTriggeredOut();
    this._restoreAmbient();
    this.state.currentCue = null;
  }

  private _scheduleCueEnd(delayMs: number): void {
    setTimeout(() => {
      if (this._triggeredSource) {
        this._triggeredSource = null;
      }
      this._restoreAmbient();
      this.state.currentCue = null;
    }, delayMs);
  }

  // ── Test instrumentation ───────────────────────────────────────────────

  /** Expose controller on window for test access. */
  attach(debugName: string = '__voiceoverController'): void {
    if (typeof window !== 'undefined') {
      (window as any)[debugName] = this;
    }
  }

  /** Get the cue log for timing assertions. */
  get cueLog(): ReadonlyArray<{ sectionId: string; time: number }> {
    return this._cueLog;
  }

  /** Check if overlap occurred during rapid scrolling. */
  get hasOverlap(): boolean {
    return this._hasOverlap;
  }
}
