"use client";

import { useEffect, useId, useRef } from "react";

/** Elements that count as interactive (the mouse grows and lights its left button). */
const INTERACTIVE =
  'a[href], button, summary, label, [role="tab"], [role="button"], input, [tabindex]:not([tabindex="-1"]):not(.deck-body):not([role="tabpanel"])';
const GLOBE_WORD = ".skill-globe-word";
/** Fields where the native I-beam is better: the custom cursor hides. */
const TEXT_FIELD =
  'textarea, select, input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="range"], [type="file"], [type="color"], [type="image"])';

/** Tilt: degrees per px of horizontal movement in one frame, the cap, and the per-frame damping. */
const TILT_PER_PX = 0.6;
const TILT_MAX = 14;
const TILT_LERP = 0.2;
/** Stop the loop once the tilt is this close (degrees) to upright and the pointer is still. */
const SETTLED = 0.05;
/** The wheel keeps spinning this long (ms) after the last wheel or scroll event. */
const SPIN_HOLD = 250;
/** After a context menu opens, pointerup can be swallowed (macOS): release the button after this. */
const CONTEXT_RELEASE = 150;

type CursorState = "hidden" | "default" | "interactive" | "globe";
type Pressed = "left" | "right" | null;
type WheelDir = "down" | "up";

/**
 * Decorative custom cursor (mouse only): a small top-down computer mouse whose top-left tip is the
 * click point. It follows the pointer exactly and tilts with horizontal speed, rotating around the
 * click point; the cable sways the other way. The pressed button lights up and the scroll wheel
 * spins while the page scrolls. Styles, per-state looks and the native-cursor override live in
 * globals.css. Transforms are written to style, never through React state.
 */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // useId output may contain characters that are awkward inside url(#...): keep it plain.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shadeId = `cursor-shade-${uid}`;
  const wheelClipId = `cursor-wheel-${uid}`;

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const html = document.documentElement;
    const mqPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mqForced = window.matchMedia("(forced-colors: active)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let detach: (() => void) | null = null;

    const attach = () => {
      let raf = 0;
      let visible = false;
      let state: CursorState = "hidden";
      let pressed: Pressed = null;
      let px = 0;
      let py = 0;
      let lastX = 0;
      let tilt = 0;
      let spinTimer = 0;
      let releaseTimer = 0;
      let wheelDir: WheelDir | null = null;
      let lastScrollY = window.scrollY;

      const setState = (next: CursorState) => {
        if (next === state) return;
        state = next;
        root.dataset.state = next;
      };

      const setPressed = (next: Pressed) => {
        if (releaseTimer) {
          window.clearTimeout(releaseTimer);
          releaseTimer = 0;
        }
        if (next === pressed) return;
        pressed = next;
        if (next) root.dataset.pressed = next;
        else delete root.dataset.pressed;
      };

      const stopSpin = () => {
        if (spinTimer) window.clearTimeout(spinTimer);
        spinTimer = 0;
        root.classList.remove("is-spinning");
      };

      // Event-driven: each wheel/scroll event (re)starts a CSS animation and pushes back the stop.
      const spin = (dir: WheelDir) => {
        if (dir !== wheelDir) {
          wheelDir = dir;
          root.dataset.wheel = dir;
        }
        root.classList.add("is-spinning");
        if (spinTimer) window.clearTimeout(spinTimer);
        spinTimer = window.setTimeout(stopSpin, SPIN_HOLD);
      };

      const frame = () => {
        // Horizontal velocity since the last frame -> target tilt; damp the tilt towards it.
        // With the pointer still the target is 0, so the mouse eases back upright.
        const dx = px - lastX;
        lastX = px;
        const target = Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * TILT_PER_PX));
        tilt += (target - tilt) * TILT_LERP;
        const settled = dx === 0 && Math.abs(tilt) < SETTLED;
        if (settled) tilt = 0;
        const t = tilt.toFixed(2);
        // The track is 0x0 at the click point, so rotate() pivots on the click point.
        track.style.transform = `translate3d(${px}px,${py}px,0) rotate(${t}deg)`;
        // The cable reads --tilt in CSS and sways the opposite way.
        track.style.setProperty("--tilt", t);
        raf = settled ? 0 : requestAnimationFrame(frame);
      };

      const start = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };

      const stop = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };

      const leave = () => {
        stop();
        stopSpin();
        visible = false;
        setPressed(null);
        setState("hidden");
      };

      const classify = (target: EventTarget | null): CursorState => {
        if (!(target instanceof Element)) return "default";
        if (target.closest(TEXT_FIELD)) return "hidden";
        if (target.closest(GLOBE_WORD)) return "globe";
        if (target.closest(INTERACTIVE)) return "interactive";
        return "default";
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        px = e.clientX;
        py = e.clientY;
        if (!visible) {
          // First move, or re-entering the window: no flight from the old position.
          visible = true;
          lastX = px;
          tilt = 0;
          html.dataset.customCursor = "";
        }
        setState(classify(e.target));
        start();
      };

      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse") setPressed(e.button === 2 ? "right" : "left");
      };
      const onUp = (e: PointerEvent) => {
        if (e.pointerType === "mouse") setPressed(null);
      };
      // Passive: never blocks the menu. Only makes sure the right button does not stay lit.
      const onContextMenu = () => {
        if (!pressed) return;
        if (releaseTimer) window.clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(() => {
          releaseTimer = 0;
          setPressed(null);
        }, CONTEXT_RELEASE);
      };
      const onWheel = (e: WheelEvent) => {
        if (visible && e.deltaY !== 0) spin(e.deltaY > 0 ? "down" : "up");
      };
      const onScroll = () => {
        const y = window.scrollY;
        const dy = y - lastScrollY;
        lastScrollY = y;
        if (visible && dy !== 0) spin(dy > 0 ? "down" : "up");
      };
      const onOut = (e: PointerEvent) => {
        // relatedTarget is null when the pointer leaves the window.
        if (e.pointerType === "mouse" && !e.relatedTarget) leave();
      };
      const onVisibility = () => {
        if (document.hidden) leave();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      window.addEventListener("contextmenu", onContextMenu, { passive: true });
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("blur", leave);
      document.addEventListener("pointerout", onOut, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("contextmenu", onContextMenu);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("blur", leave);
        document.removeEventListener("pointerout", onOut);
        document.removeEventListener("visibilitychange", onVisibility);
        leave();
        delete root.dataset.wheel;
        track.style.removeProperty("--tilt");
        delete html.dataset.customCursor;
      };
    };

    const sync = () => {
      const enabled = mqPointer.matches && !mqForced.matches && !mqMotion.matches;
      if (enabled && !detach) detach = attach();
      else if (!enabled && detach) {
        detach();
        detach = null;
      }
    };

    sync();
    mqPointer.addEventListener("change", sync);
    mqForced.addEventListener("change", sync);
    mqMotion.addEventListener("change", sync);

    return () => {
      mqPointer.removeEventListener("change", sync);
      mqForced.removeEventListener("change", sync);
      mqMotion.removeEventListener("change", sync);
      detach?.();
      detach = null;
    };
  }, []);

  return (
    <div ref={rootRef} className="custom-cursor" data-state="hidden" aria-hidden="true">
      <div ref={trackRef} className="custom-cursor-track">
        {/* 20x36 box, 1 unit = 1px. Body 18x28 at (1,7), rx 9; top arc centre (10,16).
            Click point = outer stroke edge at 45deg on the top-left arc:
            10 - 9.75 * cos45 = 3.1, 16 - 9.75 * sin45 = 9.1. CSS offsets the SVG by that. */}
        <svg
          className="custom-cursor-mouse"
          width="20"
          height="36"
          viewBox="0 0 20 36"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="custom-cursor-shade-top" />
              <stop offset="1" className="custom-cursor-shade-bottom" />
            </linearGradient>
            <clipPath id={wheelClipId}>
              <rect x="9" y="9.5" width="2" height="6" rx="1" />
            </clipPath>
          </defs>
          <path className="custom-cursor-cable" d="M10 7 C10 4 12.5 3.5 14 2 S16 0 17 0" />
          <rect
            className="custom-cursor-body"
            x="1"
            y="7"
            width="18"
            height="28"
            rx="9"
            fill={`url(#${shadeId})`}
          />
          <path className="custom-cursor-button custom-cursor-button-left" d="M10 7 A9 9 0 0 0 1 16 V18.2 H10 Z" />
          <path className="custom-cursor-button custom-cursor-button-right" d="M10 7 A9 9 0 0 1 19 16 V18.2 H10 Z" />
          <path className="custom-cursor-highlight" d="M3 20 V16 A7 7 0 0 1 6.5 9.94" />
          <path className="custom-cursor-grips" d="M2.6 21 H4 M2.6 23 H4 M2.6 25 H4 M16 21 H17.4 M16 23 H17.4 M16 25 H17.4" />
          <path className="custom-cursor-monogram" d="M7.75 24.5 H12.25 L7.75 29.5 H12.25" />
          <rect className="custom-cursor-outline" x="1" y="7" width="18" height="28" rx="9" />
          <path className="custom-cursor-split" d="M10 7.75 V18.2" />
          <g className="custom-cursor-wheel">
            <rect className="custom-cursor-wheel-base" x="9" y="9.5" width="2" height="6" rx="1" />
            <g clipPath={`url(#${wheelClipId})`}>
              {/* 1px ribs every 2px, extended 2px past both ends so a 2px loop is seamless. */}
              <path
                className="custom-cursor-wheel-stripes"
                d="M9 6h2v1H9z M9 8h2v1H9z M9 10h2v1H9z M9 12h2v1H9z M9 14h2v1H9z M9 16h2v1H9z M9 18h2v1H9z"
              />
            </g>
            <rect className="custom-cursor-wheel-edge" x="9" y="9.5" width="2" height="6" rx="1" />
          </g>
        </svg>
      </div>
    </div>
  );
}
