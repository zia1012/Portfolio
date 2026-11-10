"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, type MouseEvent, type ReactNode } from "react";
import { getLenis } from "@/lib/lenis";

type HomeLinkProps = {
  className?: string;
  children: ReactNode;
  /** Runs on every click, e.g. to close the mobile menu. */
  onNavigate?: () => void;
};

/**
 * Time of a plain click on a non-home page; consumed when the home page renders. Expires so a
 * navigation that never happened can't affect a later visit (e.g. "Back to projects").
 */
let pendingTopAt = 0;
const PENDING_TOP_MS = 5000;

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Focus the visible <main> without scrolling. Cached routes may keep a hidden copy with the same id. */
function focusMain() {
  for (const main of document.querySelectorAll<HTMLElement>("main")) {
    if (main.getClientRects().length === 0) continue;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
    return;
  }
}

function jumpToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  getLenis()?.scrollTo(0, { immediate: true, force: true });
}

/**
 * Link to "/" that always lands at the very top of the home page.
 *
 * On the home page a plain left click is intercepted: it clears any #hash, scrolls to 0
 * (Lenis when running, native scroll otherwise, instant under reduced motion) and moves
 * focus to <main>. On other pages the click navigates normally (PageTransition fades it),
 * and the home page is then reset to the top, because Next.js keeps the previous scroll
 * position when the new page is already in the viewport. Without JS it is a plain link.
 */
export function HomeLink({ className, children, onNavigate }: HomeLinkProps) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname !== "/") return;
    const pending = Date.now() - pendingTopAt < PENDING_TOP_MS;
    pendingTopAt = 0;
    if (!pending) return;
    jumpToTop();
    // Run once more after Next.js scroll handling and any late layout in the first frame.
    const frame = requestAnimationFrame(() => {
      jumpToTop();
      focusMain();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    if (!isPlainLeftClick(event)) return;

    if (pathname !== "/") {
      // PageTransition may already have called preventDefault; it still navigates to "/".
      pendingTopAt = Date.now();
      return;
    }

    if (event.defaultPrevented) return;
    event.preventDefault();

    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    const reduce = prefersReducedMotion();
    const lenis = getLenis();
    if (lenis && !reduce) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: reduce ? "auto" : "smooth" });
    }
    focusMain();
  }

  return (
    <Link href="/" className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
