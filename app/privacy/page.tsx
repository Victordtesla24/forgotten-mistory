import type { Metadata } from 'next';
import Link from 'next/link';

import { contact } from '@/app/data/siteContent';

import styles from '../legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — Vikram Deshpande',
  description:
    'What this site collects, what it does not, and what happens to a message sent to its assistant.',
  robots: { index: true, follow: true },
};

/**
 * The privacy policy.
 *
 * Every factual claim below was measured against the deployed site rather than
 * asserted from intent — cookie count, storage keys and the request host list
 * were all read from a real page load, and the assistant's data path was read
 * from `functions/index.js`. That matters more here than anywhere else on the
 * site: a privacy policy is the one document where a comfortable sentence and a
 * true one are easiest to confuse, and where being wrong costs the reader rather
 * than the author.
 *
 * It is also where the synthetic-media disclosure now lives. It used to sit in
 * the footer as a production credit; the footer became a single legal line, and
 * a disclosure that a face and a voice are generated belongs in the document a
 * reader opens to find out what they are dealing with.
 */
export default function PrivacyPolicy() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href="/">
          ← Back to the portfolio
        </Link>

        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated 3 September 2026</p>

        <p className={styles.lede}>
          This is a portfolio site. It has no accounts, no sign-up, no forms and no shopping cart,
          and it is not trying to build a profile of you. The short version: it sets no cookies and
          runs no analytics, and the only thing that leaves your browser is a message you choose to
          type into the assistant.
        </p>

        <section className={styles.section}>
          <h2 className={styles.heading}>What this site does not do</h2>
          <p className={styles.body}>
            Measured against the live site rather than claimed: a page load sets{' '}
            <span className={styles.term}>zero cookies</span>, writes{' '}
            <span className={styles.term}>zero entries</span> to browser storage, and makes requests
            to <span className={styles.term}>one host</span> — this site&rsquo;s own.
          </p>
          <ul className={styles.list}>
            <li>No analytics of any kind, first-party or third-party.</li>
            <li>No advertising, no retargeting, no tracking pixels, no fingerprinting.</li>
            <li>No cookies, and therefore no cookie banner to dismiss.</li>
            <li>No social-media embeds or share widgets loading in the background.</li>
            <li>No newsletter capture, no gated downloads, no contact form.</li>
          </ul>
          <p className={styles.body}>
            The CV linked from this site is served directly and ungated. Downloading it tells nobody
            anything.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Server logs</h2>
          <p className={styles.body}>
            The site is hosted on Firebase Hosting, which is operated by Google. Like any web
            server, it records ordinary request logs — IP address, timestamp, requested URL, user
            agent — as part of serving and protecting the service. Those logs are Google&rsquo;s,
            kept under their retention policy, and are not combined with anything else here or used
            to build a profile. This is stated because it is true of every website, including the
            ones that do not mention it.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>The assistant</h2>
          <p className={styles.body}>
            The site carries a small conversational assistant. If you open it and type a message,
            that message is sent to a server function on this site, which forwards the conversation
            to <span className={styles.term}>OpenRouter</span> for a language model to answer. The
            reply comes back the same way.
          </p>
          <ul className={styles.list}>
            <li>
              Nothing you type is written to a database, a log or a file by this site. The response
              is returned with <span className={styles.term}>no-store</span> and the conversation
              exists only in your browser tab until you close it.
            </li>
            <li>
              The message does reach OpenRouter and the model provider behind it, and is subject to
              their handling while it is there. Please do not type anything into it you would not
              send to a third party.
            </li>
            <li>
              The API credential lives on the server and is never sent to your browser.
            </li>
            <li>
              The assistant answers from published material about this portfolio. It can still be
              wrong; treat anything decision-relevant as something to confirm with a human.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Synthetic media</h2>
          <p className={styles.body}>
            The assistant&rsquo;s face is a model-generated likeness built from Vikram
            Deshpande&rsquo;s own photograph, and its greeting is his own voice, cloned. Both are
            his; neither is a recording of him. Nothing else on the site — no figure, no drawing, no
            line of text — is generated.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Links away from here</h2>
          <p className={styles.body}>
            The site links to GitHub, LinkedIn and YouTube. Those are other people&rsquo;s services
            with their own privacy practices, and nothing here loads them until you click. A video
            is never embedded in a way that contacts a third party before you ask for it.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Email</h2>
          <p className={styles.body}>
            Contacting support opens your own mail client addressed to{' '}
            <a className={styles.link} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
            . From that point it is ordinary email: it is kept in that inbox and used to reply to
            you. It is not added to a mailing list.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Your rights, and how to use them</h2>
          <p className={styles.body}>
            This site holds no personal data about you to access, correct or delete, because it
            collects none. If you have emailed and would like that correspondence removed, say so
            in a reply and it will be deleted. Under the Australian Privacy Act you may also
            complain to the Office of the Australian Information Commissioner.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Children</h2>
          <p className={styles.body}>
            The site is a professional portfolio, not directed at children, and knowingly collects
            nothing from anyone.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Changes</h2>
          <p className={styles.body}>
            If what the site does changes, this page changes in the same release. A privacy policy
            that lags the code it describes is worse than none, because it is believed.
          </p>
        </section>

        <p className={styles.footNote}>
          © 2026 Portfolio Website · Vikram Deshpande · A product of V2 Group of Companies Pty.
          Ltd. · All rights reserved.
        </p>
      </div>
    </main>
  );
}
