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
  /**
   * The corrections ledger. The rows are not here — they are read out of the
   * repository's history at build time by scripts/build/feedback_log.mjs,
   * because a hand-written list of times you took feedback well is not
   * evidence of anything.
   */
  ledger: {
    title: 'What I was told I had got wrong',
    lede:
      'The line above is a claim, so here is the evidence for it: the last corrections made to this page, in the words of the commit that made each one. The reviews behind them are a mix of people and adversarial agents pointed at my own work. The corrections are the same either way, and every one of them is a link to the diff.',
    commitBase: 'https://github.com/Victordtesla24/forgotten-mistory/commit/',
  },
  colophon:
    '© 2026 Vikram Deshpande · Melbourne · static export · at most one WebGL context per section, and none on a phone · no analytics, no trackers, no cookies',
} as const;
