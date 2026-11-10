import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Figure } from '@/components/ui/Figure';
import { proofEmployers, proofFigures } from '@/content/proof';

export function Proof() {
  return (
    <section id="proof" aria-labelledby="proof-title" className="pt-[clamp(1rem,3vw,2rem)]">
      <Container>
        <h2 id="proof-title" className="sr-only">
          Headline figures
        </h2>
        <ul className="reveal-stagger grid gap-4 md:grid-cols-3">
          {proofFigures.map((figure) => (
            <Card as="li" key={figure.id} className="flex flex-col gap-3 p-6 md:p-8">
              <Figure
                value={figure.value}
                prefix={figure.prefix}
                suffix={figure.suffix}
                className="text-proof"
              />
              <p className="text-[1.0625rem] font-medium">{figure.label}</p>
              <p className="type-meta text-muted">{figure.scope}</p>
            </Card>
          ))}
        </ul>

        <div className="reveal mt-12">
          <p className="type-eyebrow text-muted">{proofEmployers.label}</p>
          <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
            {proofEmployers.names.map((name) => (
              <li key={name} className="text-[1.25rem] font-semibold tracking-tight text-text/80">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
