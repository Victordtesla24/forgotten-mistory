/**
 * Privacy policy, terms of use and the copyright line. The text is shared by the
 * footer, /privacy and /terms.
 */

import { site } from './site';

/** A run of text inside a paragraph: plain, emphasised as a term, or a link. */
export type Inline = string | { term: string } | { text: string; href: string };

export interface LegalSection {
  heading: string;
  /** Paragraphs, in order. */
  body: readonly (readonly Inline[])[];
  /** Bullet points printed after the first `listAfter` paragraphs. */
  list?: { after: number; items: readonly (readonly Inline[])[] };
}

export interface LegalDocument {
  title: string;
  description: string;
  updated: string;
  lede: readonly Inline[];
  sections: readonly LegalSection[];
}

export const COMPANY = 'V² Group of Companies Pty. Ltd.';

export const copyright = `© 2026 Portfolio Website · Vikram Deshpande · A product of ${COMPANY} · All rights reserved.`;

const mail = { text: site.channels.email, href: `mailto:${site.channels.email}` };

export const privacy: LegalDocument = {
  title: 'Privacy Policy',
  description:
    'What this site collects, what it does not, and what happens to a message sent to its assistant.',
  updated: 'Last updated 3 September 2026',
  lede: [
    'This is a portfolio site. It has no accounts, no sign-up, no forms and no shopping cart, and it is not trying to build a profile of you. The short version: it sets no cookies and runs no analytics, and the only thing that leaves your browser is a message you choose to type into the assistant.',
  ],
  sections: [
    {
      heading: 'What this site does not do',
      body: [
        [
          'Measured against the live site rather than claimed: a page load sets ',
          { term: 'zero cookies' },
          ', writes ',
          { term: 'zero entries' },
          ' to browser storage, and makes requests to ',
          { term: 'one host' },
          ' — this site’s own.',
        ],
        [
          'The CV linked from this site is served directly and ungated. Downloading it tells nobody anything.',
        ],
      ],
      list: {
        after: 1,
        items: [
          ['No analytics of any kind, first-party or third-party.'],
          ['No advertising, no retargeting, no tracking pixels, no fingerprinting.'],
          ['No cookies, and therefore no cookie banner to dismiss.'],
          ['No social-media embeds or share widgets loading in the background.'],
          ['No newsletter capture, no gated downloads, no contact form.'],
        ],
      },
    },
    {
      heading: 'Server logs',
      body: [
        [
          'The site is hosted on Firebase Hosting, which is operated by Google. Like any web server, it records ordinary request logs — IP address, timestamp, requested URL, user agent — as part of serving and protecting the service. Those logs are Google’s, kept under their retention policy, and are not combined with anything else here or used to build a profile. This is stated because it is true of every website, including the ones that do not mention it.',
        ],
      ],
    },
    {
      heading: 'The assistant',
      body: [
        [
          'The site carries a small conversational assistant. If you open it and type a message, that message is sent to a server function on this site, which forwards the conversation to ',
          { term: 'OpenRouter' },
          ' for a language model to answer. The reply comes back the same way.',
        ],
      ],
      list: {
        after: 1,
        items: [
          [
            'Nothing you type is written to a database, a log or a file by this site. The response is returned with ',
            { term: 'no-store' },
            ' and the conversation exists only in your browser tab until you close it.',
          ],
          [
            'The message does reach OpenRouter and the model provider behind it, and is subject to their handling while it is there. Please do not type anything into it you would not send to a third party.',
          ],
          ['The API credential lives on the server and is never sent to your browser.'],
          [
            'The assistant answers from published material about this portfolio. It can still be wrong; treat anything decision-relevant as something to confirm with a human.',
          ],
        ],
      },
    },
    {
      heading: 'Links away from here',
      body: [
        [
          'The site links to GitHub, LinkedIn and YouTube. Those are other people’s services with their own privacy practices, and nothing here loads them until you click. A video is never embedded in a way that contacts a third party before you ask for it.',
        ],
      ],
    },
    {
      heading: 'Email',
      body: [
        [
          'Contacting support opens your own mail client addressed to ',
          mail,
          '. From that point it is ordinary email: it is kept in that inbox and used to reply to you. It is not added to a mailing list.',
        ],
      ],
    },
    {
      heading: 'Your rights, and how to use them',
      body: [
        [
          'This site holds no personal data about you to access, correct or delete, because it collects none. If you have emailed and would like that correspondence removed, say so in a reply and it will be deleted. Under the Australian Privacy Act you may also complain to the Office of the Australian Information Commissioner.',
        ],
      ],
    },
    {
      heading: 'Children',
      body: [
        [
          'The site is a professional portfolio, not directed at children, and knowingly collects nothing from anyone.',
        ],
      ],
    },
    {
      heading: 'Changes',
      body: [
        [
          'If what the site does changes, this page changes in the same release. A privacy policy that lags the code it describes is worse than none, because it is believed.',
        ],
      ],
    },
  ],
};

export const terms: LegalDocument = {
  title: 'Terms',
  description: 'The terms on which this portfolio site is published and may be used.',
  updated: 'Last updated 3 September 2026',
  lede: [
    `This site is the professional portfolio of Vikram Deshpande, published by ${COMPANY} Using it means accepting the terms below. They are short because the site asks nothing of you: there is no account, no payment and no data to hand over.`,
  ],
  sections: [
    {
      heading: '1 · Ownership',
      body: [
        [
          `The text, design, code, diagrams, data visualisations and media on this site are owned by ${COMPANY} and Vikram Deshpande. All rights reserved.`,
        ],
        [
          'You are welcome to read it, quote it with attribution, and link to it. You may not republish it wholesale, present it as your own work, or reuse the design system or source in a commercial product without written permission. Third-party names, trademarks and logos that appear here belong to their owners and are used only to describe real work.',
        ],
      ],
    },
    {
      heading: '2 · What the figures are',
      body: [
        [
          'Every figure on the site is presented with the source it came from, and where something could not be honestly measured the site says so rather than estimating. That is a standard held to carefully — it is not a warranty. Figures describe past engagements at a point in time; they are not a prediction, a benchmark, or a commitment about future work. Nothing here is professional, financial, legal or engineering advice.',
        ],
      ],
    },
    {
      heading: '3 · The assistant',
      body: [
        [
          `The conversational assistant is powered by a language model and can be wrong, out of date, or confidently mistaken. Its answers are not statements by Vikram Deshpande or by ${COMPANY}, are not an offer or a representation, and should not be relied on for any decision. If something matters, confirm it with a person — the `,
          { text: 'contact address', href: mail.href },
          ' is at the bottom of every page.',
        ],
        [
          'Please use it in good faith. Do not attempt to extract credentials, exhaust the service, or use it to generate unlawful or abusive content. Access may be rate-limited or withdrawn to keep it available and affordable.',
        ],
      ],
    },
    {
      heading: '4 · Availability',
      body: [
        [
          `The site is published as-is and as-available, without warranty of any kind. It may be changed, taken down, or unavailable at any time without notice. To the maximum extent the law allows, ${COMPANY} and Vikram Deshpande are not liable for any loss arising from use of, or inability to use, this site.`,
        ],
        [
          'Nothing in these terms excludes or limits any right you have under the Australian Consumer Law or other law that cannot lawfully be excluded.',
        ],
      ],
    },
    {
      heading: '5 · Links away from here',
      body: [
        [
          'The site links to repositories, profiles and videos hosted elsewhere. Those services are not controlled here, and linking to them is not an endorsement of anything else they carry.',
        ],
      ],
    },
    {
      heading: '6 · Privacy',
      body: [
        [
          'What the site collects, and what it deliberately does not, is set out in the ',
          { text: 'Privacy Policy', href: '/privacy' },
          '.',
        ],
      ],
    },
    {
      heading: '7 · Governing law',
      body: [
        [
          'These terms are governed by the laws of Victoria, Australia, and the courts of Victoria have jurisdiction over any dispute arising from them.',
        ],
      ],
    },
    {
      heading: '8 · Changes',
      body: [
        [
          'These terms may be updated. The date at the top of this page is the date of the version you are reading.',
        ],
      ],
    },
  ],
};
