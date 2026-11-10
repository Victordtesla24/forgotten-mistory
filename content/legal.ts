/**
 * Privacy policy, terms of use and the copyright line. The text is shared by the
 * footer, /privacy and /terms.
 */

import { MINIVIC_CHAT_ORIGIN } from '@/lib/assistant/origin';

import { site } from './site';

/** A run of text inside a paragraph: plain, emphasised as a term, or a link. */
export type Inline = string | { term: string } | { text: string; href: string };

interface LegalSection {
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

const COMPANY = 'V² Group of Companies Pty. Ltd.';

export const copyright = `© 2026 Portfolio Website · Vikram Deshpande · A product of ${COMPANY} · All rights reserved.`;

const mail = { text: site.channels.email, href: `mailto:${site.channels.email}` };

/** The host the assistant's function answers on, from the one place the origin is written down. */
const chatHost = new URL(MINIVIC_CHAT_ORIGIN).host;

export const privacy: LegalDocument = {
  title: 'Privacy Policy',
  description: 'What the portfolio collects, and how a message sent to its assistant is handled.',
  updated: 'Last updated 10 November 2026',
  lede: [
    'The portfolio has no accounts, sign-up, forms or shopping cart, and builds no profile of you. It sets no cookies and runs no analytics. Apart from its own files, the only requests your browser makes are the assistant’s: an empty wake-up call when you open its panel, and the message you choose to type.',
  ],
  sections: [
    {
      heading: 'Cookies, analytics and tracking',
      body: [
        [
          'A page load sets ',
          { term: 'zero cookies' },
          ', writes ',
          { term: 'zero entries' },
          ' to browser storage and makes requests to ',
          { term: 'one host' },
          ', the site’s own, until you open the assistant (described below).',
        ],
        ['The CV is served directly and ungated; downloading it identifies no one.'],
      ],
      list: {
        after: 1,
        items: [
          ['No analytics of any kind, first-party or third-party.'],
          ['No advertising, no retargeting, no tracking pixels, no fingerprinting.'],
          ['No cookies, so no cookie banner.'],
          ['No social-media embeds or share widgets loading in the background.'],
          ['No newsletter capture, no gated downloads, no contact form.'],
        ],
      },
    },
    {
      heading: 'Server logs',
      body: [
        [
          'The site is hosted on Firebase Hosting, which is operated by Google. Like any web server, it records ordinary request logs — IP address, timestamp, requested URL, user agent — as part of serving and protecting the service. Those logs are Google’s, kept under their retention policy, and are not combined with anything else here or used to build a profile. The assistant’s function runs on Google Cloud as well, and Google records ordinary request logs for it in the same way.',
        ],
      ],
    },
    {
      heading: 'The assistant',
      body: [
        [
          'The site carries a small conversational assistant, served by a function hosted on Google Cloud Run at ',
          { term: chatHost },
          '. Opening its panel sends that host, and this site’s own ',
          { term: '/api/chat' },
          ' address, a request with nothing in it: it only wakes the function before you type, and it is the only thing sent before you write a message.',
        ],
        [
          'If you then type a message, your browser sends the conversation to the Cloud Run host first, and to this site’s ',
          { term: '/api/chat' },
          ' address, which reaches the same function, if the first route is blocked or slow. The function forwards it to a language-model provider to answer: ',
          { term: 'OpenRouter' },
          ' first, then DeepSeek, Z.ai or OpenAI if the one before it is unavailable. The reply comes back the same way.',
        ],
      ],
      list: {
        after: 2,
        items: [
          [
            'Nothing you type is written to a database, a log or a file by this site. The response is returned with ',
            { term: 'no-store' },
            ' and the conversation exists only in your browser tab until you close it.',
          ],
          [
            'The message does reach whichever provider answers it, and is subject to that provider’s handling while it is there. Please do not type anything into it you would not send to a third party.',
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
          'The site links to GitHub, LinkedIn and the live sites of some of the projects it shows. Those are separate services with their own privacy practices, and nothing here loads them until you click.',
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
          'The site holds no personal data about you to access, correct or delete, because it collects none. If you have emailed and would like that correspondence removed, say so in a reply and it will be deleted. Under the Australian Privacy Act you may also complain to the Office of the Australian Information Commissioner.',
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
          'When what the site does changes, this page changes in the same release.',
        ],
      ],
    },
  ],
};

export const terms: LegalDocument = {
  title: 'Terms',
  description: 'The terms on which the portfolio is published and may be used.',
  updated: 'Last updated 10 November 2026',
  lede: [
    `The portfolio is the professional site of Vikram Deshpande, published by ${COMPANY} Using it means accepting the terms below. There is no account, no payment and no data to hand over.`,
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
      heading: '2 · Figures',
      body: [
        [
          'Every figure carries the scope it was measured in. Figures describe past engagements at a point in time; they are not a warranty, a prediction, a benchmark or a commitment about future work. Nothing here is professional, financial, legal or engineering advice.',
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
          'The site links to repositories and profiles hosted elsewhere. Those services are not controlled here, and linking to them is not an endorsement of anything else they carry.',
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
