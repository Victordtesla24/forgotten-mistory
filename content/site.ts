/**
 * Identity, role, location, availability, public channels and SEO text.
 * Everything here is kept in parity with the CV (public/docs/Vik_Resume_Final.pdf).
 */

export const SITE_URL = 'https://forgotten-mistory.web.app';

export interface Site {
  /** Full name as it appears on the CV. */
  name: string;
  /** Name of the website itself, used for Open Graph and JSON-LD. */
  siteName: string;
  /** Short role line, used in the hero eyebrow area and the header. */
  role: string;
  /** Current position, used for structured data. */
  jobTitle: string;
  employer: string;
  location: {
    /** Human-readable, used on the page. */
    display: string;
    locality: string;
    country: string;
  };
  availability: string;
  url: string;
  /** Absolute URL of the portrait used in structured data. */
  image: string;
  cvHref: string;
  repositoryHref: string;
  channels: {
    email: string;
    phone: string;
    phoneHref: string;
    linkedin: string;
    github: string;
    youtube: string;
  };
  seo: {
    title: string;
    description: string;
    siteDescription: string;
    ogImage: { url: string; width: number; height: number };
  };
}

export const site: Site = {
  name: 'Vikram Deshpande',
  siteName: 'Forgotten Mistory',
  role: 'Delivery leadership · AI solutions architecture',
  jobTitle: 'Scrum Master / Project Manager — Australian Taxation Office',
  employer: 'Australian Taxation Office',
  location: {
    display: 'Melbourne, Australia',
    locality: 'Melbourne',
    country: 'AU',
  },
  availability: 'Open to delivery-leadership and AI engagements',
  url: SITE_URL,
  image: `${SITE_URL}/assets/my_avatar.png`,
  cvHref: '/docs/Vik_Resume_Final.pdf',
  repositoryHref: 'https://github.com/Victordtesla24/forgotten-mistory',
  channels: {
    email: 'sarkar.vikram@gmail.com',
    phone: '+61 433 224 556',
    phoneHref: 'tel:+61433224556',
    linkedin: 'https://www.linkedin.com/in/vikramd-profile',
    github: 'https://github.com/Victordtesla24',
    youtube: 'https://youtube.com/@vicd0ct',
  },
  seo: {
    title: 'Vikram Deshpande — Scrum Master / Project Manager · AI Solutions Architect',
    description:
      'Scrum Master / Project Manager at the Australian Taxation Office and AI Solutions Architect based in Melbourne.',
    siteDescription: 'Portfolio and AI systems showcase for Vikram Deshpande.',
    ogImage: { url: '/assets/og-image.png', width: 1200, height: 630 },
  },
};
