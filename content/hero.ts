/**
 * The front door: who, one line of positioning, two actions and three links. The
 * headline figures live in proof.ts; the career is the Experience section's, drawn from experience.ts.
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
  };
  /** The H1 in three parts so that the middle phrase can be set in the serif italic. */
  headline: { lead: string; emphasis: string; tail: string };
  /** One outcome with its scope, then tenure, sectors and the current employer: one line of at most 20 words. */
  positioning: string;
  actions: { primary: HeroAction; secondary: HeroAction };
  links: readonly HeroAction[];
}

export const hero: HeroContent = {
  eyebrow: {
    name: site.name,
    location: site.location.display,
  },
  headline: { lead: 'Delivery leader and ', emphasis: 'AI solutions', tail: ' architect.' },
  positioning:
    'Cut core-banking delivery time 30%+ at ANZ. 15+ years delivering in banking, telecoms and government; now at the ATO.',
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
