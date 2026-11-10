"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { uiText } from "@/lib/ui-text";
import {
  applyStoredTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  // React's dev-mode remount resets <html> attributes, dropping the class set by the
  // inline script. Re-apply it before paint (no-op in production). See Next.js
  // "Preventing flash before hydration" guide.
  useLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label={uiText.themeToggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-11 items-center justify-center rounded-full text-text hover:bg-surface hover:text-accent"
    >
      {/* Sun shown in dark mode, moon in light mode. Decorative: the button has a label. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="hidden size-5 dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}
