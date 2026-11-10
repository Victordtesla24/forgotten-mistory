/**
 * The three headline figures, each with the scope it was measured in, and the
 * employers the career has been spent with.
 */

export interface ProofFigure {
  id: string;
  /** Printed before the number, for example "≈" or "$". */
  prefix: string;
  value: number;
  /** Printed after the number, for example "%" or "M+". */
  suffix: string;
  label: string;
  /** Where and over what the figure was measured. A figure never appears without it. */
  scope: string;
}

export const proofFigures: readonly ProofFigure[] = [
  {
    id: 'evidence',
    prefix: '≈',
    value: 92,
    suffix: '%',
    label: 'evidence effort removed',
    scope: 'ATO Payday Super · 200+ SIT scenarios',
  },
  {
    id: 'portfolio',
    prefix: '$',
    value: 5,
    suffix: 'M+',
    label: 'program portfolio led',
    scope: 'ANZ · 5+ squads, up to 40 practitioners',
  },
  {
    id: 'telemetry',
    prefix: '',
    value: 10,
    suffix: 'k+',
    label: 'devices at P95 < 200 ms',
    scope: 'ANZ · real-time telemetry platform',
  },
];

export const proofEmployers = {
  label: 'Experience across government, finance & telecommunications',
  names: ['Australian Taxation Office', 'ANZ', 'NAB', 'Microsoft', 'Telstra'],
} as const;
