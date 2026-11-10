import { Card } from '@/components/ui/Card';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { Tag } from '@/components/ui/Tag';
import { about } from '@/content/about';

export function About() {
  return (
    <Section id="about" eyebrow="About" title="How I work" accent="work" lede={about.bio}>
      <div className="grid gap-16">
        <div className="grid gap-8">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-12">
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
            <div className="grid gap-4">
              <h3 className="reveal">Ten dimensions, answered</h3>
              {about.lede.map((paragraph) => (
                <p key={paragraph} className="type-body reveal text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <dl className="divide-y divide-line border-y border-line">
            {about.dimensions.map((dimension) => (
              <div
                key={dimension.name}
                className="grid gap-3 py-6 md:grid-cols-[14rem_1fr] md:gap-10"
              >
                <dt className="flex flex-wrap items-start gap-2 font-semibold">
                  {dimension.name}
                  {dimension.side === 'role' ? <Tag>What I look for</Tag> : null}
                </dt>
                <dd className="grid gap-2">
                  <p className="type-body">{dimension.answer}</p>
                  <p className="type-meta text-muted">Evidence · {dimension.evidence}</p>
                </dd>
              </div>
            ))}
          </dl>

          <p className="type-small text-muted">
            {about.provenance.label}{' '}
            <ExternalLink href={about.provenance.href}>
              {about.provenance.repo} · {about.provenance.path}
            </ExternalLink>
          </p>
        </div>

        <div className="reveal-stagger grid gap-4 md:grid-cols-2">
          <Card className="grid content-start gap-5 p-6 md:p-8">
            <h3>Education</h3>
            <ul className="grid gap-4">
              {about.education.map((item) => (
                <li key={item.qualification}>
                  <p className="font-medium">{item.qualification}</p>
                  <p className="type-small text-muted">{item.institution}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="grid content-start gap-5 p-6 md:p-8">
            <h3>Credentials</h3>
            <ul className="grid gap-4">
              {about.credentials.map((item) => (
                <li key={item.name}>
                  <p className="font-medium">{item.name}</p>
                  <p className="type-small text-muted">
                    {'issuer' in item ? `${item.issuer} · ` : ''}
                    {item.status}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Section>
  );
}
