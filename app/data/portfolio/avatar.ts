/**
 * avatar.ts — the introduction, and the disclosure that goes with it.
 *
 * The clip in the closing section is a synthetic rendering: Vikram's own
 * photograph, his own cloned voice, and a model that animated one to the other.
 * Every fact about how it was made is stated on the page, in visible text, next
 * to the play control — not in a tooltip, not in a footnote, and not only in
 * the audio.
 *
 * That is not a legal hedge. The whole site argues that a claim should carry
 * its source, and an unlabelled synthetic face would contradict that argument
 * more loudly than any section could make it. The disclosure is also the first
 * thing the clip itself says.
 *
 * The transcript below is the exact script that was spoken, and it doubles as
 * the caption source, so a reader who never presses play — or who cannot hear
 * it — gets the identical content.
 */

export const avatarContent = {
  /** Shown beside the resting portrait. */
  invitation: 'A word from me — 29 seconds',
  /**
   * The disclosure. Visible before playing, not after.
   */
  disclosure:
    'AI-generated: my photograph, my cloned voice, animated by a model. Nothing else on this site is synthetic.',
  /** How it was made, for anyone who wants the detail. */
  provenance: [
    { label: 'Face', value: 'my own photograph, unretouched framing' },
    { label: 'Voice', value: 'my own voice, cloned from a recording of me' },
    { label: 'Render', value: 'ByteDance OmniHuman 1.5, one take, no edit' },
    { label: 'Script', value: 'written by me; the transcript is below, verbatim' },
  ],
  poster: '/assets/avatar/poster.jpg',
  video: '/assets/avatar/introduction.mp4',
  captions: '/assets/avatar/introduction.vtt',
  durationSeconds: 29,
  /** The spoken words, verbatim. Also the caption source. */
  transcript: [
    "Hello. I'm Vikram Deshpande.",
    "What you're watching is an AI-generated avatar — my photograph, my own cloned voice, rendered by a model. I'm telling you that straight away, because I build systems that are not allowed to fabricate their own evidence.",
    'Everything else here is real. The figures come from my CV, and from repositories you can open and read. Where something could not honestly be measured, the page says so.',
    'If any of it is useful to you, I would welcome a conversation.',
  ],
} as const;
