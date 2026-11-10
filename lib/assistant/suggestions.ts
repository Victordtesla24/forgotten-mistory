/**
 * Starter questions shown before the first message. Each one is answered in
 * full by the local knowledge base (current-role, biggest-achievement,
 * availability and leadership), so it works with or without the network.
 */
export const SUGGESTED_QUESTIONS = [
  'What is your current role?',
  'What is your biggest achievement?',
  'Are you available for work?',
  'How do you lead a delivery team?',
] as const;
