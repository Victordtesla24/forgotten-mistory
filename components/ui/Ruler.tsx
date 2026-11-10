import { scaleLinear } from 'd3-scale';

import { cn } from '@/lib/cn';

interface RulerProps {
  /** The first value on the scale. */
  min: number;
  /** The last value on the scale. */
  max: number;
  /** Distance between ticks. */
  step: number;
  /** Distance between numbered, taller ticks. Omit for an unnumbered scale with a taller tick every fifth step. */
  labelStep?: number;
  /** Formats a numeral. Defaults to the plain number. */
  format?: (value: number) => string;
  /** A text alternative. Without one the ruler is decorative and hidden from assistive technology. */
  label?: string;
  className?: string;
}

const MINOR = 6;
const MAJOR = 12;
const NUMERAL_BASELINE = MAJOR + 17;
const NUMERAL_SIZE = 13;
const UNNUMBERED_MAJOR_EVERY = 5;

/**
 * The site's one ornament: a scale of fine ticks with mono numerals. Positions
 * are percentages of the width so the scale stretches without distorting type.
 */
export function Ruler({ min, max, step, labelStep, format, label, className }: RulerProps) {
  const position = scaleLinear().domain([min, max]).range([0, 100]);
  const count = Math.round((max - min) / step);
  const every = labelStep ? Math.max(1, Math.round(labelStep / step)) : UNNUMBERED_MAJOR_EVERY;
  const height = labelStep ? NUMERAL_BASELINE + 4 : MAJOR + 1;

  const ticks = Array.from({ length: count + 1 }, (_, index) => {
    const value = min + index * step;
    return {
      value,
      x: `${position(value)}%`,
      major: index % every === 0,
      anchor: index === 0 ? 'start' : index === count ? 'end' : 'middle',
    } as const;
  });

  return (
    <svg
      width="100%"
      height={height}
      className={cn('block overflow-visible', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <line x1="0" x2="100%" y1="0.5" y2="0.5" className="stroke-line-strong" strokeWidth="1" />
      {ticks.map((tick) => (
        <line
          key={tick.value}
          x1={tick.x}
          x2={tick.x}
          y1="0"
          y2={tick.major ? MAJOR : MINOR}
          className={tick.major ? 'stroke-muted' : 'stroke-line-strong'}
          strokeWidth="1"
          shapeRendering="crispEdges"
        />
      ))}
      {ticks
        .filter((tick) => labelStep && tick.major)
        .map((tick) => (
          <text
            key={tick.value}
            x={tick.x}
            y={NUMERAL_BASELINE}
            textAnchor={tick.anchor}
            fontSize={NUMERAL_SIZE}
            className="fill-muted font-mono"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {format ? format(tick.value) : tick.value}
          </text>
        ))}
    </svg>
  );
}
