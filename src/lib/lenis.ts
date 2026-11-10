import type Lenis from "lenis";

/**
 * The running Lenis instance, if any. Set by useSmoothScroll (home page 3D scene only; not
 * created under reduced motion). Type-only import, so reading it does not bundle Lenis.
 */
let current: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  current = lenis;
}

export function getLenis(): Lenis | null {
  return current;
}
