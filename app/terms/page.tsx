import type { Metadata } from 'next';
import Link from 'next/link';

import { contact } from '@/app/data/siteContent';

import styles from '../legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms — Vikram Deshpande',
  description: 'The terms on which this portfolio site is published and may be used.',
  robots: { index: true, follow: true },
};

/**
 * The terms of use.
 *
 * Short on purpose. This is a portfolio, not a product: there is no account to
 * suspend, no subscription to govern and no transaction to unwind, so a long
 * agreement here would be theatre. What it does cover is real — who owns the
 * work, what the figures on the site are and are not, that the assistant can be
 * wrong, and which law applies.
 */
export default function Terms() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href="/">
          ← Back to the portfolio
        </Link>

        <h1 className={styles.title}>Terms</h1>
        <p className={styles.updated}>Last updated 3 September 2026</p>

        <p className={styles.lede}>
          This site is the professional portfolio of Vikram Deshpande, published by V<sup className={styles.sup}>2</sup>{' '}
          Group of Companies Pty. Ltd. Using it means accepting the terms below. They are short because the
          site asks nothing of you: there is no account, no payment and no data to hand over.
        </p>

        <section className={styles.section}>
          <h2 className={styles.heading}>1 · Ownership</h2>
          <p className={styles.body}>
            The text, design, code, diagrams, data visualisations and media on this site are owned
            by V<sup className={styles.sup}>2</sup> Group of Companies Pty. Ltd. and Vikram Deshpande. All rights reserved.
          </p>
          <p className={styles.body}>
            You are welcome to read it, quote it with attribution, and link to it. You may not
            republish it wholesale, present it as your own work, or reuse the design system or
            source in a commercial product without written permission. Third-party names,
            trademarks and logos that appear here belong to their owners and are used only to
            describe real work.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>2 · What the figures are</h2>
          <p className={styles.body}>
            Every figure on the site is presented with the source it came from, and where something
            could not be honestly measured the site says so rather than estimating. That is a
            standard held to carefully — it is not a warranty. Figures describe past engagements at
            a point in time; they are not a prediction, a benchmark, or a commitment about future
            work. Nothing here is professional, financial, legal or engineering advice.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>3 · The assistant</h2>
          <p className={styles.body}>
            The conversational assistant is powered by a language model and can be wrong, out of
            date, or confidently mistaken. Its answers are not statements by Vikram Deshpande or by
            V<sup className={styles.sup}>2</sup> Group of Companies Pty. Ltd., are not an offer or a representation, and should not be
            relied on for any decision. If something matters, confirm it with a person — the{' '}
            <a className={styles.link} href={`mailto:${contact.email}`}>
              contact address
            </a>{' '}
            is at the bottom of every page.
          </p>
          <p className={styles.body}>
            Please use it in good faith. Do not attempt to extract credentials, exhaust the service,
            or use it to generate unlawful or abusive content. Access may be rate-limited or
            withdrawn to keep it available and affordable.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>4 · Availability</h2>
          <p className={styles.body}>
            The site is published as-is and as-available, without warranty of any kind. It may be
            changed, taken down, or unavailable at any time without notice. To the maximum extent
            the law allows, V<sup className={styles.sup}>2</sup> Group of Companies Pty. Ltd. and Vikram Deshpande are not liable for
            any loss arising from use of, or inability to use, this site.
          </p>
          <p className={styles.body}>
            Nothing in these terms excludes or limits any right you have under the Australian
            Consumer Law or other law that cannot lawfully be excluded.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>5 · Links away from here</h2>
          <p className={styles.body}>
            The site links to repositories, profiles and videos hosted elsewhere. Those services are
            not controlled here, and linking to them is not an endorsement of anything else they
            carry.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>6 · Privacy</h2>
          <p className={styles.body}>
            What the site collects, and what it deliberately does not, is set out in the{' '}
            <Link className={styles.link} href="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>7 · Governing law</h2>
          <p className={styles.body}>
            These terms are governed by the laws of Victoria, Australia, and the courts of Victoria
            have jurisdiction over any dispute arising from them.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>8 · Changes</h2>
          <p className={styles.body}>
            These terms may be updated. The date at the top of this page is the date of the version
            you are reading.
          </p>
        </section>

        <p className={styles.footNote}>
          © 2026 Portfolio Website · Vikram Deshpande · A product of V<sup className={styles.sup}>2</sup> Group of Companies Pty. Ltd. · All rights reserved.
        </p>
      </div>
    </main>
  );
}
