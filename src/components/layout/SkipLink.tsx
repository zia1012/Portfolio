import { uiText } from "@/lib/ui-text";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-accent px-4 py-3 font-medium text-accent-contrast focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      {uiText.skipLink}
    </a>
  );
}
