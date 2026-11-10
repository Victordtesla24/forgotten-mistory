/**
 * The public Cloud Run origin of the chat function, read from the single config
 * point config/minivic-origin.json. An empty string means "no direct route":
 * every send goes through the same-origin /api/chat rewrite, which always works.
 *
 * This URL is public — it is where the chat function is served. No credential is
 * carried here or reachable through it.
 */
import { originUrl } from '@/config/minivic-origin.json';

export const MINIVIC_CHAT_ORIGIN: string = originUrl;
