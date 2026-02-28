import type { VisemeEvent } from "../types.js";

export type SmoothingConfig = {
  minVisemeIntervalMs: number;
  mergeWindowMs: number;
  criticalVisemeMinDurationMs: number;
};

const CRITICAL_VISEMES = new Set(["A", "E", "O", "U", "WQ", "FV", "L"]);

export function smoothVisemes(events: VisemeEvent[], config: SmoothingConfig): VisemeEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.startMs - b.startMs);
  const merged: VisemeEvent[] = [];

  for (const current of sorted) {
    if (merged.length === 0) {
      merged.push({ ...current });
      continue;
    }

    const prev = merged[merged.length - 1];
    const gap = current.startMs - prev.endMs;
    const sameViseme = prev.viseme === current.viseme;

    if (sameViseme || gap <= config.mergeWindowMs) {
      prev.endMs = Math.max(prev.endMs, current.endMs);
      prev.confidence = Math.max(prev.confidence ?? 0, current.confidence ?? 0);
      continue;
    }

    if (current.startMs - prev.startMs < config.minVisemeIntervalMs) {
      prev.endMs = Math.max(prev.endMs, current.endMs);
      continue;
    }

    merged.push({ ...current });
  }

  for (const event of merged) {
    const duration = event.endMs - event.startMs;
    if (CRITICAL_VISEMES.has(event.viseme) && duration < config.criticalVisemeMinDurationMs) {
      event.endMs = event.startMs + config.criticalVisemeMinDurationMs;
    }
  }

  return merged;
}
