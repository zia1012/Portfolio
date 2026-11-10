import type { SceneColors } from "./useThemeColors";

/** Canvas size for the laptop screen texture; same 2.2 : 1.32 aspect as the screen plane. */
export const SCREEN_CANVAS_W = 1024;
export const SCREEN_CANVAS_H = 614;

const PAD_X = 72;
const MAX_TEXT_W = SCREEN_CANVAS_W - PAD_X * 2;
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export type ScreenProject = {
  slug: string;
  title: string;
  tags: string[];
  /** Screenshot path and the hostname shown in the browser bar, for allowlisted projects only. */
  screenshot?: { src: string; host: string };
};

/** Hostname of a URL without "www.", or "" if it does not parse. */
export function hostOf(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const BAR_H = 52;
const STRIP_H = 84;

/** Draws the project as a browser window: top bar, cover-fit screenshot, title strip. */
export function drawProjectScreenshot(
  ctx: CanvasRenderingContext2D,
  project: ScreenProject,
  image: HTMLImageElement,
  colors: SceneColors,
  screenBg: string,
): void {
  const family = headingFontFamily();
  const light = colors.isDark ? colors.text : colors.background;
  const W = SCREEN_CANVAS_W;
  const H = SCREEN_CANVAS_H;

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, 0, W, H);

  // Screenshot, cover fit into the area between the bar and the strip.
  const areaY = BAR_H;
  const areaH = H - BAR_H - STRIP_H;
  const scale = Math.max(W / image.naturalWidth, areaH / image.naturalHeight);
  const sw = W / scale;
  const sh = areaH / scale;
  const sx = (image.naturalWidth - sw) / 2;
  // Anchor to the top so the site's header and headline stay in view.
  ctx.drawImage(image, sx, 0, sw, sh, 0, areaY, W, areaH);

  // Top bar: three dots and a hostname pill.
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, 0, W, BAR_H);
  const dotY = BAR_H / 2;
  ctx.fillStyle = light;
  ctx.globalAlpha = 0.45;
  [28, 52, 76].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, dotY, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const host = project.screenshot?.host ?? "";
  if (host) {
    ctx.font = `500 24px ${MONO}`;
    const pillW = Math.min(W - 240, ctx.measureText(host).width + 48);
    const pillH = 34;
    const pillX = (W - pillW) / 2;
    const pillY = (BAR_H - pillH) / 2;
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(host, W / 2, dotY + 1, pillW - 24);
    ctx.globalAlpha = 1;
  }

  // Bottom strip: title on the left, first three tags on the right.
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, H - STRIP_H, W, STRIP_H);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const stripY = H - STRIP_H / 2;
  ctx.font = `700 40px ${family}`;
  ctx.fillStyle = light;
  const titleW = Math.min(ctx.measureText(project.title).width, W * 0.45);
  ctx.fillText(project.title, 40, stripY, W * 0.45);

  const tags = project.tags.slice(0, 3).join("  ·  ");
  if (tags) {
    const maxTagsW = W - 40 - titleW - 40 - 40;
    let tagSize = 26;
    do {
      ctx.font = `500 ${tagSize}px ${MONO}`;
      tagSize -= 2;
    } while (ctx.measureText(tags).width > maxTagsW && tagSize > 16);
    ctx.textAlign = "right";
    ctx.fillStyle = colors.screenAccent;
    ctx.fillText(tags, W - 40, stripY, maxTagsW);
  }

  ctx.restore();
}

/** Space Grotesk family as exposed by next/font, with a generic fallback. */
export function headingFontFamily(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-space-grotesk")
    .trim();
  return family ? `${family}, sans-serif` : "sans-serif";
}

/** Greedy word wrap at the current ctx.font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Largest title size (from 128px down) that fits in at most two lines. */
function fitTitle(ctx: CanvasRenderingContext2D, title: string, family: string) {
  for (let size = 128; size >= 40; size -= 4) {
    ctx.font = `700 ${size}px ${family}`;
    const lines = wrap(ctx, title, MAX_TEXT_W);
    const fits = lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= MAX_TEXT_W);
    if (fits) return { size, lines };
  }
  ctx.font = `700 40px ${family}`;
  return { size: 40, lines: wrap(ctx, title, MAX_TEXT_W).slice(0, 2) };
}

/** Draws the terminal-style project card onto the screen canvas. */
export function drawProjectScreen(
  ctx: CanvasRenderingContext2D,
  project: ScreenProject,
  colors: SceneColors,
  screenBg: string,
): void {
  const family = headingFontFamily();
  // The screen is dark in both themes (text colour in light mode, background in dark mode),
  // so the title uses whichever token is light.
  const titleColor = colors.isDark ? colors.text : colors.background;

  ctx.save();
  ctx.clearRect(0, 0, SCREEN_CANVAS_W, SCREEN_CANVAS_H);
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, 0, SCREEN_CANVAS_W, SCREEN_CANVAS_H);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Prompt line
  let promptSize = 36;
  const prompt = `~/projects $ open ${project.slug}`;
  do {
    ctx.font = `700 ${promptSize}px ${MONO}`;
    promptSize -= 2;
  } while (ctx.measureText(prompt).width > MAX_TEXT_W && promptSize > 20);
  ctx.fillStyle = colors.screenAccent;
  ctx.fillText(prompt, PAD_X, 104);

  // Title, vertically centred in the space between the prompt and the tags.
  const { size, lines } = fitTitle(ctx, project.title, family);
  const lineHeight = size * 1.05;
  const blockH = lineHeight * lines.length;
  const areaTop = 150;
  const areaBottom = SCREEN_CANVAS_H - 140;
  let y = areaTop + (areaBottom - areaTop - blockH) / 2 + size * 0.85;
  ctx.fillStyle = titleColor;
  for (const line of lines) {
    ctx.fillText(line, PAD_X, y);
    y += lineHeight;
  }

  // Tags
  const tags = project.tags.slice(0, 3).join("  ·  ");
  if (tags) {
    let tagSize = 38;
    do {
      ctx.font = `500 ${tagSize}px ${MONO}`;
      tagSize -= 2;
    } while (ctx.measureText(tags).width > MAX_TEXT_W && tagSize > 20);
    if (colors.isDark) {
      ctx.fillStyle = colors.muted;
    } else {
      // --text-muted is too dark on the dark light-theme screen; dim the light token instead.
      ctx.fillStyle = titleColor;
      ctx.globalAlpha = 0.72;
    }
    ctx.fillText(tags, PAD_X, SCREEN_CANVAS_H - 80);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
