import { MONO, SCREEN_CANVAS_H, SCREEN_CANVAS_W } from "./projectScreen";
import type { SceneColors } from "./useThemeColors";

/**
 * Hero terminal on the laptop screen: an API server that boots once (typed out), then keeps
 * streaming request logs. Decorative canvas art, like the code bars and the project prompt.
 */

/** accent, light, soft (dimmed light: JSON literals), muted (punctuation, secondary text). */
export type TermRole = "accent" | "light" | "soft" | "muted";
export type TermSegment = { text: string; role: TermRole };
export type TermLine = TermSegment[];

export type TerminalState = {
  lines: TermLine[];
  /** Characters shown of the last line while it is being typed; null once it is complete. */
  typed: number | null;
};

export const TERMINAL_TITLE = "zia";

const seg = (text: string, role: TermRole = "light"): TermSegment => ({ text, role });

const METHOD_COL = 5;
const PATH_COL = 28;

/** `GET  /api/v1/projects        200  12ms`: fixed columns, so the log reads as a table. */
function requestLine(method: string, path: string, status: number, ms: number): TermLine {
  const statusRole: TermRole = status === 429 ? "accent" : status === 304 ? "muted" : "light";
  return [
    seg(method.padEnd(METHOD_COL)),
    seg(path.padEnd(PATH_COL)),
    seg(String(status), statusRole),
    seg(`${ms}ms`.padStart(6), status === 429 ? "accent" : "muted"),
  ];
}

type BootStep = {
  line: TermLine;
  /** Characters visible as soon as the line appears (e.g. the "$ " prompt). */
  startAt: number;
  charsPerTick: number;
  tickMs: number;
  /** Wait after the line is complete. */
  pauseMs: number;
};

/** Typed command: one character per 60ms. */
const command = (line: TermLine, pauseMs: number): BootStep => ({
  line,
  startAt: 2,
  charsPerTick: 1,
  tickMs: 60,
  pauseMs,
});
/** Program output: 5 characters per 34ms tick (under 30 redraws a second). */
const output = (line: TermLine, pauseMs: number): BootStep => ({
  line,
  startAt: 0,
  charsPerTick: 5,
  tickMs: 34,
  pauseMs,
});
/** Request logs print whole. */
const log = (line: TermLine, pauseMs: number): BootStep => ({
  line,
  startAt: Infinity,
  charsPerTick: Infinity,
  tickMs: 0,
  pauseMs,
});

const BOOT: BootStep[] = [
  command([seg("$ ", "accent"), seg("npm run start")], 380),
  output([seg("> api@1.0.0 start", "muted")], 90),
  output([seg("> node server.js", "muted")], 420),
  output([seg("✓ ", "accent"), seg("postgres connected (pool: 10)")], 260),
  output([seg("✓ ", "accent"), seg("redis cache ready")], 200),
  output([seg("✓ ", "accent"), seg("jwt auth middleware loaded")], 300),
  output([seg("▲ ", "accent"), seg("API listening on :8080")], 650),
  log(requestLine("GET", "/api/v1/projects", 200, 12), 380),
  log(requestLine("POST", "/api/v1/auth/login", 200, 48), 320),
  log(requestLine("GET", "/api/v1/stafwise/shifts", 200, 9), 800),
];

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  /** Latency range for a normal response, in ms. */
  ms: [number, number];
  /** Sometimes answers 201 Created. */
  creates?: boolean;
  /** Sometimes answers 304 Not Modified. */
  cacheable?: boolean;
};

export const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/v1/stafwise/shifts", ms: [6, 18], cacheable: true },
  { method: "POST", path: "/api/v1/stafwise/payroll", ms: [60, 140], creates: true },
  { method: "POST", path: "/api/v1/stafwise/leave", ms: [20, 45], creates: true },
  { method: "GET", path: "/api/v1/stafwise/leave", ms: [8, 20], cacheable: true },
  { method: "POST", path: "/api/v1/acadlynk/attendance", ms: [15, 40], creates: true },
  { method: "GET", path: "/api/v1/acadlynk/exams", ms: [10, 30], cacheable: true },
  { method: "GET", path: "/api/v1/acadlynk/fees", ms: [12, 35], cacheable: true },
  { method: "GET", path: "/api/v1/atruha/stocks", ms: [18, 60], cacheable: true },
  { method: "GET", path: "/api/v1/atruha/quotes", ms: [4, 15] },
  { method: "GET", path: "/api/v1/news/summaries", ms: [25, 90], cacheable: true },
  { method: "POST", path: "/api/v1/auth/refresh", ms: [8, 22] },
  { method: "GET", path: "/api/v1/projects", ms: [5, 14], cacheable: true },
];

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Mostly 200, some 304 (cacheable GETs) and 201 (creates), about 4% rate limited (429). */
function randomRequest(lastIndex: number): { line: TermLine; index: number } {
  let index = Math.floor(Math.random() * ENDPOINTS.length);
  if (index === lastIndex) index = (index + 1) % ENDPOINTS.length;
  const endpoint = ENDPOINTS[index];
  const roll = Math.random();
  let status = 200;
  if (roll < 0.04) status = 429;
  else if (endpoint.cacheable && roll < 0.16) status = 304;
  else if (endpoint.creates && roll < 0.5) status = 201;
  const ms =
    status === 429 ? randInt(1, 2) : status === 304 ? randInt(2, 5) : randInt(...endpoint.ms);
  return { line: requestLine(endpoint.method, endpoint.path, status, ms), index };
}

const START_DELAY_MS = 600;
const STREAM_MIN_MS = 700;
const STREAM_MAX_MS = 1100;
/** Lines kept in memory; only the last rows that fit are drawn. */
const MAX_KEPT = 32;

const lineLength = (line: TermLine) => line.reduce((sum, s) => sum + s.text.length, 0);

export type TerminalFeed = {
  state: TerminalState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

/**
 * Drives the terminal with a single setTimeout chain. `onChange` runs once per added
 * character chunk or line; the caller redraws the canvas on its next frame.
 */
export function createTerminalFeed(onChange: () => void): TerminalFeed {
  const state: TerminalState = { lines: [], typed: null };
  let bootIndex = 0;
  let lastEndpoint = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The next tick is due; kept while paused so resume() continues where it stopped. */
  let pending = false;
  let stopped = false;

  const schedule = (ms: number) => {
    pending = true;
    timer = setTimeout(tick, ms);
  };

  const push = (line: TermLine) => {
    state.lines.push(line);
    if (state.lines.length > MAX_KEPT) state.lines.splice(0, state.lines.length - MAX_KEPT);
  };

  function tick() {
    timer = undefined;
    pending = false;
    if (stopped) return;

    if (bootIndex >= BOOT.length) {
      const next = randomRequest(lastEndpoint);
      lastEndpoint = next.index;
      push(next.line);
      onChange();
      schedule(randInt(STREAM_MIN_MS, STREAM_MAX_MS));
      return;
    }

    const step = BOOT[bootIndex];
    const total = lineLength(step.line);
    if (state.typed === null) {
      push(step.line);
      state.typed = Math.min(step.startAt, total);
    }
    state.typed = Math.min(state.typed + step.charsPerTick, total);
    if (state.typed >= total) {
      state.typed = null;
      bootIndex++;
      onChange();
      schedule(step.pauseMs);
    } else {
      onChange();
      schedule(step.tickMs);
    }
  }

  return {
    state,
    start() {
      if (!pending && !stopped && state.lines.length === 0) schedule(START_DELAY_MS);
    },
    pause() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
    resume() {
      if (pending && timer === undefined && !stopped) timer = setTimeout(tick, 200);
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

export const BAR_H = 52;
const FONT_PX = 28;
const ROW_H = 38;
export const PAD_X = 36;
export const PAD_TOP = 22;
export const PAD_BOTTOM = 14;
/** Rows that fit under the title bar (13 at 1024×614). */
const ROWS = Math.floor((SCREEN_CANVAS_H - BAR_H - PAD_TOP - PAD_BOTTOM) / ROW_H);

/** Block cursor cell in canvas pixels (top-left corner and size). */
export type CursorCell = { x: number; y: number; w: number; h: number };

/** The screen is dark in both themes, so text uses whichever token is light. */
export function lightToken(colors: SceneColors): string {
  return colors.isDark ? colors.text : colors.background;
}

export function applyRole(
  ctx: CanvasRenderingContext2D,
  role: TermRole,
  colors: SceneColors,
  light: string,
) {
  if (role === "accent") {
    // The screen is dark in both themes: always the dark accent (5.46:1 in the light theme).
    ctx.fillStyle = colors.screenAccent;
    ctx.globalAlpha = 1;
  } else if (role === "soft") {
    ctx.fillStyle = light;
    ctx.globalAlpha = 0.78;
  } else if (role === "muted") {
    // --text-muted is too dark on the light theme's dark screen; dim the light token instead.
    ctx.fillStyle = colors.isDark ? colors.muted : light;
    ctx.globalAlpha = colors.isDark ? 1 : 0.62;
  } else {
    ctx.fillStyle = light;
    ctx.globalAlpha = 1;
  }
}

/**
 * Clears the canvas to the screen colour and paints the window title bar (three dots and
 * the title). Leaves textBaseline "middle" set; restores nothing else, so call inside save().
 */
export function drawTitleBar(
  ctx: CanvasRenderingContext2D,
  title: string,
  light: string,
  screenBg: string,
) {
  const W = SCREEN_CANVAS_W;
  const H = SCREEN_CANVAS_H;
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.fillStyle = screenBg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = light;
  ctx.globalAlpha = 0.06;
  ctx.fillRect(0, 0, W, BAR_H);
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, BAR_H - 2, W, 2);
  ctx.globalAlpha = 0.45;
  [28, 52, 76].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, BAR_H / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 0.8;
  ctx.font = `500 24px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, W / 2, BAR_H / 2 + 1, W - 240);
  ctx.globalAlpha = 1;
}

/**
 * Paints the hero terminal (title bar and the last rows that fit) and returns where the
 * block cursor goes. The cursor itself is a separate mesh, so blinking needs no redraw.
 */
export function drawHeroTerminal(
  ctx: CanvasRenderingContext2D,
  state: TerminalState,
  colors: SceneColors,
  screenBg: string,
): CursorCell {
  return drawTerminalScreen(ctx, state, colors, screenBg, TERMINAL_TITLE);
}

/** Same as drawHeroTerminal with any window title; shared with the About screen. */
export function drawTerminalScreen(
  ctx: CanvasRenderingContext2D,
  state: TerminalState,
  colors: SceneColors,
  screenBg: string,
  title: string,
): CursorCell {
  const light = lightToken(colors);

  ctx.save();
  drawTitleBar(ctx, title, light, screenBg);

  // Body: the last ROWS rows, counting the cursor's own row once the last line is complete.
  ctx.font = `500 ${FONT_PX}px ${MONO}`;
  ctx.textAlign = "left";
  const charW = ctx.measureText("M").width;
  const { lines, typed } = state;
  const rowsUsed = lines.length + (typed === null ? 1 : 0);
  const first = Math.max(0, rowsUsed - ROWS);
  const rowY = (row: number) => BAR_H + PAD_TOP + row * ROW_H;
  let cursorX = PAD_X;

  for (let i = first; i < lines.length; i++) {
    const isTyping = i === lines.length - 1 && typed !== null;
    let limit = isTyping ? typed : Infinity;
    let x = PAD_X;
    const y = rowY(i - first) + ROW_H / 2;
    for (const segment of lines[i]) {
      if (limit <= 0) break;
      const text = segment.text.length > limit ? segment.text.slice(0, limit) : segment.text;
      limit -= text.length;
      applyRole(ctx, segment.role, colors, light);
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    }
    if (isTyping) cursorX = x;
  }

  ctx.restore();
  return { x: cursorX, y: rowY(rowsUsed - 1 - first) + 4, w: charW, h: ROW_H - 8 };
}
