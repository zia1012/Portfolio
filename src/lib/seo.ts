import { site } from "@/content/site";

/** The production URL from site.seo.siteUrl, or null while it is still a placeholder. */
export function getSiteUrl(): URL | null {
  try {
    const url = new URL(site.seo.siteUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
