import { Color } from "three";

/**
 * Readability scrim drawn inside the canvas (same profile as `.scrim` in globals.css):
 * - Below md: `--background` at 88% over the full width.
 * - md+: `--background` at 92% from the left edge to the end of the text column
 *   (content edge + 44rem), fading linearly to 0 over the next 8rem. On the projects
 *   zig-zag the same profile is mirrored from the right edge (`uScrimRight`).
 * The two sides stack like the two DOM layers: 1 - (1 - left)(1 - right).
 */

/** Draw order: laptop (opaque, then overlays 1..6) < scrim < particles. */
export const SCRIM_RENDER_ORDER = 10;
export const PARTICLES_RENDER_ORDER = 20;

export const SCRIM_ALPHA_WIDE = 0.92;
export const SCRIM_ALPHA_NARROW = 0.88;
/** md breakpoint, CSS px. */
export const SCRIM_MD = 768;

export type ScrimUniforms = {
  uScrimColor: { value: Color };
  /** Canvas width, CSS px. */
  uScrimWidth: { value: number };
  /** Distance from the covered edge where the fade starts / ends, CSS px. */
  uScrimSolid: { value: number };
  uScrimClear: { value: number };
  /** Peak alpha (0.92 md+, 0.88 below). */
  uScrimMax: { value: number };
  /** Weight of the left and right profiles (crossfaded, 0..1). */
  uScrimLeft: { value: number };
  uScrimRight: { value: number };
};

export function createScrimUniforms(): ScrimUniforms {
  return {
    uScrimColor: { value: new Color("#f4ede4") },
    uScrimWidth: { value: 1 },
    uScrimSolid: { value: 1e5 },
    uScrimClear: { value: 1e5 + 1 },
    uScrimMax: { value: SCRIM_ALPHA_NARROW },
    uScrimLeft: { value: 1 },
    uScrimRight: { value: 0 },
  };
}

/** Writes the layout for a canvas `width` CSS px wide; `rem` is the root font size in px. */
export function layoutScrim(
  uniforms: ScrimUniforms,
  width: number,
  rem: number,
  left: number,
  right: number,
): void {
  uniforms.uScrimWidth.value = width;
  if (width < SCRIM_MD) {
    // Uniform, never mirrored (the DOM scrim hides its right layer below md).
    uniforms.uScrimSolid.value = 1e5;
    uniforms.uScrimClear.value = 1e5 + 1;
    uniforms.uScrimMax.value = SCRIM_ALPHA_NARROW;
    uniforms.uScrimLeft.value = 1;
    uniforms.uScrimRight.value = 0;
    return;
  }
  // Left edge of the max-w-6xl content: max(1.5rem, 50% - 36rem).
  const columnStart = Math.max(1.5 * rem, width / 2 - 36 * rem);
  const solid = columnStart + 44 * rem;
  uniforms.uScrimSolid.value = solid;
  uniforms.uScrimClear.value = solid + 8 * rem;
  uniforms.uScrimMax.value = SCRIM_ALPHA_WIDE;
  uniforms.uScrimLeft.value = left;
  uniforms.uScrimRight.value = right;
}

/** GLSL: `scrimAlpha(x)` for a CSS-px x measured from the left edge of the canvas. */
export const SCRIM_GLSL = /* glsl */ `
uniform float uScrimWidth;
uniform float uScrimSolid;
uniform float uScrimClear;
uniform float uScrimMax;
uniform float uScrimLeft;
uniform float uScrimRight;
float scrimProfile(float d) {
  return 1.0 - clamp((d - uScrimSolid) / (uScrimClear - uScrimSolid), 0.0, 1.0);
}
float scrimAlpha(float x) {
  float a = uScrimMax * uScrimLeft * scrimProfile(x);
  float b = uScrimMax * uScrimRight * scrimProfile(uScrimWidth - x);
  return 1.0 - (1.0 - a) * (1.0 - b);
}
/** 0 in the clear zone, 1 where the scrim is at full strength. */
float scrimStrength(float x) {
  return clamp(scrimAlpha(x) / max(uScrimMax, 0.001), 0.0, 1.0);
}
`;

/** Full-screen quad in clip space; the plane geometry spans -1..1. */
export const SCRIM_VERTEX = /* glsl */ `
varying float vScrimU;
void main() {
  vScrimU = position.x * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const SCRIM_FRAGMENT = /* glsl */ `
uniform vec3 uScrimColor;
varying float vScrimU;
${SCRIM_GLSL}
void main() {
  gl_FragColor = vec4(uScrimColor, scrimAlpha(vScrimU * uScrimWidth));
  #include <colorspace_fragment>
}
`;
