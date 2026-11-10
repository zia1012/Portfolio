"use client";

import { useLayoutEffect, useRef } from "react";
import { onBootDone } from "@/lib/boot";

type CountUpProps = {
  /** Final number. */
  to: number;
  /** Text kept after the number, e.g. "+". */
  suffix?: string;
  /** Wait this long after the trigger before counting, in ms (stagger). */
  delayMs?: number;
  durationMs?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Renders the final number as real text (server HTML, no-JS, screen readers). While counting,
 * the real text is made transparent (it keeps its space and stays in the accessibility tree)
 * and an aria-hidden overlay in the same box shows the running value, so nothing shifts.
 * Starts once, when the closest <dl> is at least 50% visible and the boot overlay has left.
 * With reduced motion nothing is touched.
 */
export function CountUp({ to, suffix = "", delayMs = 0, durationMs = 1200, className }: CountUpProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const ghost = ghostRef.current;
    const overlay = overlayRef.current;
    if (!root || !ghost || !overlay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const target = root.closest("dl") ?? root;
    let frame = 0;
    let timer = 0;

    const show = (value: number) => {
      overlay.textContent = `${value}${suffix}`;
    };
    const restore = () => {
      ghost.style.opacity = "";
      overlay.textContent = "";
    };

    // Hold at 0 until the row is seen, so the final number does not flash first.
    ghost.style.opacity = "0";
    show(0);

    const run = () => {
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / durationMs);
          if (p >= 1) {
            restore();
            return;
          }
          show(Math.round(to * easeOutCubic(p)));
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, delayMs);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.5 },
    );
    const offBoot = onBootDone(() => observer.observe(target));

    return () => {
      offBoot();
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      restore();
    };
  }, [to, suffix, delayMs, durationMs]);

  return (
    <span ref={rootRef} className={`relative inline-block tabular-nums ${className ?? ""}`}>
      <span ref={ghostRef}>
        {to}
        {suffix}
      </span>
      <span ref={overlayRef} aria-hidden="true" className="absolute inset-0" />
    </span>
  );
}
