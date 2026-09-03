'use client';

import { useCallback, useRef, useState } from 'react';

import { avatarContent } from '@/app/data/portfolio/avatar';

import styles from './Avatar.module.css';

/**
 * The avatar — a synthetic introduction, labelled as one.
 *
 * At rest it is a portrait the width of a paragraph, a play control, and the
 * disclosure in plain sight. It costs the page a poster image and nothing else:
 * `preload="none"` means the video is not fetched until someone asks for it, so
 * a visitor who never presses play never pays for it.
 *
 * Three rules govern this component, and they are the reason it can sit on a
 * site whose whole argument is about evidence:
 *
 *   1. The disclosure is visible before playing, not after, and not only in the
 *      audio. A reader who never presses play still learns what it is.
 *   2. The transcript is on the page as text. The clip is never the only place
 *      its content exists — nobody is required to watch a synthetic face to get
 *      the information.
 *   3. It never autoplays and never loops. A talking head that starts by itself
 *      is an advertisement; one that waits to be asked is an offer.
 */
export default function Avatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const play = useCallback(() => {
    setStarted(true);
    // The element only gets a source once asked for, so the play call has to
    // wait for it to be attached.
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {
        // Autoplay policies can still refuse; the native controls remain.
      });
    });
  }, []);

  return (
    <figure className={styles.avatar}>
      <div className={styles.frame} data-started={started || undefined}>
        {started ? (
          <video
            ref={videoRef}
            className={styles.video}
            poster={avatarContent.poster}
            controls
            playsInline
            preload="auto"
          >
            <source src={avatarContent.video} type="video/mp4" />
            <track
              kind="captions"
              src={avatarContent.captions}
              srcLang="en"
              label="English"
              default
            />
          </video>
        ) : (
          <button type="button" className={styles.trigger} onClick={play}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static
                export has no image optimiser at runtime; the poster is already
                sized and compressed for its slot. */}
            <img
              className={styles.poster}
              src={avatarContent.poster}
              alt="Vikram Deshpande, from the photograph this clip was rendered from"
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
            />
            <span className={styles.play} aria-hidden="true" />
            <span className={styles.invitation}>{avatarContent.invitation}</span>
          </button>
        )}
      </div>

      <figcaption className={styles.caption}>
        <p className={styles.disclosure}>{avatarContent.disclosure}</p>

        <button
          type="button"
          className={styles.transcriptToggle}
          aria-expanded={transcriptOpen}
          aria-controls="avatar-transcript"
          onClick={() => setTranscriptOpen((open) => !open)}
        >
          {transcriptOpen ? 'Hide transcript' : 'Read it instead'}
        </button>

        <div id="avatar-transcript" className={styles.transcript} hidden={!transcriptOpen}>
          {avatarContent.transcript.map((line) => (
            <p key={line.slice(0, 30)}>{line}</p>
          ))}
          <dl className={styles.provenance}>
            {avatarContent.provenance.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </figcaption>
    </figure>
  );
}
