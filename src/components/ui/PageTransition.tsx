"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Mirror --transition-in / --transition-out in globals.css ("Page transition"). */
const FADE_IN_MS = 300;
const LIFT_MS = 450;
/** If the route has not changed this long after the fade-in, lift the overlay anyway. */
const NAV_TIMEOUT_MS = 3000;
/** The projector entrance (longest dust speck) is done by then; html[data-transition] can go. */
const ANIMATIONS_DONE_MS = 8000;

const PROJECT_PATH = /^\/projects\/[^/]+\/?$/;

/** Only home <-> project page moves play the transition. Returns the href to push, or null. */
function transitionTarget(anchor: HTMLAnchorElement): string | null {
  if (anchor.hasAttribute("download")) return null;
  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin || url.search !== "") return null;

  const from = window.location.pathname;
  if (from === "/" && PROJECT_PATH.test(url.pathname) && url.hash === "") {
    return url.pathname;
  }
  if (
    PROJECT_PATH.test(from) &&
    url.pathname === "/" &&
    (url.hash === "" || url.hash === "#projects")
  ) {
    return `/${url.hash}`;
  }
  return null;
}

/** The visible <main>: with cached routes a hidden copy of the old page can share the id. */
function visibleMain(): HTMLElement | null {
  const mains = document.querySelectorAll<HTMLElement>("main");
  for (const main of mains) {
    if (main.getClientRects().length > 0) return main;
  }
  return null;
}

/**
 * Decorative "lights down" overlay for home <-> project page navigation.
 *
 * Click on an eligible link: overlay fades in (300ms), router.push, then once the pathname
 * changes the overlay lifts (450ms) while html[data-transition] delays the projector
 * entrance animations by the same amount. Everything else (modifier clicks, new tabs, other
 * links, browser back/forward, direct loads, reduced motion, no JS) navigates normally.
 * The overlay is aria-hidden, never takes focus, and a 3s safety timer always uncovers the page.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const lastPathRef = useRef(pathname);
  const wantFocusRef = useRef(false);

  // Click interception. router is stable, so the listener is installed once.
  useEffect(() => {
    const root = document.documentElement;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const later = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms));
    };

    const uncover = () => {
      overlay.removeAttribute("data-covering");
      activeRef.current = false;
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = transitionTarget(anchor);
      if (href === null) return;

      // Already switching: swallow the extra click instead of pushing twice.
      event.preventDefault();
      if (activeRef.current) return;

      activeRef.current = true;
      wantFocusRef.current = true;
      overlay.setAttribute("data-covering", "");

      // Failsafe: NAV_TIMEOUT_MS after the fade-in, uncover even if the route never changed
      // (a slow push may still finish on its own). Never leave the page covered.
      later(() => {
        if (!activeRef.current) return;
        uncover();
        wantFocusRef.current = false;
      }, FADE_IN_MS + NAV_TIMEOUT_MS);

      later(() => {
        // Set before the push so the new page's animations start with the delay.
        root.setAttribute("data-transition", "");
        later(() => root.removeAttribute("data-transition"), ANIMATIONS_DONE_MS);
        router.push(href);
      }, FADE_IN_MS);
    };

    document.addEventListener("click", onClick, true);
    const timers = timersRef;
    return () => {
      document.removeEventListener("click", onClick, true);
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      overlay.removeAttribute("data-covering");
      root.removeAttribute("data-transition");
      activeRef.current = false;
    };
  }, [router]);

  // Route changed: lift the overlay and move focus to the new page.
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const root = document.documentElement;
    if (!activeRef.current) {
      // Back/forward or any other navigation: no overlay, no animation delay.
      root.removeAttribute("data-transition");
      return;
    }

    activeRef.current = false;
    overlayRef.current?.removeAttribute("data-covering");
    // Make sure the delay is in place even if the route changed before the push timer ran.
    root.setAttribute("data-transition", "");
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    timersRef.current.push(
      window.setTimeout(() => root.removeAttribute("data-transition"), LIFT_MS + ANIMATIONS_DONE_MS),
    );

    if (wantFocusRef.current) {
      wantFocusRef.current = false;
      const main = visibleMain();
      if (main) {
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    }
  }, [pathname]);

  return <div ref={overlayRef} aria-hidden="true" className="page-transition" />;
}
