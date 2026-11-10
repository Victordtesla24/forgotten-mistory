/**
 * The front door's copy. Figures live in proof.ts; the career scale is drawn from
 * experience.ts.
 */

import { site } from './site';

export interface HeroAction {
  label: string;
  href: string;
}

export interface HeroContent {
  name: string;
  location: string;
  availability: string;
  /** The H1 in three parts so that the middle phrase can be set in the serif italic. */
  headline: { lead: string; emphasis: string; tail: string };
  /** One sentence. It is the whole pitch. */
  statement: string;
  actions: { primary: HeroAction; secondary: HeroAction };
  links: readonly HeroAction[];
}

export const hero: HeroContent = {
  name: site.name,
  location: site.location.display,
  availability: site.availability,
  headline: { lead: 'Delivery leader and ', emphasis: 'AI solutions', tail: ' architect.' },
  statement:
    "Sixteen years leading delivery across government, banking and telecommunications, May 2010 to September 2026 — currently Scrum Master and Project Manager on the Australian Taxation Office's Payday Super program.",
  actions: {
    primary: { label: 'View selected work', href: '#work' },
    secondary: { label: 'Download CV', href: site.cvHref },
  },
  links: [
    { label: 'LinkedIn', href: site.channels.linkedin },
    { label: 'GitHub', href: site.channels.github },
    { label: 'Email', href: `mailto:${site.channels.email}` },
  ],
};
