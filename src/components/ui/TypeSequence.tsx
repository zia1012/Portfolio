"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { onBootDone } from "@/lib/boot";

type TypeSequenceProps = {
  children: ReactNode;
  className?: string;
  /** How long the caret keeps blinking after the last line, in ms. */
  holdMs?: number;
};

type Line = {
  el: HTMLElement;
  typed: Text;
  rest: Text;
  text: string;
  start: number;
  duration: number;
  shown: number;
};

/** Once per page load: remounting (e.g. client navigation back home) shows the text at once. */
let played = false;

/**
 * Types its TypeLine children one after another once the block is 40% visible,
 * then reveals `.type-reveal` children. Without JS, or with reduced motion,
 * nothing is hidden: the `data-typing` attribute that hides the text is only set here.
 */
export function TypeSequence({ children, className, holdMs = 2000 }: TypeSequenceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || played) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    // Build each overlay: typed text, caret, then the untyped rest (invisible), so the
    // overlay wraps exactly like the real text underneath it.
    let offset = 0;
    const lines: Line[] = Array.from(root.querySelectorAll<HTMLElement>(".type-line")).map((el) => {
      const text = el.querySelector(".type-ghost")?.textContent ?? "";
      const overlay = el.querySelector(".type-typed");
      const typed = document.createTextNode("");
      const rest = document.createTextNode(text);
      const caret = document.createElement("span");
      caret.className = "type-caret";
      const restSpan = document.createElement("span");
      restSpan.className = "type-rest";
      restSpan.append(rest);
      overlay?.replaceChildren(typed, caret, restSpan);

      const speed = Number(el.dataset.speed) || 30;
      const maxMs = Number(el.dataset.maxMs) || Infinity;
      const duration = Math.min(text.length * speed, maxMs);
      const line = { el, typed, rest, text, start: offset, duration, shown: 0 };
      offset += duration;
      return line;
    });
    if (lines.length === 0) return;

    const typingEnd = offset;
    root.dataset.typing = "";
    let frame = 0;
    let active: HTMLElement | null = null;

    const setActive = (el: HTMLElement | null) => {
      if (el === active) return;
      active?.removeAttribute("data-active");
      el?.setAttribute("data-active", "");
      active = el;
    };

    const finish = () => {
      cancelAnimationFrame(frame);
      setActive(null);
      delete root.dataset.typing;
      delete root.dataset.revealed;
      for (const line of lines) line.el.querySelector(".type-typed")?.replaceChildren();
    };

    const run = () => {
      played = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = now - t0;
        for (const line of lines) {
          const progress = line.duration > 0 ? (t - line.start) / line.duration : 1;
          const n = Math.max(0, Math.min(line.text.length, Math.floor(progress * line.text.length)));
          if (n !== line.shown) {
            line.shown = n;
            line.typed.data = line.text.slice(0, n);
            line.rest.data = line.text.slice(n);
          }
        }
        const current = lines.find((l) => t < l.start + l.duration) ?? lines[lines.length - 1];
        setActive(current.el);
        if (t >= typingEnd) root.dataset.revealed = "";
        if (t >= typingEnd + holdMs) {
          finish();
          return;
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // The first callback fires even below the threshold, so check the ratio.
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.4)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    // Wait for the boot overlay to leave (runs at once when there is none).
    const offBoot = onBootDone(() => observer.observe(root));

    return () => {
      offBoot();
      observer.disconnect();
      finish();
    };
  }, [holdMs]);

  return (
    <div ref={ref} className={`type-seq ${className ?? ""}`}>
      {children}
    </div>
  );
}
