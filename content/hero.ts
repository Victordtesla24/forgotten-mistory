/**
 * The front door: who, one line of positioning, two actions and three links. The
 * headline figures live in proof.ts; the career scale is drawn from experience.ts.
 */

import { site } from './site';

interface HeroAction {
  label: string;
  href: string;
}

interface HeroContent {
  eyebrow: {
    name: string;
    location: string;
    availability: string;
  };
  /** The H1 in three parts so that the middle phrase can be set in the serif italic. */
  headline: { lead: string; emphasis: string; tail: string };
  /** Role, domain and differentiator in one line of at most 22 words. */
  positioning: string;
  actions: { primary: HeroAction; secondary: HeroAction };
  links: readonly HeroAction[];
}

export const hero: HeroContent = {
  eyebrow: {
    name: site.name,
    location: site.location.display,
    availability: site.availability,
  },
  headline: { lead: 'Delivery leader and ', emphasis: 'AI solutions', tail: ' architect.' },
  positioning:
    'Scrum Master and Project Manager at the Australian Taxation Office (ATO) who architects mainframe test automation and multi-agent AI systems.',
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
