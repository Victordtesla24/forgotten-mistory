/** One turn of a conversation, in the shape the chat function takes. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * What a send yields, in order: any number of `delta` fragments as the model
 * writes them (only when the function streams), then exactly one `reply`. The
 * reply carries the whole, final answer and replaces whatever the deltas
 * rendered, so a reader never keeps text the sanitiser or the trimmer removed.
 *
 * A send that is aborted ends without a `reply`.
 */
export type AssistantEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'reply';
      text: string;
      /** `local` means the network path failed and the knowledge base answered. */
      via: 'live' | 'local';
      /** The buffered route answered under a smaller output ceiling, so the answer is short on purpose. */
      shortened: boolean;
    };
