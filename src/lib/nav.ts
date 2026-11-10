import { site } from "@/content/site";

/** Section headings reuse the nav labels from site.nav, so the two never drift apart. */
export function navLabel(id: string): string {
  return site.nav.find((item) => item.href === `#${id}`)?.label ?? id;
}

/** Two-digit position of a section in site.nav ("01" for the first), or null if not in the nav. */
export function navIndex(id: string): string | null {
  const index = site.nav.findIndex((item) => item.href === `#${id}`);
  return index === -1 ? null : String(index + 1).padStart(2, "0");
}
