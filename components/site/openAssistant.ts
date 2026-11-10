/** The window event that opens the Ask Mini Vic panel. The panel listens for it. */
export const ASSISTANT_OPEN_EVENT = 'assistant:open';

export function openAssistant(): void {
  window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT));
}
