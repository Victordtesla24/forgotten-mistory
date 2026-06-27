/**
 * telemetryFeed.ts — Deterministic live telemetry data generator.
 *
 * Generates realistic, project-bound telemetry signals from sine-wave models
 * seeded with deterministic parameters. ZERO Math.random() — the orchestrator
 * quality bar forbids noise filler. Every generated value is labelled with
 * its data-source annotation so the UI can display a "Deterministic simulated
 * live feed" badge (per prompt.md §5/R3).
 *
 * DATA-BINDING MAP (grounded in app/data/siteContent.ts featuredRepos[]):
 *
 *   TESLA APP DASHBOARD ← telemetry-server + tesla-api + ride-with-vic-app
 *     → live vehicle telemetry cluster: speed, charge, power, range
 *
 *   JARVIS SYSTEM ← Error-Management-System
 *     → autonomous-agent telemetry: detect→diagnose→repair cycles,
 *       system-health readouts
 */

// ---------------------------------------------------------------------------
// Tesla Dashboard — vehicle telemetry signals
// ---------------------------------------------------------------------------

export interface TeslaReadout {
  speed: number;       // km/h, 0–140
  charge: number;       // %, 30–100
  power: number;        // kW, -80 (regen) to 250 (accel)
  range: number;        // km, 150–500
  odometer: number;     // km cumulative, always rising
}

export interface JarvisEvent {
  id: number;
  phase: 'detect' | 'diagnose' | 'repair';
  project: string;
  description: string;
  timestamp: number;    // epoch ms
}

export interface JarvisReadout {
  events: JarvisEvent[];        // event log (last 10)
  systemHealth: number;          // 0–100
  activeAgents: number;          // 1–8
  errorsDetected: number;         // cumulative
  errorsRepaired: number;         // cumulative
  avgRepairTimeMs: number;        // ms
}

// Deterministic sine-wave generator — seeded by an offset so different
// signals don't phase-lock.
function sineSignal(t: number, period: number, min: number, max: number, phase: number): number {
  const amplitude = (max - min) / 2;
  const centre = (max + min) / 2;
  return centre + amplitude * Math.sin(((t + phase) / period) * Math.PI * 2);
}

function sawSignal(t: number, period: number, min: number, max: number, phase: number): number {
  const range = max - min;
  const raw = ((t + phase) % period) / period;
  return min + range * raw;
}

/**
 * Generate Tesla vehicle telemetry at time `t` (seconds since epoch / any monotonic source).
 * All signals derived from sine/saw models with deterministic phase offsets.
 */
export function generateTeslaTelemetry(t: number): TeslaReadout {
  const speed = Math.max(0, sineSignal(t, 22, -10, 140, 0));
  const charge = sineSignal(t, 180, 30, 100, 45);      // slow discharge/charge cycle
  const power = sineSignal(t, 8, -80, 250, 90);          // acceleration/regen
  const range = sineSignal(t, 120, 150, 500, 22);         // slow range estimate
  const odometer = 45182 + t * 0.0278;                    // ~100 km/h drive cycle average

  return {
    speed: Math.round(speed),
    charge: Math.round(charge),
    power: Math.round(power),
    range: Math.round(range),
    odometer: Math.round(odometer),
  };
}

// ---------------------------------------------------------------------------
// JARVIS System — autonomous-agent telemetry
// ---------------------------------------------------------------------------

const JARVIS_PROJECTS = [
  { name: 'EFDDH-Jira-Dashboard', desc: 'Sprint velocity aggregation failing on empty backlog' },
  { name: 'btr-demo', desc: 'Ephemeris calculation off by 2.3 arc-seconds' },
  { name: 'telemetry-server', desc: 'WebSocket heartbeat timeout under high load' },
  { name: 'AI-Gmail-Manager', desc: 'IMAP connection pool exhausted' },
  { name: 'Advanced-Prompt-Creator', desc: 'Token limit exceeded for GPT-4 template' },
  { name: 'ride-with-vic-app', desc: 'Geolocation permission denied on iOS 19' },
  { name: 'jyotish-shastra', desc: 'Chart rendering crash on DST boundary date' },
  { name: 'tailor-resume-with-ai', desc: 'NLP pipeline stalling on PDF parse' },
];

/**
 * Deterministic event ID generator — seeded counter, NOT random.
 */
let _eventCounter = 0;
const EVENT_INTERVAL_MS = 3200; // new event every ~3.2s

/**
 * Generate JARVIS telemetry at time `t` (seconds since epoch or monotonic).
 */
export function generateJarvisTelemetry(t: number): JarvisReadout {
  const elapsedMs = t * 1000;
  const eventCount = Math.floor(elapsedMs / EVENT_INTERVAL_MS);

  // Build event log — deterministic cycle through projects and phases
  const events: JarvisEvent[] = [];
  const startIdx = Math.max(0, eventCount - 10);
  for (let i = startIdx; i <= eventCount && events.length < 10; i++) {
    const projectIdx = i % JARVIS_PROJECTS.length;
    const phaseIdx = Math.floor(i / JARVIS_PROJECTS.length) % 3;
    const phases: JarvisEvent['phase'][] = ['detect', 'diagnose', 'repair'];
    events.push({
      id: i + 1,
      phase: phases[phaseIdx],
      project: JARVIS_PROJECTS[projectIdx].name,
      description: JARVIS_PROJECTS[projectIdx].desc,
      timestamp: i * EVENT_INTERVAL_MS,
    });
  }

  const errorsDetected = Math.floor(eventCount / 3) + 1;
  const errorsRepaired = Math.max(0, Math.floor((eventCount - 1) / 3));
  const systemHealth = Math.round(sineSignal(t, 300, 82, 100, 77));
  const activeAgents = Math.round(sineSignal(t, 60, 2, 8, 13));
  const avgRepairTimeMs = Math.round(sineSignal(t, 45, 120, 3800, 55));

  return {
    events,
    systemHealth,
    activeAgents,
    errorsDetected,
    errorsRepaired,
    avgRepairTimeMs,
  };
}

/**
 * Data-source annotation — always visible so it's clear this is a deterministic
 * simulated feed, not random noise and not a coffee-cup placeholder.
 */
export const TELEMETRY_SOURCE_LABEL = 'Deterministic simulated live feed (sine-based signal model, zero Math.random())';
