import Link from 'next/link';

import { buildStamp } from '@/app/data/generated/build-stamp';
import { cvFingerprint } from '@/app/data/generated/cv-fingerprint';
import { footerContent } from '@/app/data/portfolio/footer';
import { contact } from '@/app/data/siteContent';

import styles from './Footer.module.css';

/**
 * The footer — one line, set quietly, in the site's own type.
 *
 * Three links and a copyright. It carries no argument of its own: the page above
 * it has already made every claim it intends to make, and a closing screen that
 * restates them competes with the last thing a reader actually looked at.
 *
 * *Contact support* opens the reader's own mail client addressed to the owner's
 * inbox, so the path to a conversation costs one click and no form. There is no
 * capture here and nothing gated.
 */

const SUPPORT_SUBJECT = encodeURIComponent('Portfolio — support');

const buildProvenance =
  buildStamp.clean && buildStamp.sha
    ? `${footerContent.build.label}: ${buildStamp.sha}`
    : footerContent.build.unstampedLabel;

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.line}>
        <Link className={styles.link} href="/privacy">
          Privacy Policy
        </Link>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <Link className={styles.link} href="/terms">
          Terms
        </Link>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <a className={styles.link} href={`mailto:${contact.email}?subject=${SUPPORT_SUBJECT}`}>
          Contact support
        </a>
        <span className={styles.sep} aria-hidden="true">
          ·
        </span>
        <span className={styles.legal}>
          © 2026 Portfolio Website · Vikram Deshpande · A product of V
          <sup className={styles.sup}>2</sup> Group of Companies Pty. Ltd. · All rights reserved.
        </span>
      </p>
      <p className={styles.provenance}>
        <a className={styles.link} href={footerContent.cv.href} download target="_blank" rel="noreferrer">
          {footerContent.cv.label}
        </a>{' '}
        {footerContent.cv.md5Label} <code className={styles.code}>{cvFingerprint.md5}</code> · {buildProvenance}.
      </p>
      <p className={styles.disclosure}>{footerContent.syntheticDisclosure}</p>
    </footer>
  );
}
