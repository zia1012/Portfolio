import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * Finds `<slug>.(webp|png|jpg|jpeg)` files in public/projects/ and returns a map of slug to
 * public path (e.g. { acadlynk: "/projects/acadlynk.png" }). Preference: webp, png, jpg, jpeg.
 * This runs when the config loads, so restart `npm run dev` (or re-run `npm run build`)
 * after adding, renaming or removing a screenshot.
 */
function discoverProjectImages(): Record<string, string> {
  const dir = path.join(__dirname, "public", "projects");
  const extensions = ["webp", "png", "jpg", "jpeg"];
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return {};
  }
  const found: Record<string, string> = {};
  for (const file of files.sort()) {
    const dot = file.lastIndexOf(".");
    if (dot <= 0) continue;
    const slug = file.slice(0, dot);
    const ext = file.slice(dot + 1).toLowerCase();
    const rank = extensions.indexOf(ext);
    if (rank === -1) continue;
    const current = found[slug];
    const currentRank = current ? extensions.indexOf(current.slice(current.lastIndexOf(".") + 1).toLowerCase()) : Infinity;
    if (rank < currentRank) found[slug] = `/projects/${file}`;
  }
  return found;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Read by src/lib/screenshots.ts on both server and client.
  env: {
    NEXT_PUBLIC_PROJECT_IMAGES: JSON.stringify(discoverProjectImages()),
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
