"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, ShaderMaterial } from "three";
import {
  SCRIM_FRAGMENT,
  SCRIM_RENDER_ORDER,
  SCRIM_VERTEX,
  layoutScrim,
  type ScrimUniforms,
} from "./scrimProfile";
import { watchScrimSide } from "./scrimSide";

/** Same timing as the DOM scrim: 300ms ease-out, the outgoing side waits 250ms. */
const FADE_SECONDS = 0.3;
const OUT_DELAY = 0.25;

type Fade = { value: number; from: number; to: number; start: number };

function retarget(fade: Fade, to: number, now: number, delay: number) {
  if (fade.to === to) return;
  fade.from = fade.value;
  fade.to = to;
  fade.start = now + delay;
}

function advance(fade: Fade, now: number) {
  const t = MathUtils.clamp((now - fade.start) / FADE_SECONDS, 0, 1);
  // Close to CSS ease-out.
  const eased = 1 - (1 - t) * (1 - t);
  fade.value = fade.from + (fade.to - fade.from) * eased;
}

function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

type SceneScrimProps = {
  uniforms: ScrimUniforms;
  /** `--background` of the current theme. */
  color: string;
};

/**
 * Readability scrim as a screen-space quad inside the canvas: drawn after the laptop (so it
 * covers it like the DOM scrim did) and before the particles (so they stay visible on top).
 * The particles read the same uniforms to dim themselves over the text.
 */
export function SceneScrim({ uniforms, color }: SceneScrimProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        vertexShader: SCRIM_VERTEX,
        fragmentShader: SCRIM_FRAGMENT,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [uniforms],
  );
  const wantRight = useRef(false);
  const appliedRight = useRef(false);
  const left = useRef<Fade>({ value: 1, from: 1, to: 1, start: 0 });
  const right = useRef<Fade>({ value: 0, from: 0, to: 0, start: 0 });
  const layout = useRef({ width: -1, rem: 16 });
  const appliedColor = useRef<string | null>(null);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(
    () =>
      watchScrimSide((next) => {
        wantRight.current = next;
      }),
    [],
  );

  useFrame((state) => {
    if (color !== appliedColor.current) {
      appliedColor.current = color;
      uniforms.uScrimColor.value.set(color);
    }
    const now = state.clock.elapsedTime;
    if (wantRight.current !== appliedRight.current) {
      const toRight = wantRight.current;
      appliedRight.current = toRight;
      // The incoming side fades in at once, the outgoing one follows, so text stays covered.
      retarget(left.current, toRight ? 0 : 1, now, toRight ? OUT_DELAY : 0);
      retarget(right.current, toRight ? 1 : 0, now, toRight ? 0 : OUT_DELAY);
    }
    advance(left.current, now);
    advance(right.current, now);

    const width = state.size.width;
    if (width !== layout.current.width) {
      layout.current.width = width;
      layout.current.rem = rootFontSize();
    }
    layoutScrim(uniforms, width, layout.current.rem, left.current.value, right.current.value);
  });

  return (
    <mesh renderOrder={SCRIM_RENDER_ORDER} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
