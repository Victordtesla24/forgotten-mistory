import { Container } from '@/components/ui/Container';
import { Figure } from '@/components/ui/Figure';
import { Ruler } from '@/components/ui/Ruler';
import { proofEmployers, proofFigures } from '@/content/proof';

/** The three headline figures, each with its scope, and the employers they were earned with. */
export function Proof() {
  return (
    <section id="proof" aria-labelledby="proof-title">
      <Container>
        <Ruler min={0} max={60} step={1} />
        <h2 id="proof-title" className="sr-only">
          Headline figures
        </h2>

        <ul className="reveal-stagger mt-8 grid divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface/70 shadow-card md:grid-cols-3 md:divide-x md:divide-y-0">
          {proofFigures.map((figure) => (
            <li key={figure.id} className="flex flex-col gap-4 p-6 md:p-8">
              <Figure
                value={figure.value}
                prefix={figure.prefix}
                suffix={figure.suffix}
                className="text-proof"
              />
              <div className="grid gap-2">
                <p className="text-[1.0625rem] leading-snug font-medium">{figure.label}</p>
                <p className="type-meta max-w-none text-muted">{figure.scope}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="reveal mt-12 grid gap-4">
          <p className="type-eyebrow max-w-none text-muted">{proofEmployers.label}</p>
          <ul className="flex flex-wrap gap-x-10 gap-y-3">
            {proofEmployers.names.map((name) => (
              <li key={name} className="text-[1.25rem] font-semibold tracking-tight text-text/70">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
