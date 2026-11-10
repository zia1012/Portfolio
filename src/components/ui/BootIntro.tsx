"use client";

import { useEffect, useState } from "react";
import {
  BOOT_FADE_MS,
  BOOT_MAX_MS,
  BOOT_MIN_MS,
  markBootDone,
  onSceneReady,
} from "@/lib/boot";
import { uiText } from "@/lib/ui-text";

/** Typing speed and line starts (ms). The lines are short, so the whole thing reads in ~1s. */
const CHAR_MS = 25;
const LINE2_START_MS = 400;
/** "ok" never shows earlier than this, even if the scene is already up. */
const OK_MIN_MS = 850;
/** Gap between "ok" and the fade, so "> ready" can be read. */
const READY_HOLD_MS = 250;

type Phase = "run" | "leaving" | "gone";
type Lines = { l1: string; l2: string; l3: string; active: 1 | 2 | 3 };

const text = uiText.boot;
const EMPTY: Lines = { l1: "", l2: "", l3: "", active: 1 };

const typed = (s: string, since: number) =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor(since / CHAR_MS))));

/**
 * Full-screen terminal overlay for the first home visit of a session. It is rendered on the
 * server (so it covers the page from first paint) and hidden by pure CSS after ~2.6s if this
 * component never runs. Styles: "Boot intro" in globals.css. Timing: src/lib/boot.ts.
 *
 * It is decorative (aria-hidden), never takes focus and never blocks the page: no `inert`,
 * pointer-events off after BOOT_PASS_MS, Escape dismisses it.
 */
export function BootIntro() {
  const [phase, setPhase] = useState<Phase>("run");
  const [lines, setLines] = useState<Lines>(EMPTY);

  useEffect(() => {
    // Returning visitor, reduced motion, or another page already ran it: nothing to play.
    // The node stays in the DOM but html[data-booted] hides it (display: none).
    if (document.documentElement.dataset.booted !== undefined) return;

    const t0 = performance.now();
    let frame = 0;
    let sceneAt: number | null = null;
    let leaving = false;
    let removeTimer: number | undefined;

    const leave = () => {
      if (leaving) return;
      leaving = true;
      cancelAnimationFrame(frame);
      try {
        sessionStorage.setItem("booted", "1");
      } catch {}
      setPhase("leaving");
      markBootDone();
      removeTimer = window.setTimeout(() => setPhase("gone"), BOOT_FADE_MS + 50);
    };

    const offScene = onSceneReady(() => {
      sceneAt = performance.now() - t0;
    });

    const tick = (now: number) => {
      const t = now - t0;
      const okAt = sceneAt === null ? Infinity : Math.max(OK_MIN_MS, sceneAt);
      const ok = t >= okAt;
      const next: Lines = {
        l1: typed(text.command, t),
        l2: ok ? text.loadingDone : typed(text.loading, t - LINE2_START_MS),
        l3: ok ? typed(text.ready, t - okAt) : "",
        active: ok ? 3 : t < LINE2_START_MS ? 1 : 2,
      };
      setLines((prev) =>
        prev.l1 === next.l1 && prev.l2 === next.l2 && prev.l3 === next.l3 && prev.active === next.active
          ? prev
          : next,
      );
      if (t >= BOOT_MAX_MS || t >= Math.max(BOOT_MIN_MS, okAt + READY_HOLD_MS)) {
        leave();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      offScene();
      cancelAnimationFrame(frame);
      window.clearTimeout(removeTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div id="boot" aria-hidden="true" className="boot" data-leaving={phase === "leaving" ? "" : undefined}>
      <div className="boot-col">
        <p className="boot-line boot-accent" data-active={lines.active === 1 ? "" : undefined}>
          {lines.l1}
        </p>
        <p className="boot-line" data-active={lines.active === 2 ? "" : undefined}>
          {lines.l2}
        </p>
        <p className="boot-line boot-accent" data-active={lines.active === 3 ? "" : undefined}>
          {lines.l3}
        </p>
      </div>
      {/* Without JS nothing would ever type, so do not show the overlay at all. */}
      <noscript>
        <style>{"#boot{display:none}"}</style>
      </noscript>
    </div>
  );
}
