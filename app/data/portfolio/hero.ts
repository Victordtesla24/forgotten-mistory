/**
 * hero.ts — the front door's copy, and nothing else.
 *
 * Budget: under fifty words of prose above the fold. The previous hero ran to
 * roughly a hundred and fifty across a greeting, a title, a location line, an
 * availability line, four proof figures, a two-paragraph subtitle, two CTA
 * pillars, a five-link bar and a meta row — so a reader arriving from a CV link
 * had to parse a page before learning anything. Everything here is traceable to
 * public/docs/Vik_Resume_Final.pdf; the rest of the site carries the detail.
 */

import { contact } from '../siteContent';

export interface LedgerEntry {
  /** The figure itself, pre-formatted — these are quoted, not computed. */
  value: string;
  label: string;
  /** Where the number comes from. Shown on the page: a number without a source is a boast. */
  source: string;
}

export const heroContent = {
  name: 'Vikram Deshpande',
  role: 'Delivery leadership · AI solutions architecture',
  location: 'Melbourne, Australia',
  availability: 'Open to delivery-leadership and AI engagements',
  /** One sentence. Twenty-nine words. It is the whole pitch. */
  statement:
    "Sixteen years leading delivery across government, banking and telecommunications — currently Scrum Master and Project Manager on the Australian Taxation Office's Payday Super program.",
  ledger: [
    {
      value: '≈92%',
      label: 'evidence effort removed',
      source: 'ATO Payday Super · 200+ SIT scenarios',
    },
    {
      value: '$5M+',
      label: 'program portfolio led',
      source: 'ANZ · 5+ squads, 40+ practitioners',
    },
    {
      value: '10k+',
      label: 'devices at P95 < 200 ms',
      source: 'ANZ · real-time telemetry platform',
    },
  ] satisfies LedgerEntry[],
  actions: {
    primary: { label: 'See the evidence', href: '#experience' },
    secondary: { label: 'Download CV', href: '/docs/Vik_Resume_Final.pdf' },
  },
  links: [
    { label: 'LinkedIn', href: contact.linkedin },
    { label: 'GitHub', href: contact.github },
    { label: 'Email', href: `mailto:${contact.email}` },
  ],
} as const;
