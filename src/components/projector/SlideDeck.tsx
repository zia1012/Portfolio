"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { uiText } from "@/lib/ui-text";
import { ProjectorScreen } from "./ProjectorScreen";

export type Slide = {
  /** Short name used in labels, e.g. "Overview" or "Approach". */
  name: string;
  content: ReactNode;
};

type SlideDeckProps = {
  /** Project title, shown in each slide's header strip and in the region label. */
  title: string;
  slides: Slide[];
  /** Link out of the deck (e.g. back to the project list), shown in the control bar. */
  backLink?: ReactNode;
};

const t = uiText.slides;
const SWIPE_MIN_PX = 50;

const noopSubscribe = () => () => {};

const controlClass =
  "inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent";

/**
 * Slide state and controls for the projector screen. Every slide is server-rendered;
 * before hydration CSS shows only the first one, and with JS off all of them are stacked.
 */
export function SlideDeck({ title, slides, backLink }: SlideDeckProps) {
  // false on the server and during hydration, true once the client has taken over.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusNewSlide = useRef(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const total = slides.length;

  useEffect(() => {
    if (!focusNewSlide.current) return;
    focusNewSlide.current = false;
    slideRefs.current[index]?.focus();
  }, [index]);

  function goTo(target: number) {
    const next = (target + total) % total;
    if (next === index) return;
    // The current slide becomes inert, so keep focus from dropping to <body>.
    const current = slideRefs.current[index];
    focusNewSlide.current = Boolean(current?.contains(document.activeElement));
    setIndex(next);
    setInteracted(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  }

  const current = slides[index];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={t.region(title)}
      className="projector-deck"
      data-interacted={interacted ? "" : undefined}
      onKeyDown={handleKeyDown}
    >
      <ProjectorScreen>
        <div
          className="deck-viewport"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
        >
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <div
                // Index keys: content strings as keys would be serialised into the RSC payload.
                key={i}
                ref={(node) => {
                  slideRefs.current[i] = node;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={t.slideLabel(i + 1, total, slide.name)}
                tabIndex={-1}
                inert={hydrated && !active}
                data-active={active ? "" : undefined}
                className="deck-slide"
              >
                <div aria-hidden="true" className="deck-strip">
                  <span className="min-w-0 truncate">{title}</span>
                  <span className="shrink-0">{t.counter(i + 1, total)}</span>
                </div>
                {/* Focusable so keyboard users can scroll a slide taller than the screen. */}
                <div tabIndex={0} aria-label={slide.name} className="deck-body">
                  {slide.content}
                </div>
                <div aria-hidden="true" className="deck-foot">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-1 w-6 shrink-0 rounded-full bg-accent" />
                    <span className="truncate">{slide.name}</span>
                  </span>
                  <span className="shrink-0">{String(i + 1).padStart(2, "0")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ProjectorScreen>

      {/* One control bar (layout in globals.css): Prev / dots / Next, plus the back link.
          The counter is only in the slide strip, so it is not repeated here. */}
      {total > 1 || backLink ? (
        <div className="deck-controls">
          {total > 1 ? (
            <div className="deck-nav flex w-full items-center justify-between sm:w-auto sm:justify-center">
              <button
                type="button"
                aria-label={t.previousLabel}
                className={controlClass}
                onClick={() => goTo(index - 1)}
              >
                <span aria-hidden="true">←</span>
                <span className="hidden md:inline">{t.previous}</span>
              </button>

              <ul aria-label={t.dotsLabel} className="flex min-w-0 justify-center">
                {slides.map((slide, i) => {
                  const active = i === index;
                  return (
                    // 28×36px hit area; never below the 24px WCAG 2.2 AA minimum (2.5.8).
                    <li key={i} className="flex w-7 min-w-6">
                      <button
                        type="button"
                        aria-label={t.goTo(i + 1, slide.name)}
                        aria-current={active ? "true" : undefined}
                        className="group inline-flex h-9 w-full items-center justify-center rounded-full"
                        onClick={() => goTo(i)}
                      >
                        <span
                          aria-hidden="true"
                          className={
                            active
                              ? "h-2 w-5 rounded-full bg-accent"
                              : "size-2 rounded-full bg-text-muted transition-colors group-hover:bg-text"
                          }
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                aria-label={t.nextLabel}
                className={controlClass}
                onClick={() => goTo(index + 1)}
              >
                <span className="hidden md:inline">{t.next}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : null}
          {backLink ? <div className="deck-back">{backLink}</div> : null}
        </div>
      ) : null}

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {interacted && current ? t.status(index + 1, total, current.name) : ""}
      </p>
    </div>
  );
}
