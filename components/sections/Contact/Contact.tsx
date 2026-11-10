import { Mail } from 'lucide-react';

import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { contact } from '@/content/contact';

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Get in touch" accent="touch" lede={contact.headline}>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="reveal grid content-start gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={contact.primary.href} size="lg" magnetic>
              <Mail aria-hidden="true" className="size-5" />
              {contact.primary.label}
            </ButtonLink>
            <ButtonLink href={contact.engagement.href} size="lg" variant="secondary">
              {contact.engagement.label}
            </ButtonLink>
          </div>
          <p className="type-small max-w-[48ch] text-muted">{contact.engagement.hint}</p>
          <p className="type-serif-em max-w-[22ch] text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-tight">
            {contact.invitation}
          </p>
        </div>

        <Card className="reveal grid content-start gap-5 p-6 md:p-8">
          <h3>Elsewhere</h3>
          <ul className="grid gap-1">
            {contact.channels
              .filter((channel) => channel.kind !== 'email')
              .map((channel) => (
                <li key={channel.kind}>
                  {channel.kind === 'phone' ? (
                    <a
                      href={channel.href}
                      className="inline-flex min-h-11 items-center text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                    >
                      {channel.label}
                    </a>
                  ) : (
                    <ExternalLink href={channel.href} className="min-h-11">
                      {channel.label}
                    </ExternalLink>
                  )}
                </li>
              ))}
          </ul>
          <p className="type-meta border-t border-line pt-5 text-muted">{contact.coffee}</p>
        </Card>
      </div>
    </Section>
  );
}
