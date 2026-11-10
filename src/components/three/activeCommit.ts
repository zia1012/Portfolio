/**
 * Tiny external store for the timeline commit currently in the middle of the viewport.
 * Written by CommitTracker, read by the 3D laptop screen. No React state involved.
 * Same pattern as activeProject.ts: the tracker only observes while something is subscribed.
 */

type Listener = () => void;

let activeIndex: number | null = null;
const listeners = new Set<Listener>();
const consumerListeners = new Set<Listener>();

export function getActiveCommit(): number | null {
  return activeIndex;
}

export function setActiveCommit(index: number | null): void {
  if (index === activeIndex) return;
  activeIndex = index;
  listeners.forEach((listener) => listener());
}

/** Subscribe to active-index changes. Subscribing also marks the store as "in use". */
export function subscribeActiveCommit(listener: Listener): () => void {
  listeners.add(listener);
  consumerListeners.forEach((callback) => callback());
  return () => {
    listeners.delete(listener);
    consumerListeners.forEach((callback) => callback());
  };
}

export function hasActiveCommitConsumers(): boolean {
  return listeners.size > 0;
}

/** Called when the number of consumers changes; lets the tracker start or stop observing. */
export function subscribeActiveCommitConsumers(callback: Listener): () => void {
  consumerListeners.add(callback);
  return () => {
    consumerListeners.delete(callback);
  };
}
