import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { Section } from '@/components/ui/Section';
import { SnapRow } from '@/components/ui/SnapRow';
import { Tag } from '@/components/ui/Tag';
import { about, type Credential, type Principle, type Qualification } from '@/content/about';

function PrincipleCard({ principle }: { principle: Principle }) {
  return (
    <Card as="article" aria-labelledby={`principle-${principle.id}`} className="p-0">
      <Disclosure
        id={`principle-${principle.id}-detail`}
        summaryClassName="items-center px-4 py-2"
        panelClassName="grid gap-3 border-t border-line p-4"
        summary={
          <h3 id={`principle-${principle.id}`} className="text-[1.0625rem]">
            {principle.title}
          </h3>
        }
      >
        <p className="font-medium">{principle.statement}</p>
        {principle.detail ? <p className="type-small text-muted">{principle.detail}</p> : null}
        <Tag className="self-start max-sm:whitespace-normal">{principle.scope}</Tag>
      </Disclosure>
    </Card>
  );
}

/** A qualification or certification: its name, then its institution or its standing. */
function Chip({ item }: { item: Qualification | Credential }) {
  return (
    <Card className="px-4 py-2" spotlight={false}>
      <p className="font-medium">{item.name}</p>
      <p className="type-small text-muted">{'institution' in item ? item.institution : item.status}</p>
    </Card>
  );
}

export function About() {
  const chips: readonly (Qualification | Credential)[] = [...about.education, ...about.credentials];
  return (
    <Section id="about" eyebrow="About" title="How I work" accent="work">
      <div className="grid gap-8">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
          <figure className="reveal overflow-hidden rounded-md border border-line bg-surface">
            <picture>
              <source srcSet={about.portrait.avif} type="image/avif" />
              <source srcSet={about.portrait.webp} type="image/webp" />
              <img
                src={about.portrait.png}
                alt={about.portrait.alt}
                width={about.portrait.width}
                height={about.portrait.height}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </picture>
          </figure>
          <p className="reveal text-[1.1875rem] leading-relaxed text-muted">
            {about.bio.join(' ')}
          </p>
        </div>

        <SnapRow
          columns={3}
          aria-label="Working principles"
          className="reveal max-sm:mx-0 max-sm:snap-none max-sm:flex-col max-sm:items-stretch max-sm:gap-2 max-sm:overflow-visible max-sm:px-0 max-sm:pb-0 max-sm:*:min-w-0 max-sm:*:basis-auto"
        >
          {about.principles.map((principle) => (
            <li key={principle.id}>
              <PrincipleCard principle={principle} />
            </li>
          ))}
        </SnapRow>

        <div className="reveal">
          <h3 className="sr-only">Education and certifications</h3>
          <ul className="flex flex-wrap gap-2">
            {chips.map((item) => (
              <li key={item.name}>
                <Chip item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
