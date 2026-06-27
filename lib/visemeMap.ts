/**
 * visemeMap.ts — phoneme→viseme→mouth-shape mapping for frame-accurate lip-sync.
 *
 * Maps the standard 21 D-ID / Microsoft viseme set to canvas drawing parameters
 * so the mouth canvas in MiniVicBot.tsx can render proper viseme shapes rather
 * than pure amplitude-driven waveforms (the D-2 defect fix).
 *
 * Each viseme defines:
 *  - upperLipY: vertical offset of upper lip center
 *  - lowerLipY: vertical offset of lower lip center
 *  - jawDrop: how far the jaw opens (0–1)
 *  - lipRound: rounding of the lips (0–1; 1 = fully rounded for /u/)
 *  - lipWidth: horizontal narrowing (0–1; 1 = full width, 0.6 = puckered)
 *  - teeth: whether teeth are visible (true for /f/, /v/)
 *
 * Reference: D-ID Viseme Reference Table (21 visemes), mapped to standard
 * IPA mouth shapes. Viseme 0 = silence/rest.
 */

export interface VisemeShape {
  /** Viseme index (0–21, D-ID convention) */
  index: number;
  /** Descriptive label */
  label: string;
  /** Example phoneme(s) */
  phonemes: string;
  /** Upper lip vertical offset from center (px, negative = up) */
  upperLipY: number;
  /** Lower lip vertical offset from center (px, positive = down) */
  lowerLipY: number;
  /** Jaw openness 0–1 (0 = closed, 1 = fully open) */
  jawDrop: number;
  /** Lip rounding 0–1 (0 = spread, 1 = fully rounded) */
  lipRound: number;
  /** Horizontal lip width factor (1 = neutral, <1 = narrower) */
  lipWidth: number;
  /** Whether teeth/lip contact surface is visible */
  teethVisible: boolean;
}

/**
 * The 21-viseme set mapped to drawing parameters.
 * Values are tuned for a ~200×100px canvas rendering area and the holographic
 * monochrome style (PALETTE.steel strokes on transparent).
 */
export const VISEME_SHAPES: VisemeShape[] = [
  // 0 — silence / rest (neutral closed mouth)
  { index: 0, label: 'sil', phonemes: 'silence', upperLipY: -3, lowerLipY: 3, jawDrop: 0.0, lipRound: 0.0, lipWidth: 1.0, teethVisible: false },
  // 1 — AE, AX, AH (schwa-like, slightly open)
  { index: 1, label: 'AE', phonemes: 'ae, ax, ah', upperLipY: -5, lowerLipY: 5, jawDrop: 0.15, lipRound: 0.0, lipWidth: 0.95, teethVisible: false },
  // 2 — AA (wide open "ah")
  { index: 2, label: 'AA', phonemes: 'aa', upperLipY: -7, lowerLipY: 10, jawDrop: 0.45, lipRound: 0.0, lipWidth: 0.88, teethVisible: false },
  // 3 — AO (rounded "aw")
  { index: 3, label: 'AO', phonemes: 'ao', upperLipY: -5, lowerLipY: 7, jawDrop: 0.30, lipRound: 0.55, lipWidth: 0.80, teethVisible: false },
  // 4 — EY, EH (half-smile "eh")
  { index: 4, label: 'EY', phonemes: 'ey, eh, uh', upperLipY: -4, lowerLipY: 4, jawDrop: 0.10, lipRound: 0.0, lipWidth: 1.02, teethVisible: false },
  // 5 — ER (r-colored, slightly rounded)
  { index: 5, label: 'ER', phonemes: 'er', upperLipY: -3, lowerLipY: 5, jawDrop: 0.15, lipRound: 0.25, lipWidth: 0.92, teethVisible: false },
  // 6 — IH, IY (spread "ee")
  { index: 6, label: 'IH', phonemes: 'ih, iy', upperLipY: -4, lowerLipY: 2, jawDrop: 0.05, lipRound: 0.0, lipWidth: 1.08, teethVisible: false },
  // 7 — W, UW (rounded "oo")
  { index: 7, label: 'UW', phonemes: 'w, uw', upperLipY: -2, lowerLipY: 2, jawDrop: 0.02, lipRound: 0.95, lipWidth: 0.55, teethVisible: false },
  // 8 — OW (diphthong "oh")
  { index: 8, label: 'OW', phonemes: 'ow', upperLipY: -3, lowerLipY: 5, jawDrop: 0.20, lipRound: 0.65, lipWidth: 0.70, teethVisible: false },
  // 9 — AW (wide-open diphthong "ow")
  { index: 9, label: 'AW', phonemes: 'aw', upperLipY: -6, lowerLipY: 9, jawDrop: 0.40, lipRound: 0.30, lipWidth: 0.85, teethVisible: false },
  // 10 — OY (diphthong "oy")
  { index: 10, label: 'OY', phonemes: 'oy', upperLipY: -4, lowerLipY: 6, jawDrop: 0.22, lipRound: 0.60, lipWidth: 0.72, teethVisible: false },
  // 11 — AY (diphthong "ai/eye")
  { index: 11, label: 'AY', phonemes: 'ay', upperLipY: -5, lowerLipY: 8, jawDrop: 0.35, lipRound: 0.05, lipWidth: 0.90, teethVisible: false },
  // 12 — H (aspirate, open)
  { index: 12, label: 'H', phonemes: 'h', upperLipY: -4, lowerLipY: 6, jawDrop: 0.20, lipRound: 0.0, lipWidth: 0.95, teethVisible: false },
  // 13 — R (retroflex/approximant)
  { index: 13, label: 'R', phonemes: 'r', upperLipY: -3, lowerLipY: 4, jawDrop: 0.12, lipRound: 0.30, lipWidth: 0.90, teethVisible: false },
  // 14 — L (lateral, tongue tip)
  { index: 14, label: 'L', phonemes: 'l', upperLipY: -4, lowerLipY: 5, jawDrop: 0.15, lipRound: 0.0, lipWidth: 0.95, teethVisible: false },
  // 15 — S, Z (alveolar fricative, teeth together)
  { index: 15, label: 'S', phonemes: 's, z', upperLipY: -2, lowerLipY: 2, jawDrop: 0.04, lipRound: 0.0, lipWidth: 1.05, teethVisible: true },
  // 16 — SH, CH, JH (postalveolar, rounded)
  { index: 16, label: 'SH', phonemes: 'sh, ch, jh', upperLipY: -2, lowerLipY: 3, jawDrop: 0.08, lipRound: 0.50, lipWidth: 0.80, teethVisible: false },
  // 17 — TH, DH (dental fricative, tongue between teeth)
  { index: 17, label: 'TH', phonemes: 'th, dh', upperLipY: -2, lowerLipY: 4, jawDrop: 0.10, lipRound: 0.0, lipWidth: 1.0, teethVisible: true },
  // 18 — F, V (labiodental, lower lip under upper teeth)
  { index: 18, label: 'FV', phonemes: 'f, v', upperLipY: -2, lowerLipY: 2, jawDrop: 0.03, lipRound: 0.0, lipWidth: 1.0, teethVisible: true },
  // 19 — NG, K, G (velar, back of mouth)
  { index: 19, label: 'NG', phonemes: 'ng, k, g', upperLipY: -3, lowerLipY: 5, jawDrop: 0.12, lipRound: 0.0, lipWidth: 0.95, teethVisible: false },
  // 20 — P, B, M (bilabial, lips together)
  { index: 20, label: 'PB', phonemes: 'p, b, m', upperLipY: -1, lowerLipY: 1, jawDrop: 0.01, lipRound: 0.0, lipWidth: 0.90, teethVisible: false },
  // 21 — T, D, N (alveolar stop/nasal)
  { index: 21, label: 'TD', phonemes: 't, d, n', upperLipY: -2, lowerLipY: 2, jawDrop: 0.04, lipRound: 0.0, lipWidth: 1.0, teethVisible: false },
];

/**
 * Look up a viseme by index.
 */
export function getVisemeShape(index: number): VisemeShape {
  return VISEME_SHAPES[index] ?? VISEME_SHAPES[0];
}

/**
 * Interpolate between two viseme shapes by a blend factor (0–1).
 * Used for smooth transitions between visemes in real-time rendering.
 */
export function lerpVisemeShapes(a: VisemeShape, b: VisemeShape, t: number): VisemeShape {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    index: a.index,
    label: `${a.label}→${b.label}`,
    phonemes: '',
    upperLipY: a.upperLipY + (b.upperLipY - a.upperLipY) * clampedT,
    lowerLipY: a.lowerLipY + (b.lowerLipY - a.lowerLipY) * clampedT,
    jawDrop: a.jawDrop + (b.jawDrop - a.jawDrop) * clampedT,
    lipRound: a.lipRound + (b.lipRound - a.lipRound) * clampedT,
    lipWidth: a.lipWidth + (b.lipWidth - a.lipWidth) * clampedT,
    teethVisible: clampedT < 0.5 ? a.teethVisible : b.teethVisible,
  };
}

/**
 * Derive an approximate viseme index from raw audio frequency bins.
 *
 * This is a heuristic fallback for when the full viseme extraction pipeline
 * (services/viseme-bridge) is not available — it estimates mouth openness
 * and rounding from the audio spectrum. Used by the canvas-based mouth
 * renderer in the static/default tier.
 *
 * The mapping:
 *  - Average amplitude over threshold → maps to jawDrop
 *  - High-frequency energy vs low-frequency energy → distinguishes
 *    sibilants (S/SH/FV) from vowels
 *  - Mid-frequency dominance → rounded vowels (UW, OW)
 *
 * Returns a viseme index and confidence (0–1).
 */
export function heuristicVisemeFromFrequency(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
): { visemeIndex: number; confidence: number } {
  const bins = frequencyData.length;
  if (bins === 0) return { visemeIndex: 0, confidence: 1 };

  // Split into low (<500Hz), mid (500–2000Hz), high (>2000Hz)
  const binWidth = sampleRate / fftSize;
  const lowEnd = Math.min(Math.floor(500 / binWidth), bins);
  const midEnd = Math.min(Math.floor(2000 / binWidth), bins);

  let lowSum = 0, midSum = 0, highSum = 0;
  let lowCount = 0, midCount = 0, highCount = 0;
  let totalSum = 0;

  for (let i = 0; i < bins; i++) {
    const v = frequencyData[i];
    totalSum += v;
    if (i < lowEnd) { lowSum += v; lowCount++; }
    else if (i < midEnd) { midSum += v; midCount++; }
    else { highSum += v; highCount++; }
  }

  const avgAmplitude = totalSum / bins / 255; // 0–1
  const lowAvg = lowCount > 0 ? lowSum / lowCount / 255 : 0;
  const midAvg = midCount > 0 ? midSum / midCount / 255 : 0;
  const highAvg = highCount > 0 ? highSum / highCount / 255 : 0;

  // Silence
  if (avgAmplitude < 0.02) return { visemeIndex: 0, confidence: 1 };

  const jawDrop = Math.min(avgAmplitude * 1.5, 1);
  const sibilance = highAvg / Math.max(lowAvg + midAvg, 0.001);
  const midDominance = midAvg / Math.max(lowAvg + highAvg, 0.001);

  // Sibilant sounds (S, SH, FV) — high-frequency dominant
  if (sibilance > 2.0 && avgAmplitude > 0.08) {
    if (midDominance > 1.2) return { visemeIndex: 16, confidence: 0.7 }; // SH
    return { visemeIndex: 15, confidence: 0.65 }; // S
  }

  // Rounded vowels — mid-frequency dominant
  if (midDominance > 1.5 && jawDrop < 0.35) {
    return { visemeIndex: 7, confidence: 0.6 }; // UW
  }
  if (midDominance > 1.2 && jawDrop < 0.3) {
    return { visemeIndex: 8, confidence: 0.55 }; // OW
  }

  // Open vowels — high amplitude, low-frequency dominant
  if (jawDrop > 0.35) {
    return { visemeIndex: 2, confidence: 0.7 }; // AA
  }
  if (jawDrop > 0.2) {
    return { visemeIndex: 3, confidence: 0.6 }; // AO
  }

  // Moderate openness — neutral vowel
  if (jawDrop > 0.1) {
    return { visemeIndex: 1, confidence: 0.5 }; // AE
  }

  // Closed sounds (P/B/M, T/D/N)
  return { visemeIndex: 20, confidence: 0.4 }; // PB
}

export type { VisemeShape as VisemeShapeType };
