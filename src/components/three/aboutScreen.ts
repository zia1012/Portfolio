import { site } from "@/content/site";
import { skills } from "@/content/skills";
import { publicText } from "@/lib/content";
import type { TermLine, TermRole, TermSegment, TerminalState } from "./heroTerminal";

/**
 * About screen on the laptop: `curl .../v1/me | jq` typed once, then a JSON profile built
 * from the content files. Decorative canvas art, like the hero terminal.
 */

export const ABOUT_TITLE = "zia";

/** Decorative constants (not visible page copy), like the hero terminal script. */
const COMMAND = "curl -s api.zia.dev/v1/me | jq";
const FOCUS = "backend";
/** From the resume summary ("2+ years building production systems"). */
const EXPERIENCE = "2+ years";
const AVAILABLE = true;
const MAX_STACK = 4;
/**
 * Characters that fit on one row: (1024 - 2 × 36) px at 28px monospace. Fonts in the MONO
 * stack are 15.4–16.9px per character, so 54 leaves room for the widest.
 */
const MAX_COLS = 54;

const seg = (text: string, role: TermRole = "light"): TermSegment => ({ text, role });

/** Skill item by group name and position, or by prefix; parentheses stripped, TODO skipped. */
function skill(group: string, pick: number | string): string | null {
  const items = skills.find((g) => g.group === group)?.items ?? [];
  const item =
    typeof pick === "number" ? items[pick] : items.find((i) => publicText(i).startsWith(pick));
  if (!item) return null;
  const text = publicText(item)
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  return text || null;
}

function stackItems(): string[] {
  const picked = [skill("Backend", 0), skill("Backend", 1), skill("Databases", 0), skill("Cloud / DevOps", "AWS")];
  return [...new Set(picked.filter((s): s is string => s !== null))].slice(0, MAX_STACK);
}

type Value = string | number | boolean | string[];

const lineLength = (line: TermLine) => line.reduce((sum, s) => sum + s.text.length, 0);

function scalar(value: string | number | boolean): TermSegment {
  return typeof value === "string" ? seg(JSON.stringify(value), "accent") : seg(String(value), "soft");
}

/** `  "key": value,` as coloured segments; arrays wrap onto aligned rows if too wide. */
function field(key: string, value: Value, last: boolean): TermLine[] {
  const head: TermLine = [seg("  "), seg(JSON.stringify(key), "light"), seg(": ", "muted")];
  const tail = last ? [] : [seg(",", "muted")];
  if (!Array.isArray(value)) return [[...head, scalar(value), ...tail]];

  const indent = " ".repeat(lineLength(head) + 1);
  const rows: TermLine[] = [];
  let row: TermLine = [...head, seg("[", "muted")];
  value.forEach((item, index) => {
    const isLast = index === value.length - 1;
    const parts = [scalar(item), seg(isLast ? "]" : ",", "muted"), ...(isLast ? tail : [])];
    const sep = index === 0 ? [] : [seg(" ")];
    const width = lineLength([...sep, ...parts]);
    if (index > 0 && lineLength(row) + width > MAX_COLS) {
      rows.push(row);
      row = [seg(indent), ...parts];
    } else {
      row = [...row, ...sep, ...parts];
    }
  });
  if (value.length === 0) row = [...row, seg("]", "muted"), ...tail];
  rows.push(row);
  return rows;
}

/** The JSON body, skipping any field whose content source is a TODO. */
export function aboutJsonLines(): TermLine[] {
  const fields: [string, Value][] = [];
  const add = (key: string, value: Value | null) => {
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) return;
    fields.push([key, value]);
  };
  add("name", publicText(site.name));
  add("role", publicText(site.role));
  add("focus", FOCUS);
  add("location", site.location ? publicText(site.location) : null);
  add("experience", EXPERIENCE);
  add("stack", stackItems());
  add("available", AVAILABLE);

  return [
    [seg("{", "muted")],
    ...fields.flatMap(([key, value], index) => field(key, value, index === fields.length - 1)),
    [seg("}", "muted")],
  ];
}

const commandLine = (): TermLine => [seg("$ ", "accent"), seg(COMMAND)];
const promptLine = (): TermLine => [seg("$ ", "accent")];

/** Typing speed of the command and the gap between JSON lines (both under 30 redraws/s). */
const CHAR_MS = 45;
const LINE_MS = 60;
const START_MS = 300;
const AFTER_COMMAND_MS = 280;

export type AboutFeed = {
  state: TerminalState;
  /** True once the prompt after the JSON is shown. */
  readonly done: boolean;
  readonly started: boolean;
  start: () => void;
  /** Jump to the complete output (no retype later). */
  finish: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

/**
 * Types the command, then prints the JSON one line at a time, then shows a fresh prompt.
 * Runs once. The final prompt line stays "typing" (typed = 2) so the cursor sits after `$ `.
 */
export function createAboutFeed(onChange: () => void): AboutFeed {
  const command = commandLine();
  const json = aboutJsonLines();
  const state: TerminalState = { lines: [], typed: null };
  let jsonIndex = 0;
  let started = false;
  let done = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = false;
  let nextMs = 0;

  const schedule = (ms: number) => {
    pending = true;
    nextMs = ms;
    timer = setTimeout(tick, ms);
  };

  const complete = () => {
    state.lines = [command, ...json, promptLine()];
    state.typed = 2;
    done = true;
  };

  function tick() {
    timer = undefined;
    pending = false;
    if (stopped || done) return;

    if (state.lines.length === 0) {
      state.lines.push(command);
      state.typed = 2;
      onChange();
      schedule(START_MS);
      return;
    }
    if (state.typed !== null) {
      state.typed += 1;
      if (state.typed >= lineLength(command)) {
        state.typed = null;
        onChange();
        schedule(AFTER_COMMAND_MS);
      } else {
        onChange();
        schedule(CHAR_MS);
      }
      return;
    }
    if (jsonIndex < json.length) {
      state.lines.push(json[jsonIndex++]);
      onChange();
      schedule(LINE_MS);
      return;
    }
    complete();
    onChange();
  }

  return {
    state,
    get done() {
      return done;
    },
    get started() {
      return started;
    },
    start() {
      if (started || stopped) return;
      started = true;
      schedule(0);
    },
    finish() {
      if (done) return;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      pending = false;
      started = true;
      complete();
      onChange();
    },
    pause() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
    resume() {
      if (pending && timer === undefined && !stopped) timer = setTimeout(tick, Math.min(nextMs, 200));
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
