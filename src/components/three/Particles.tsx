"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  MathUtils,
  PointsMaterial,
  type Group,
  type Points,
  type PerspectiveCamera,
} from "three";
import { site } from "@/content/site";
import { onBootDone } from "@/lib/boot";
import { chapterMix, smoothstep } from "./chapters";
import { headingFontFamily } from "./projectScreen";
import { PARTICLES_RENDER_ORDER, SCRIM_GLSL, type ScrimUniforms } from "./scrimProfile";
import { buildShapes, initials, scatter, type InitialsLayout } from "./shapes";

/** Soft round sprite so points render as dots instead of squares. */
function createDotTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

/** Group placement (world units). */
const GROUP_X = 1.4;
const GROUP_Z = -1.5;
/**
 * Per-chapter group offset and scale (md+), so each shape stays mostly clear of the laptop:
 * the lattice and the wave move left (they were 46% and 39% hidden behind it), the wave up.
 */
const CHAPTER_X = [0, 0, -0.7, 0, 0, 1.0];
const CHAPTER_Y = [0, 0, 0, 0, 0, 1.0];
const CHAPTER_SCALE = [1, 1, 1.1, 1, 1, 0.95];
/**
 * Below md: centred behind the text and behind the laptop in depth (the laptop sits between
 * z -2.5 and -0.4 there), so a dot never lands on the laptop screen under the text. Scaled to
 * fit a 360-390px-wide viewport (the sphere, cloud and wave were 53-69% on-screen).
 */
const NARROW_Z = -4;
const NARROW_SCALE = [0.82, 0.86, 0.8, 1.12, 0.66, 0.8];

/**
 * Contact chapter: the envelope must face the camera. From chapter SPIN_SETTLE_FROM to
 * SPIN_SETTLE_TO the accumulated spin eases to the nearest full turn and stays frozen, and a
 * slow sway of +-SWAY rad replaces it.
 */
const CONTACT_CHAPTER = 5;
const SPIN_SETTLE_FROM = 4.2;
const SPIN_SETTLE_TO = 4.9;
const SWAY = 0.12;
const SWAY_SPEED = 0.5;

/**
 * Dots: small and soft. Over the text (where the scrim is at full strength) the alpha drops
 * to DIM of OPACITY at a dot's centre (see globals.css):
 * - light: 0.15, so 0.105 alpha; muted text 5.14:1 over one dot, 4.43:1 where two overlap
 *   (was 0.3: 4.49:1 and 3.51:1).
 * - dark: 0.3, so 0.21 alpha; muted text 6.27:1.
 * The value is a uniform, updated in place when the theme changes (no shader recompile).
 */
const SIZE = 0.05;
const OPACITY = 0.7;
const DIM_LIGHT = 0.15;
const DIM_DARK = 0.3;

/** Initials of site.name ("MZM"), at most three letters. */
const INITIALS = site.name
  .split(/\s+/)
  .filter(Boolean)
  .map((word) => word[0])
  .join("")
  .slice(0, 3)
  .toUpperCase();
/** Text width and centre in world units (desktop): above the hero laptop, behind it in depth. */
const INITIALS_WIDTH = 3.2;
const INITIALS_X = 2.5;
const INITIALS_Y = 1.6;
/** Mobile: centred, slightly lower. */
const INITIALS_Y_NARROW = 1.5;
/** Sticky header height (h-16), kept clear of the text. */
const HEADER_PX = 64;

/** Intro timing, in seconds: converge into the initials, hold, morph into the chapter shape. */
const INTRO_IN = 1.2;
const INTRO_HOLD = 1.5;
const INTRO_OUT = 1.2;
/** When the visitor scrolls during the intro, it hands over to the chapter morph this fast. */
const INTRO_CUT = 0.6;
/** Give up waiting for fonts after this long and draw the initials with whatever is loaded. */
const FONT_TIMEOUT_MS = 1500;

/** Pointer parallax in the hero (desktop only): opposite to the pointer, in world units. */
const PARALLAX = 0.15;
const PARALLAX_LAMBDA = 3;
const PARALLAX_FADE = 0.8;

type ParticlesProps = {
  chapter: RefObject<number>;
  /** Mouse/pen position over the window, -1..1 (y up); stays at 0 for touch. */
  pointer: RefObject<{ x: number; y: number }>;
  count: number;
  color: string;
  /** Picks the dim factor over the text (DIM_DARK or DIM_LIGHT). */
  isDark: boolean;
  /** Scrim layout shared with SceneScrim; the dots dim where it is strong. */
  scrim: ScrimUniforms;
};

/**
 * Points material that multiplies each dot's alpha by mix(1, uDim, scrim strength), read at
 * the dot's projected x. One varying and a few ALU ops; no extra pass. The uDim uniform
 * object is kept in material.userData.uDim so the theme can change its value.
 */
function createDotMaterial(texture: CanvasTexture, scrim: ScrimUniforms): PointsMaterial {
  const uDim = { value: DIM_DARK };
  const material = new PointsMaterial({
    map: texture,
    size: SIZE,
    sizeAttenuation: true,
    transparent: true,
    opacity: OPACITY,
    depthWrite: false,
    toneMapped: false,
  });
  material.userData.uDim = uDim;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDim = uDim;
    shader.uniforms.uScrimWidth = scrim.uScrimWidth;
    shader.uniforms.uScrimSolid = scrim.uScrimSolid;
    shader.uniforms.uScrimClear = scrim.uScrimClear;
    shader.uniforms.uScrimMax = scrim.uScrimMax;
    shader.uniforms.uScrimLeft = scrim.uScrimLeft;
    shader.uniforms.uScrimRight = scrim.uScrimRight;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vScrimU;")
      .replace(
        "#include <fog_vertex>",
        "#include <fog_vertex>\nvScrimU = (gl_Position.x / gl_Position.w) * 0.5 + 0.5;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying float vScrimU;\nuniform float uDim;\n${SCRIM_GLSL}`,
      )
      .replace(
        "#include <opaque_fragment>",
        `diffuseColor.a *= mix(1.0, uDim, scrimStrength(vScrimU * uScrimWidth));\n#include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "particles-scrim-dim";
  return material;
}

/** Sets the dim factor over the text; takes effect on the next frame. */
function setDotDim(material: PointsMaterial, value: number) {
  (material.userData.uDim as { value: number }).value = value;
}

/**
 * Point cloud that morphs (CPU lerp) between one target shape per scroll chapter. On load it
 * plays a one-off intro on top of that: scattered â†’ initials â†’ chapter shape.
 */
export function Particles({ chapter, pointer, count, color, isDark, scrim }: ParticlesProps) {
  const group = useRef<Group>(null);
  const points = useRef<Points>(null);
  const smoothed = useRef(0);
  const last = useRef({ mix: -1, a: -1, w: -1 });
  const parallax = useRef({ x: 0, y: 0 });
  /** Accumulated spin and the full turn it settles to near the contact chapter. */
  const spin = useRef({ angle: 0, turn: 0 });
  const get = useThree((state) => state.get);

  const shapes = useMemo(() => buildShapes(count), [count]);
  const start = useMemo(() => scatter(count), [count]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(start.slice(), 3));
    return g;
  }, [start]);
  const texture = useMemo(() => createDotTexture(), []);
  const material = useMemo(() => createDotMaterial(texture, scrim), [texture, scrim]);

  /** Initials target, built once per count; the sphere if the canvas is unavailable. */
  const letters = useRef<Float32Array | null>(null);
  const intro = useRef({
    ready: false,
    done: false,
    /** Intro clock (s); runs once the initials are ready, and only while frames render. */
    time: 0,
    scrolled: false,
    cut: false,
    cutElapsed: 0,
    cutA: 0,
    cutW: 1,
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.color.set(color);
  }, [material, color]);
  useEffect(() => {
    setDotDim(material, isDark ? DIM_DARK : DIM_LIGHT);
  }, [material, isDark]);

  useEffect(() => {
    let cancelled = false;
    const family = headingFontFamily();
    const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS));
    const fonts = Promise.all([
      document.fonts.ready,
      document.fonts.load(`700 200px ${family}`).catch(() => []),
    ]);
    let offBoot = () => {};
    const begin = () => {
      if (cancelled) return;
      const { camera, size } = get();
      const cam = camera as PerspectiveCamera;
      const narrow = size.width < 768;
      const depth = cam.position.z - (narrow ? NARROW_Z : GROUP_Z);
      const halfH = depth * Math.tan(MathUtils.degToRad(cam.fov) / 2);
      const halfW = halfH * (size.width / size.height);
      const maxTop = halfH - (HEADER_PX / size.height) * 2 * halfH - 0.15;
      let layout: InitialsLayout;
      if (narrow) {
        // The narrow group is further back and scaled by NARROW_SCALE[0]; layout is in local
        // units, so undo the scale and keep the same on-screen size as before.
        const s = NARROW_SCALE[0];
        const k = depth / (cam.position.z - GROUP_Z);
        layout = {
          width: Math.min(INITIALS_WIDTH * k, halfW * 1.6) / s,
          cx: 0,
          cy: (INITIALS_Y_NARROW * k) / s,
          maxTop: maxTop / s,
        };
      } else {
        // Keep the right edge in view on squarer windows.
        const cx = Math.min(INITIALS_X, halfW - INITIALS_WIDTH / 2 - 0.2);
        layout = { width: INITIALS_WIDTH, cx: cx - GROUP_X, cy: INITIALS_Y, maxTop };
      }
      letters.current = initials(count, INITIALS, family, layout) ?? shapes[0];
      intro.current.ready = true;
    };
    // Fonts first, then the boot overlay (immediate when there is none), then the intro.
    Promise.race([fonts, timeout]).finally(() => {
      if (cancelled) return;
      offBoot = onBootDone(begin);
    });
    return () => {
      cancelled = true;
      offBoot();
    };
  }, [count, get, shapes]);

  // Any scroll during the intro hands over to the chapter morph.
  useEffect(() => {
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) < 8) return;
      intro.current.scrolled = true;
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state, delta) => {
    smoothed.current = MathUtils.damp(smoothed.current, chapter.current, 3, delta);
    const narrow = state.size.width < 768;

    // Intro: a = scatter â†’ initials progress, w = weight of the intro over the chapter shape.
    let a = 0;
    let w = 0;
    const it = intro.current;
    if (!it.done) {
      const dt = Math.min(delta, 0.1);
      if (it.ready) it.time += dt;
      a = smoothstep(MathUtils.clamp(it.time / INTRO_IN, 0, 1));
      const out = MathUtils.clamp((it.time - INTRO_IN - INTRO_HOLD) / INTRO_OUT, 0, 1);
      w = 1 - smoothstep(out);
      if (!it.cut && (it.scrolled || chapter.current > 0.02)) {
        it.cut = true;
        it.cutA = a;
        it.cutW = w;
      }
      if (it.cut) {
        it.cutElapsed += dt;
        a = it.cutA;
        w = it.cutW * (1 - smoothstep(MathUtils.clamp(it.cutElapsed / INTRO_CUT, 0, 1)));
      }
      if (w <= 0) {
        it.done = true;
        w = 0;
      }
    }

    if (group.current) {
      // Spin only once the intro lets go, so the initials face the camera. Approaching the
      // contact chapter the spin freezes and eases to the nearest full turn (latched while
      // it is still unsettled, so the target cannot flip), then a gentle sway takes over.
      const settle = smoothstep(
        MathUtils.clamp(
          (smoothed.current - SPIN_SETTLE_FROM) / (SPIN_SETTLE_TO - SPIN_SETTLE_FROM),
          0,
          1,
        ),
      );
      const s = spin.current;
      s.angle += delta * 0.05 * (1 - w) * (1 - settle);
      if (settle <= 0) s.turn = Math.round(s.angle / (Math.PI * 2)) * Math.PI * 2;
      const contact = MathUtils.clamp(smoothed.current - (CONTACT_CHAPTER - 1), 0, 1);
      group.current.rotation.y =
        MathUtils.lerp(s.angle, s.turn, settle) +
        Math.sin(state.clock.elapsedTime * SWAY_SPEED) * SWAY * Math.min(settle, contact);
      const weight = narrow ? 0 : 1 - MathUtils.clamp(smoothed.current / PARALLAX_FADE, 0, 1);
      const p = pointer.current;
      parallax.current.x = MathUtils.damp(parallax.current.x, -p.x * PARALLAX * weight, PARALLAX_LAMBDA, delta);
      parallax.current.y = MathUtils.damp(parallax.current.y, -p.y * PARALLAX * weight, PARALLAX_LAMBDA, delta);
      // Per-chapter placement follows the same eased mix as the shape morph.
      const { from, to, t } = chapterMix(smoothed.current, CHAPTER_X.length);
      const lerp = (values: number[]) => values[from] + (values[to] - values[from]) * t;
      if (narrow) {
        group.current.position.set(0, 0, NARROW_Z);
        group.current.scale.setScalar(lerp(NARROW_SCALE));
      } else {
        group.current.position.set(
          GROUP_X + lerp(CHAPTER_X) + parallax.current.x,
          lerp(CHAPTER_Y) + parallax.current.y,
          GROUP_Z,
        );
        group.current.scale.setScalar(lerp(CHAPTER_SCALE));
      }
      // Same on-screen dot size at either depth (size attenuation divides by distance).
      const cameraZ = state.camera.position.z;
      const dots = points.current?.material;
      if (dots instanceof PointsMaterial) {
        dots.size = narrow ? (SIZE * (cameraZ - NARROW_Z)) / (cameraZ - GROUP_Z) : SIZE;
      }
    }

    // Skip the buffer rewrite when neither the morph nor the intro has moved.
    const prev = last.current;
    if (
      Math.abs(smoothed.current - prev.mix) < 1e-4 &&
      Math.abs(a - prev.a) < 1e-4 &&
      Math.abs(w - prev.w) < 1e-4
    ) {
      return;
    }
    prev.mix = smoothed.current;
    prev.a = a;
    prev.w = w;

    const { from, to, t } = chapterMix(smoothed.current, shapes.length);
    const sa = shapes[from];
    const sb = shapes[to];
    const attribute = geometry.getAttribute("position") as BufferAttribute;
    const positions = attribute.array as Float32Array;
    if (w > 0) {
      // Still one pass: chapter position, intro position, then the mix of the two.
      const l = letters.current ?? start;
      for (let i = 0; i < positions.length; i++) {
        const c = sa[i] + (sb[i] - sa[i]) * t;
        const s = start[i] + (l[i] - start[i]) * a;
        positions[i] = c + (s - c) * w;
      }
    } else {
      for (let i = 0; i < positions.length; i++) {
        positions[i] = sa[i] + (sb[i] - sa[i]) * t;
      }
    }
    attribute.needsUpdate = true;
  });

  return (
    <group ref={group} position={[GROUP_X, 0, GROUP_Z]}>
      {/* Drawn after the scrim; still depth-tested, so the laptop hides dots behind it. */}
      <points
        ref={points}
        geometry={geometry}
        material={material}
        renderOrder={PARTICLES_RENDER_ORDER}
      />

    </group>
  );
}
