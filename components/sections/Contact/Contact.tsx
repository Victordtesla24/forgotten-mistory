import { ButtonLink } from '@/components/ui/Button';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { contact } from '@/content/contact';

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="Start with a 20-minute call" accent="20-minute call" lede={contact.line}>
      <div className="reveal flex flex-wrap items-center gap-x-8 gap-y-4">
        <ButtonLink
          href={contact.action.href}
          size="lg"
          magnetic
          title={contact.action.hint}
          aria-describedby="contact-action-hint"
        >
          {contact.action.label}
        </ButtonLink>
        <span id="contact-action-hint" className="sr-only">
          {contact.action.hint}
        </span>
        <ul className="flex flex-wrap items-center gap-x-6">
          {contact.channels.map((channel) => (
            <li key={channel.kind}>
              {channel.kind === 'linkedin' || channel.kind === 'github' ? (
                <ExternalLink href={channel.href} className="type-small min-h-11">
                  {channel.label}
                </ExternalLink>
              ) : (
                <a
                  href={channel.href}
                  className="type-small inline-flex min-h-11 items-center text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                >
                  {channel.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
