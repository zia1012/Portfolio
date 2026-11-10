"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getServerThemeSnapshot, getThemeSnapshot, subscribeTheme } from "@/lib/theme";

export type SceneColors = {
  isDark: boolean;
  accent: string;
  /**
   * Accent for anything drawn on the laptop screen. The screen is dark in both themes, so
   * this is always the dark-theme --accent (5.46:1 on the light theme's screen, where the
   * light accent would be 2.74:1).
   */
  screenAccent: string;
  muted: string;
  text: string;
  background: string;
  surface: string;
};

const DARK_ACCENT_FALLBACK = "#e07a45";

/** The dark theme's --accent, read from a throwaway element in the `.dark` scope. */
function readDarkAccent(): string {
  const probe = document.createElement("span");
  probe.className = "dark";
  probe.hidden = true;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).getPropertyValue("--accent").trim();
  probe.remove();
  return value || DARK_ACCENT_FALLBACK;
}

/** Reads the colour tokens from CSS custom properties and re-reads them when the theme class changes. */
export function useThemeColors(): SceneColors {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const isDark = theme === "dark";
    const accent = read("--accent", "#8a3f1c");
    return {
      isDark,
      accent,
      screenAccent: isDark ? accent : readDarkAccent(),
      muted: read("--text-muted", "#6b5545"),
      text: read("--text", "#2b1d14"),
      background: read("--background", "#f4ede4"),
      surface: read("--surface", "#eadfd2"),
    };
  }, [theme]);
}
