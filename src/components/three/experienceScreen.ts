import { experience } from "@/content/experience";
import { hasCopy, publicText } from "@/lib/content";
import { isPresent, monthsBetween, parseContentDate, type YearMonth } from "@/lib/dateParse";
import { shortHash } from "@/lib/shortHash";
import { uiText } from "@/lib/ui-text";
import {
  BAR_H,
  PAD_TOP,
  PAD_X,
  applyRole,
  drawTitleBar,
  lightToken,
  type TermRole,
} from "./heroTerminal";
import { MONO, SCREEN_CANVAS_W } from "./projectScreen";
import type { SceneColors } from "./useThemeColors";

/**
 * Experience screen on the laptop: `git log --oneline --graph` of the jobs, with the commit
 * in view highlighted and its `git show --stat` below. Decorative canvas art; hashes and refs
 * match the timeline cards.
 */

export const EXPERIENCE_TITLE = "zia — ~/career";
const LOG_COMMAND = "git log --oneline --graph";
const MAX_BULLETS = 3;

const labels = uiText.experience;

export type ScreenCommit = {
  hash: string;
  ref: string;
  isHead: boolean;
  /** Role, or the company when the role is missing. */
  title: string;
  /** Company shown after "@", or "" (TODO names are hidden). */
  company: string;
  start: string;
  end: string;
  present: boolean;
  bullets: string[];
};

/**
 * Same entries, order and labels as Experience.tsx / CommitEntry.tsx, so `data-commit-index`
 * on a card is the index here. TODO text is always hidden on the canvas (it cannot show the
 * dashed placeholder outline the page uses in development).
 */
export const SCREEN_COMMITS: ScreenCommit[] = (() => {
  const entries = experience.filter((entry) => hasCopy(entry.company) || hasCopy(entry.role));
  return entries.map((entry, index) => {
    const present = isPresent(entry.end);
    const role = publicText(entry.role);
    const company = publicText(entry.company);
    return {
      hash: shortHash(entry.role + entry.start),
      ref: present ? labels.headRef : labels.tagRef(entries.length - index),
      isHead: present,
      title: role || company,
      company: role ? company : "",
      start: publicText(entry.start),
      end: publicText(entry.end),
      present,
      bullets: entry.bullets.map(publicText).filter(Boolean),
    };
  });
})();

/** The commit highlighted when no card is in the middle band: HEAD, else the newest. */
export const HEAD_COMMIT = Math.max(
  0,
  SCREEN_COMMITS.findIndex((commit) => commit.isHead),
);

const FONT_PX = 24;
const ROW_H = 38;
const MAX_W = SCREEN_CANVAS_W - PAD_X * 2;

type Seg = { text: string; role: TermRole };

/** Cuts text with "…" so it fits maxWidth at the current font. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid).trimEnd()}…`).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${text.slice(0, lo).trimEnd()}…` : "";
}

/** Draws segments left to right; the last one is truncated to the remaining width. */
function drawRow(
  ctx: CanvasRenderingContext2D,
  segments: Seg[],
  y: number,
  colors: SceneColors,
  light: string,
) {
  let x = PAD_X;
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const text = isLast ? fit(ctx, segment.text, PAD_X + MAX_W - x) : segment.text;
    applyRole(ctx, segment.role, colors, light);
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width;
  });
  ctx.globalAlpha = 1;
}

function dateLine(commit: ScreenCommit, now: YearMonth): Seg[] {
  const segs: Seg[] = [{ text: "Date:   ", role: "muted" }];
  const range = [commit.start, commit.end].filter(Boolean).join(" → ");
  if (!range) return [];
  segs.push({ text: range, role: "light" });
  const start = parseContentDate(commit.start, "start");
  const end = commit.present ? now : parseContentDate(commit.end, "end");
  const months = start && end ? monthsBetween(start, end) : null;
  if (months) segs.push({ text: `  (${labels.duration(months)})`, role: "muted" });
  return segs;
}

/**
 * Paints the log and the active commit's details. `now` is the viewer's current month,
 * used when the end date is "Present".
 */
export function drawExperienceScreen(
  ctx: CanvasRenderingContext2D,
  commits: ScreenCommit[],
  activeIndex: number,
  colors: SceneColors,
  screenBg: string,
  now: YearMonth,
): void {
  const light = lightToken(colors);
  ctx.save();
  drawTitleBar(ctx, EXPERIENCE_TITLE, light, screenBg);
  ctx.font = `500 ${FONT_PX}px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  let top = BAR_H + PAD_TOP;
  const row = (segments: Seg[]) => {
    drawRow(ctx, segments, top + ROW_H / 2, colors, light);
    top += ROW_H;
  };
  const gap = (h: number) => {
    top += h;
  };

  row([
    { text: "$ ", role: "accent" },
    { text: LOG_COMMAND, role: "light" },
  ]);

  commits.forEach((commit, index) => {
    const active = index === activeIndex;
    if (active) {
      ctx.fillStyle = light;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(PAD_X / 2, top + 2, SCREEN_CANVAS_W - PAD_X, ROW_H - 4);
      ctx.globalAlpha = 1;
    }
    const title = commit.company ? `${commit.title} ${labels.companyPrefix} ${commit.company}` : commit.title;
    row([
      { text: "* ", role: active ? "accent" : "muted" },
      { text: `${commit.hash} `, role: "soft" },
      { text: `(${commit.ref}) `, role: commit.isHead ? "accent" : "muted" },
      { text: title, role: active ? "light" : "soft" },
    ]);
  });

  const commit = commits[activeIndex];
  if (commit) {
    // Divider between the log and the details.
    gap(ROW_H * 0.35);
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(PAD_X, top, MAX_W, 2);
    ctx.globalAlpha = 1;
    gap(ROW_H * 0.35);

    row([
      { text: "$ ", role: "accent" },
      { text: `git show ${commit.hash} --stat`, role: "light" },
    ]);
    const date = dateLine(commit, now);
    if (date.length > 0) row(date);

    const bullets = commit.bullets.slice(0, MAX_BULLETS);
    if (bullets.length > 0) {
      gap(ROW_H * 0.3);
      bullets.forEach((bullet) =>
        row([
          { text: "+ ", role: "accent" },
          { text: bullet, role: "light" },
        ]),
      );
      gap(ROW_H * 0.3);
      const n = commit.bullets.length;
      row([
        { text: ` ${n} ${n === 1 ? "insertion" : "insertions"}`, role: "muted" },
        { text: "(+)", role: "accent" },
      ]);
    }
  }

  ctx.restore();
}
