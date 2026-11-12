/**
 * The closing section: one line, one action and the other channels. The call is
 * arranged by email, so the action opens a message with a subject and a five-line
 * agenda the sender edits in place.
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

interface ContactChannel {
  kind: 'email' | 'phone' | 'linkedin' | 'github';
  label: string;
  href: string;
}

export const contact = {
  line: site.availability,
  /**
   * Percent-encoded with line breaks as %0A and held under 900 characters, because
   * older desktop mail clients truncate long mailto URLs.
   */
  action: {
    label: 'Book a 20-minute call',
    hint: 'Opens an email with a five-line agenda. Coffee in the Melbourne CBD; I will come to you.',
    href: `mailto:${channels.email}?subject=${encodeURIComponent(
      ENGAGEMENT_SUBJECT,
    )}&body=${encodeURIComponent(ENGAGEMENT_AGENDA.join('\n'))}`,
  },
  /** For a reader with no mail app set up: the address itself, put on the clipboard. */
  copy: {
    address: channels.email,
    label: 'Copy email address',
    done: 'Email address copied',
    failed: 'Copying is not available',
  },
  /** The footer's link for a fault on the site: the same inbox, with a subject that says why. */
  support: {
    label: 'Report a site problem',
    href: `mailto:${channels.email}?subject=${encodeURIComponent('Portfolio — site problem')}`,
  },
  channels: [
    { kind: 'email', label: channels.email, href: `mailto:${channels.email}` },
    { kind: 'phone', label: channels.phone, href: channels.phoneHref },
    { kind: 'linkedin', label: 'linkedin.com/in/vikram-publicprofile', href: channels.linkedin },
    { kind: 'github', label: 'github.com/Victordtesla24', href: channels.github },
  ] satisfies ContactChannel[],
} as const;
