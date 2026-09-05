/**
 * listen.ts — the closing section's copy, and there is very little of it.
 *
 * Under sixty visible words, immediately after the densest screen on the site.
 * The residue in memory is meant to be the absence of the instrument after five
 * screens of it: no chart, no table, no rail, no scene. One sentence, one rule,
 * four real anchors, and a way to buy him a coffee.
 *
 * The sentence is a statement of disposition rather than a claim of fact, which
 * is why it is the one line on the site that carries no source — and holding
 * that distinction properly is itself the standard the rest of the page argues
 * for.
 */

import { contact } from '../siteContent';

/**
 * The client's door, and what it does when opened.
 *
 * There is no booking tool on this account — checked by key NAME in
 * .env.production, never by value: 45 names, none matching
 * cal|calendar|book|schedul|meet (docs/architecture/LISTEN-FLAGSHIP.md §3.1) —
 * and a calendar link that 404s is worse than none. So the plate does the
 * scheduling work a booking page would: the mailto arrives with a subject and a
 * four-line agenda the sender edits in place. Every line is a prompt to the
 * sender; none is a promise. No response time is printed because none is
 * sourced (siteContent.ts: nothing here promises a response time).
 *
 * Melbourne is sourced — `contact.location` and `coffee` below both say so.
 * Straight apostrophe on purpose: a mailto body is read by mail clients, and
 * ASCII survives every one of them.
 */
const ENGAGE_SUBJECT = '20-minute call — Vikram Deshpande';
const ENGAGE_AGENDA = [
  "What you're building:",
  'The decision you need made:',
  'Two or three times that suit you (Melbourne time):',
  'Anything I should read first:',
] as const;
/**
 * Fully percent-encoded, line breaks as %0A, and held under 900 characters:
 * older desktop clients truncate long mailto URLs (TC-LISTEN-CTA-02).
 */
const ENGAGE_HREF = `mailto:${contact.email}?subject=${encodeURIComponent(
  ENGAGE_SUBJECT,
)}&body=${encodeURIComponent(ENGAGE_AGENDA.join('\n'))}`;

export const listenContent = {
  kicker: 'Always willing to listen',
  title: 'Feedback & coffee?',
  /** The only italic on the entire site. Twenty words. */
  sentence:
    'I have been wrong often enough to want to hear it early. Tell me what you think — I’ll listen properly.',
  /**
   * The client's action, and the only filled plate in the section.
   *
   * A business client had nowhere to finish on this page: the four routes are
   * addresses, and the two buttons on the site both hand a recruiter the CV
   * (R-c13 CC-02). The route is a pre-addressed enquiry the visitor's own
   * client can send, and the agenda in its body is what makes it a scheduling
   * handshake rather than a blank compose window (ADV-1451Z P1, one door).
   */
  engage: {
    label: 'Email a 20-minute-call agenda',
    subject: ENGAGE_SUBJECT,
    agenda: ENGAGE_AGENDA,
    href: ENGAGE_HREF,
  },
  channels: [
    { label: contact.email, href: `mailto:${contact.email}`, kind: 'email' },
    { label: contact.phone, href: contact.phoneHref, kind: 'phone' },
    {
      label: 'linkedin.com/in/vikramd-profile',
      href: contact.linkedin,
      kind: 'external',
    },
    { label: 'github.com/Victordtesla24', href: contact.github, kind: 'external' },
  ],
  coffee: 'Coffee · Melbourne CBD · I’ll come to you',
} as const;
