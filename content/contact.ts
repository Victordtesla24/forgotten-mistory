/**
 * The closing section: who to write to, and the one door for a 20-minute call.
 */

import { site } from './site';

const { channels } = site;

const ENGAGEMENT_SUBJECT = '20-minute call — Vikram Deshpande';
const ENGAGEMENT_AGENDA = [
  'Hiring or a project:',
  "What you're building:",
  'The decision you need made:',
  'Two or three times that suit you (Melbourne time):',
  'Anything I should read first:',
] as const;

export interface ContactChannel {
  kind: 'email' | 'phone' | 'linkedin' | 'github';
  label: string;
  href: string;
}

export const contact = {
  headline:
    'Open to Scrum Master / Project Manager roles in Melbourne — and selected AI delivery engagements.',
  email: channels.email,
  phone: channels.phone,
  phoneHref: channels.phoneHref,
  linkedin: channels.linkedin,
  github: channels.github,
  youtube: channels.youtube,
  /** The primary action: an email to the inbox. */
  primary: { label: channels.email, href: `mailto:${channels.email}` },
  /**
   * There is no booking tool on this account, so the call is arranged by email:
   * the message arrives with a subject and a five-line agenda the sender edits in
   * place. Percent-encoded with line breaks as %0A and held under 900 characters,
   * because older desktop mail clients truncate long mailto URLs.
   */
  engagement: {
    label: 'Book a 20-minute call',
    hint: 'Opens an email with a five-line agenda for you to edit.',
    subject: ENGAGEMENT_SUBJECT,
    agenda: ENGAGEMENT_AGENDA,
    href: `mailto:${channels.email}?subject=${encodeURIComponent(
      ENGAGEMENT_SUBJECT,
    )}&body=${encodeURIComponent(ENGAGEMENT_AGENDA.join('\n'))}`,
  },
  /** The footer's support link: the same inbox, with a subject that says why. */
  support: {
    label: 'Contact support',
    href: `mailto:${channels.email}?subject=${encodeURIComponent('Portfolio — support')}`,
  },
  channels: [
    { kind: 'email', label: channels.email, href: `mailto:${channels.email}` },
    { kind: 'phone', label: channels.phone, href: channels.phoneHref },
    { kind: 'linkedin', label: 'linkedin.com/in/vikramd-profile', href: channels.linkedin },
    { kind: 'github', label: 'github.com/Victordtesla24', href: channels.github },
  ] satisfies ContactChannel[],
  invitation:
    'I have been wrong often enough to want to hear it early. Tell me what you think — I’ll listen properly.',
  coffee: 'Coffee · Melbourne CBD · I’ll come to you',
} as const;
