import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Ruler } from '@/components/ui/Ruler';
import { NOW, TIMELINE_START } from '@/content/experience';
import { hero } from '@/content/hero';

export function Hero() {
  const { headline } = hero;
  return (
    <section
      id="top"
      aria-labelledby="top-title"
      className="hero-glow pt-[clamp(3.5rem,9vw,7rem)] pb-[clamp(2rem,5vw,4rem)]"
    >
      <Container>
        <p className="type-eyebrow max-w-none text-muted">
          {hero.name} · {hero.location} · {hero.availability}
        </p>
        <h1 id="top-title" className="type-hero mt-6 max-w-[20ch]">
          {headline.lead}
          <em className="type-serif-em text-accent">{headline.emphasis}</em>
          {headline.tail}
        </h1>
        <p className="mt-8 max-w-[56ch] text-[1.1875rem] leading-relaxed text-muted">
          {hero.statement}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ButtonLink href={hero.actions.primary.href} size="lg" magnetic>
            {hero.actions.primary.label}
          </ButtonLink>
          <ButtonLink href={hero.actions.secondary.href} size="lg" variant="secondary" download>
            {hero.actions.secondary.label}
          </ButtonLink>
        </div>

        <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1">
          {hero.links.map((link) => (
            <li key={link.label}>
              <ExternalLink href={link.href} className="type-small min-h-11">
                {link.label}
              </ExternalLink>
            </li>
          ))}
        </ul>

        <Ruler
          min={TIMELINE_START}
          max={Math.floor(NOW)}
          step={1}
          labelStep={4}
          label={`Career timeline, ${TIMELINE_START} to ${Math.floor(NOW)}`}
          className="mt-16"
        />
      </Container>
    </section>
  );
}
