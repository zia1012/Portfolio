"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { uiText } from "@/lib/ui-text";
import type { GlobeWord } from "./SkillsExplorer";

type SkillGlobeProps = {
  words: GlobeWord[];
  activeGroup: number;
  onSelectGroup: (group: number) => void;
};

type Point = readonly [number, number, number];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** Sphere radius in cqw (percent of the globe's width). */
const RADIUS = 42;
/** Fixed forward tilt (radians), so the viewer looks slightly down on the sphere. */
const TILT = 0.3;
const COS_TILT = Math.cos(TILT);
const SIN_TILT = Math.sin(TILT);
/** Mild perspective: front words spread out a little, back words pull in. */
const PERSPECTIVE = 0.18;
/** Auto-rotation: one turn in 30s, in radians per millisecond. */
const AUTO_SPEED = (2 * Math.PI) / 30_000;
/** Time constant (ms) of the drag inertia decaying back to the auto speed. */
const INERTIA_MS = 700;
const MAX_SPEED = 0.012;
/** Pointer travel (px) under which a press counts as a tap on a word. */
const TAP_SLOP = 6;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** Fibonacci sphere: n evenly spread unit vectors, y from top to bottom. */
function fibonacciSphere(n: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const theta = i * GOLDEN_ANGLE;
    return [Math.cos(theta) * r, y, Math.sin(theta) * r] as const;
  });
}

/** Rotates a point by yaw (around y) and the fixed tilt (around x), then projects it to 2D. */
function project([x, y, z]: Point, yaw: number) {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const x1 = x * cos + z * sin;
  const z1 = z * cos - x * sin;
  const y1 = y * COS_TILT - z1 * SIN_TILT;
  const z2 = y * SIN_TILT + z1 * COS_TILT;
  const depth = (z2 + 1) / 2; // 0 = back, 1 = front
  const p = 1 / (1 - PERSPECTIVE * z2);
  const sx = x1 * RADIUS * p;
  const sy = -y1 * RADIUS * p;
  const scale = 0.55 + 0.6 * depth;
  return {
    transform: `translate3d(${sx.toFixed(2)}cqw, ${sy.toFixed(2)}cqw, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`,
    // 0.35 at the back, 1 at the front.
    opacity: (0.35 + 0.65 * depth).toFixed(3),
    zIndex: 1 + Math.round(depth * 99),
  };
}

/**
 * Decorative rotating sphere of skill words (aria-hidden; the tab panels carry the content).
 * Positions are written straight to the DOM in one rAF loop, never through React state.
 * Server render, no-JS and reduced motion get the same static snapshot at yaw 0.
 */
export function SkillGlobe({ words, activeGroup, onSelectGroup }: SkillGlobeProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const [paused, setPaused] = useState(false);
  const globeRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pausedRef = useRef(false);
  const kickRef = useRef<() => void>(() => {});
  const onSelectRef = useRef(onSelectGroup);

  const points = useMemo(() => fibonacciSphere(words.length), [words.length]);
  const snapshot = useMemo(() => points.map((point) => project(point, 0)), [points]);

  useEffect(() => {
    onSelectRef.current = onSelectGroup;
  }, [onSelectGroup]);

  useEffect(() => {
    pausedRef.current = paused;
    kickRef.current();
  }, [paused]);

  useEffect(() => {
    const root = globeRef.current;
    if (!root) return;
    const motion = !reducedMotion;
    const elements = wordRefs.current;
    const zIndexes = snapshot.map((entry) => entry.zIndex);

    let yaw = 0;
    let velocity = motion && !pausedRef.current ? AUTO_SPEED : 0;
    let raf = 0;
    let last = 0;
    let onScreen = false;
    let press: {
      id: number;
      startX: number;
      lastX: number;
      lastT: number;
      word: number;
      dragging: boolean;
      pxToRad: number;
    } | null = null;

    const render = () => {
      for (let i = 0; i < points.length; i++) {
        const element = elements[i];
        if (!element) continue;
        const next = project(points[i], yaw);
        element.style.transform = next.transform;
        element.style.opacity = next.opacity;
        if (zIndexes[i] !== next.zIndex) {
          zIndexes[i] = next.zIndex;
          element.style.zIndex = String(next.zIndex);
        }
      }
    };

    const dragging = () => press?.dragging === true;
    const running = () =>
      motion && onScreen && !document.hidden && (dragging() || velocity !== 0 || !pausedRef.current);

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(Math.max(now - last, 0), 64);
      last = now;
      if (!dragging()) {
        const target = pausedRef.current ? 0 : AUTO_SPEED;
        velocity += (target - velocity) * (1 - Math.exp(-dt / INERTIA_MS));
        if (target === 0 && Math.abs(velocity) < 1e-5) velocity = 0;
        yaw += velocity * dt;
      }
      render();
      schedule();
    };

    const schedule = () => {
      if (!raf && running()) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf) last = performance.now();
      schedule();
    };
    kickRef.current = kick;

    const wordIndex = (target: EventTarget | null) => {
      const word = target instanceof Element ? target.closest<HTMLElement>("[data-word]") : null;
      return word ? Number(word.dataset.word) : -1;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      press = {
        id: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastT: event.timeStamp,
        word: wordIndex(event.target),
        dragging: false,
        // The front of the sphere follows the pointer.
        pxToRad: 1 / Math.max(1, (root.clientWidth * RADIUS) / 100),
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.id || !motion) return;
      if (!press.dragging) {
        if (Math.abs(event.clientX - press.startX) < TAP_SLOP) return;
        press.dragging = true;
        press.lastX = event.clientX;
        press.lastT = event.timeStamp;
        root.setPointerCapture(event.pointerId);
        root.dataset.dragging = "";
        kick();
        return;
      }
      const delta = (event.clientX - press.lastX) * press.pxToRad;
      const dt = Math.max(event.timeStamp - press.lastT, 1);
      yaw += delta;
      const instant = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, delta / dt));
      velocity = velocity * 0.6 + instant * 0.4;
      press.lastX = event.clientX;
      press.lastT = event.timeStamp;
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.id) return;
      const ended = press;
      press = null;
      delete root.dataset.dragging;
      if (ended.dragging) {
        // A pause before letting go means no fling.
        if (event.timeStamp - ended.lastT > 100) velocity = 0;
        kick();
      } else if (event.type === "pointerup" && ended.word >= 0) {
        const group = words[ended.word]?.groups[0];
        if (group !== undefined) onSelectRef.current(group);
      }
    };

    const onVisibility = () => kick();

    const observer = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      kick();
    });
    observer.observe(root);

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerEnd);
    root.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerEnd);
      root.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("visibilitychange", onVisibility);
      kickRef.current = () => {};
    };
  }, [reducedMotion, points, snapshot, words]);

  return (
    <div className="relative mx-auto w-full max-w-xs md:max-w-lg">
      <div ref={globeRef} aria-hidden="true" className="skill-globe relative isolate aspect-square">
        <span className="skill-globe-outline" />
        <span className="skill-globe-ring" />
        {/* Index keys: content strings as keys would be serialised into the RSC payload. */}
        {words.map((word, index) => {
          const active = word.groups.includes(activeGroup);
          return (
            <span
              key={index}
              ref={(element) => {
                wordRefs.current[index] = element;
              }}
              data-word={index}
              // Float formatting could differ by an ulp between server and browser engines.
              suppressHydrationWarning
              style={snapshot[index]}
              className="skill-globe-word motion-safe:will-change-transform"
            >
              <span
                className={`skill-globe-label inline-block motion-safe:transition-[color,opacity,scale] motion-safe:duration-150 motion-safe:ease-out ${
                  active ? "scale-115 font-bold text-accent" : "text-text-muted"
                }`}
              >
                {word.label}
              </span>
            </span>
          );
        })}
      </div>

      {/* Outside the aria-hidden globe. Hidden with reduced motion (nothing moves) and without JS. */}
      <button
        type="button"
        aria-label={uiText.skills.pauseGlobe}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
        className="skill-globe-pause absolute right-0 bottom-0 z-10 inline-flex rounded-full border border-border bg-background/90 size-11 items-center justify-center text-text transition-colors hover:border-accent hover:text-accent motion-reduce:hidden"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          {paused ? <path d="M4 2.5v11l9-5.5Z" /> : <path d="M4 2.5h3v11H4ZM9 2.5h3v11H9Z" />}
        </svg>
      </button>
    </div>
  );
}
