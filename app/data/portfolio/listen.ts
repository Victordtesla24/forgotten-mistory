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
   * (R-c13 CC-02). There is no booking tool on this account, and inventing a
   * calendar link that 404s would be worse than none — so the route is a
   * pre-addressed enquiry the visitor's own client can send. The subject is
   * what makes it an engagement rather than a blank compose window.
   */
  engage: {
    label: 'Start a project',
    subject: 'Engagement enquiry — Vikram Deshpande',
    href: `mailto:${contact.email}?subject=${encodeURIComponent(
      'Engagement enquiry — Vikram Deshpande',
    )}`,
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
