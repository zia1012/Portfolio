/**
 * Project screenshots found in public/projects/ when next.config.ts loaded. The config scans
 * for `<slug>.(webp|png|jpg|jpeg)` and injects a JSON map of slug to public path through
 * `env`, so there is no list to maintain here. Restart the dev server / rebuild after adding
 * a file. The `image` fields in src/content/ are placeholders and are not used.
 */
function parseImages(): Readonly<Record<string, string>> {
  try {
    const parsed: unknown = JSON.parse(process.env.NEXT_PUBLIC_PROJECT_IMAGES ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    const result: Record<string, string> = {};
    for (const [slug, src] of Object.entries(parsed)) {
      if (typeof src === "string") result[slug] = src;
    }
    return result;
  } catch {
    return {};
  }
}

const IMAGES = parseImages();

/** Public path of the project's screenshot, or null when no file exists for the slug. */
export function screenshotSrc(slug: string): string | null {
  return Object.hasOwn(IMAGES, slug) ? IMAGES[slug] : null;
}

export function hasScreenshot(slug: string): boolean {
  return screenshotSrc(slug) !== null;
}
