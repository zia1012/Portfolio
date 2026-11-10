/** Theme helpers shared by ThemeToggle and the 3D scene. Client-only (touch the DOM). */

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}

/** Same logic as the inline script in layout.tsx: stored choice wins, otherwise the OS setting. */
export function applyStoredTheme(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch {
    // localStorage unavailable: keep whatever the inline script set.
  }
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore: the choice just won't persist.
  }
}
