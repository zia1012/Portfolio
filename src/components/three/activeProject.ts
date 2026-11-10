/**
 * Tiny external store for the project card currently in the middle of the viewport.
 * Written by ProjectsTracker, read by the 3D laptop screen. No React state involved.
 *
 * The tracker only observes cards while something is subscribed (the 3D scene), so it
 * costs nothing when the scene is not mounted (reduced motion, no WebGL).
 */

type Listener = () => void;

let activeSlug: string | null = null;
const listeners = new Set<Listener>();
const consumerListeners = new Set<Listener>();

export function getActiveProject(): string | null {
  return activeSlug;
}

export function setActiveProject(slug: string | null): void {
  if (slug === activeSlug) return;
  activeSlug = slug;
  listeners.forEach((listener) => listener());
}

/** Subscribe to active-slug changes. Subscribing also marks the store as "in use". */
export function subscribeActiveProject(listener: Listener): () => void {
  listeners.add(listener);
  consumerListeners.forEach((callback) => callback());
  return () => {
    listeners.delete(listener);
    consumerListeners.forEach((callback) => callback());
  };
}

export function hasActiveProjectConsumers(): boolean {
  return listeners.size > 0;
}

/** Called when the number of consumers changes; lets the tracker start or stop observing. */
export function subscribeActiveProjectConsumers(callback: Listener): () => void {
  consumerListeners.add(callback);
  return () => {
    consumerListeners.delete(callback);
  };
}
