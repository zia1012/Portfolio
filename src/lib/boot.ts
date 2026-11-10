/**
 * Shared state for the boot intro (src/components/ui/BootIntro.tsx).
 *
 * Other intros (hero typing, particle initials) call `onBootDone` so they do not play hidden
 * behind the overlay. When there is no overlay (returning visitor, reduced motion, other
 * pages) `isBooting()` is false and callbacks run at once, so nothing changes for them.
 *
 * Timing constants (ms). Change them here.
 */

/** Shortest time the overlay stays up before it may fade, so the lines can be read. */
export const BOOT_MIN_MS = 1000;
/** Hard cap: the overlay starts fading by now even if the scene is slow or never loads. */
export const BOOT_MAX_MS = 2500;
/** Opacity fade-out. Keep in sync with --boot-fade in globals.css. */
export const BOOT_FADE_MS = 300;
/** After this the overlay ignores the pointer (see globals.css). */
export const BOOT_PASS_MS = 1200;

let sceneReady = false;
let bootDone = false;
const sceneListeners = new Set<() => void>();
const doneListeners = new Set<() => void>();

/** True while the overlay is in the document and has not started to leave. */
export function isBooting(): boolean {
  if (typeof document === "undefined" || bootDone) return false;
  return (
    document.getElementById("boot") !== null && document.documentElement.dataset.booted === undefined
  );
}

/** Runs `cb` once the overlay starts to leave (immediately if it is not up). Returns an unsubscribe. */
export function onBootDone(cb: () => void): () => void {
  if (!isBooting()) {
    cb();
    return () => {};
  }
  doneListeners.add(cb);
  return () => {
    doneListeners.delete(cb);
  };
}

/** Called by BootIntro when it starts to fade out (or is dismissed). */
export function markBootDone(): void {
  if (bootDone) return;
  bootDone = true;
  document.documentElement.dataset.booted = "1";
  for (const cb of [...doneListeners]) cb();
  doneListeners.clear();
}

/** Called once by Scene.tsx after its first rendered frame (or by SceneLayer when there is no scene). */
export function markSceneReady(): void {
  if (sceneReady) return;
  sceneReady = true;
  for (const cb of [...sceneListeners]) cb();
  sceneListeners.clear();
}

export function isSceneReady(): boolean {
  return sceneReady;
}

/** Runs `cb` when the scene's first frame is out (immediately if it already is). */
export function onSceneReady(cb: () => void): () => void {
  if (sceneReady) {
    cb();
    return () => {};
  }
  sceneListeners.add(cb);
  return () => {
    sceneListeners.delete(cb);
  };
}
