/**
 * The public Cloud Run origin of the chat function, and the one place it is written
 * down. An empty string means "no direct route": every send goes through the
 * same-origin /api/chat rewrite, which always works.
 *
 * This URL is public: it is where the chat function is served. No credential is
 * carried here or reachable through it. The Content-Security-Policy in firebase.json
 * must name the same origin in connect-src; tests/csp.spec.ts fails when it does not.
 */
export const MINIVIC_CHAT_ORIGIN = 'https://minivicchat-hjdyjsrzvq-uc.a.run.app';
