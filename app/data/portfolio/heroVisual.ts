export const heroVisualContent = {
  opticsLabel: 'Local optical field',
  observatory: {
    title: 'Session observatory',
    description:
      'Browser-local sample only. No server, GPU, portfolio or tracking metrics are read or sent.',
    initialStatus: 'Not sampled',
    startLabel: 'Start session sample',
    stopLabel: 'Stop session sample',
    unavailable:
      'requestAnimationFrame is not available in this browser context, so no interval sample was taken.',
    resourceCountUnavailable: 'session resource count unavailable (Resource Timing API unavailable)',
    sourceLabel: 'Source: browser local performance.now + requestAnimationFrame; viewport and resource count from this page session.',
  },
} as const;
