/**
 * The hero's career scale asks the Experience timeline to select a role. The two sections
 * share no component, so the request travels through this module: a bar that is activated
 * before the timeline has hydrated is held and delivered the moment it listens.
 */

type Listener = (id: string) => void;

const listeners = new Set<Listener>();
let waiting: string | null = null;

/** Asks the Experience timeline to select `id`, now or as soon as it is listening. */
export function requestRole(id: string): void {
  if (listeners.size === 0) {
    waiting = id;
    return;
  }
  for (const listener of listeners) listener(id);
}

/** Listens for requests, starting with one that arrived early. Returns an unsubscribe. */
export function onRoleRequest(listener: Listener): () => void {
  listeners.add(listener);
  if (waiting !== null) {
    const id = waiting;
    waiting = null;
    listener(id);
  }
  return () => {
    listeners.delete(listener);
  };
}
