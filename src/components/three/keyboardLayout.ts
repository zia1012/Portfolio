import { MONO } from "./projectScreen";

/** Keyboard area on the laptop deck, in world units (matches the deck plane in Laptop.tsx). */
export const KEYBOARD_AREA_W = 2.05;
export const KEYBOARD_AREA_D = 0.72;

/** Legend canvas: same aspect as the keyboard area, about 1000 px per world unit. */
export const LEGEND_CANVAS_W = 2048;
export const LEGEND_CANVAS_H = 720;

/** Keycap height above the deck. */
export const KEYCAP_HEIGHT = 0.012;
/** Space between neighbouring keycaps, in world units. */
export const KEY_GAP = 0.016;

/** Rows are 15u wide; the function row is half height, so the block is 15u × 5.5u. */
const ROW_UNITS = 15;
const BLOCK_UNITS_D = 5.5;
const MARGIN_X = 0.07;
const MARGIN_Z = 0.02;

/** Size of one key unit (1u) in world units. */
export const KEY_UNIT = Math.min(
  (KEYBOARD_AREA_W - MARGIN_X * 2) / ROW_UNITS,
  (KEYBOARD_AREA_D - MARGIN_Z * 2) / BLOCK_UNITS_D,
);

type LegendKind = "char" | "dual" | "mod" | "fn" | "arrow" | "blank";
type Arrow = "left" | "right" | "up" | "down";

type KeyDef = {
  /** Width in units. */
  w: number;
  label?: string;
  /** Shifted symbol drawn above the main label. */
  shift?: string;
  kind: LegendKind;
  arrow?: Arrow;
  /** Accent homing bump (F and J). */
  home?: boolean;
};

export type Keycap = {
  /** Centre, relative to the keyboard area centre (x right, z towards the viewer). */
  x: number;
  z: number;
  /** Keycap footprint (cell minus gap). */
  w: number;
  d: number;
  def: KeyDef;
};

const char = (label: string, home = false): KeyDef => ({ w: 1, label, kind: "char", home });
const dual = (label: string, shift: string): KeyDef => ({ w: 1, label, shift, kind: "dual" });
const mod = (label: string, w: number): KeyDef => ({ w, label, kind: "mod" });

const FN_ROW: KeyDef[] = [
  { w: 1.5, label: "esc", kind: "mod" },
  ...Array.from({ length: 12 }, (_, i): KeyDef => ({ w: 1.125, label: `F${i + 1}`, kind: "fn" })),
];

const ROWS: KeyDef[][] = [
  [
    dual("`", "~"),
    dual("1", "!"),
    dual("2", "@"),
    dual("3", "#"),
    dual("4", "$"),
    dual("5", "%"),
    dual("6", "^"),
    dual("7", "&"),
    dual("8", "*"),
    dual("9", "("),
    dual("0", ")"),
    dual("-", "_"),
    dual("=", "+"),
    mod("backspace", 2),
  ],
  [
    mod("tab", 1.5),
    ..."QWERTYUIOP".split("").map((c) => char(c)),
    dual("[", "{"),
    dual("]", "}"),
    { ...dual("\\", "|"), w: 1.5 },
  ],
  [
    mod("caps", 1.75),
    ..."ASDFGHJKL".split("").map((c) => char(c, c === "F" || c === "J")),
    dual(";", ":"),
    dual("'", '"'),
    mod("enter", 2.25),
  ],
  [
    mod("shift", 2.25),
    ..."ZXCVBNM".split("").map((c) => char(c)),
    dual(",", "<"),
    dual(".", ">"),
    dual("/", "?"),
    mod("shift", 2.75),
  ],
];

const BOTTOM_LEFT: KeyDef[] = [mod("fn", 1), mod("ctrl", 1), mod("alt", 1), mod("cmd", 1)];
const SPACE: KeyDef = { w: 6, kind: "blank" };
const BOTTOM_RIGHT: KeyDef[] = [mod("alt", 1), mod("ctrl", 1)];

function buildLayout(): Keycap[] {
  const u = KEY_UNIT;
  const left = (-ROW_UNITS * u) / 2;
  const top = (-BLOCK_UNITS_D * u) / 2;
  const keys: Keycap[] = [];

  const place = (def: KeyDef, cellX: number, cellZ: number, cellW: number, cellD: number) => {
    keys.push({
      x: cellX + cellW / 2,
      z: cellZ + cellD / 2,
      w: cellW - KEY_GAP,
      d: cellD - KEY_GAP,
      def,
    });
  };

  const placeRow = (row: KeyDef[], z: number, d: number, startX = left) => {
    let x = startX;
    for (const def of row) {
      place(def, x, z, def.w * u, d);
      x += def.w * u;
    }
    return x;
  };

  placeRow(FN_ROW, top, 0.5 * u);
  ROWS.forEach((row, i) => placeRow(row, top + (0.5 + i) * u, u));

  // Bottom row: modifiers, space, modifiers, then the inverted-T arrows (half-height keys).
  const bottomZ = top + 4.5 * u;
  let x = placeRow([...BOTTOM_LEFT, SPACE, ...BOTTOM_RIGHT], bottomZ, u);
  const half = 0.5 * u;
  place({ w: 1, kind: "arrow", arrow: "left" }, x, bottomZ + half, u, half);
  x += u;
  place({ w: 1, kind: "arrow", arrow: "up" }, x, bottomZ, u, half);
  place({ w: 1, kind: "arrow", arrow: "down" }, x, bottomZ + half, u, half);
  x += u;
  place({ w: 1, kind: "arrow", arrow: "right" }, x, bottomZ + half, u, half);

  return keys;
}

/** Every keycap, computed once. */
export const KEYCAPS: Keycap[] = buildLayout();

export type LegendColors = { legend: string; accent: string };

/** Draws every key legend onto a transparent canvas laid over the keyboard area. */
export function drawKeyboardLegends(ctx: CanvasRenderingContext2D, { legend, accent }: LegendColors) {
  const sx = LEGEND_CANVAS_W / KEYBOARD_AREA_W;
  const sy = LEGEND_CANVAS_H / KEYBOARD_AREA_D;
  const unitPx = KEY_UNIT * sx;
  const pad = unitPx * 0.14;

  ctx.save();
  ctx.clearRect(0, 0, LEGEND_CANVAS_W, LEGEND_CANVAS_H);
  ctx.fillStyle = legend;
  ctx.globalAlpha = 0.85;

  for (const key of KEYCAPS) {
    const { def } = key;
    const cx = (key.x + KEYBOARD_AREA_W / 2) * sx;
    const cy = (key.z + KEYBOARD_AREA_D / 2) * sy;
    const w = key.w * sx;
    const h = key.d * sy;
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;

    switch (def.kind) {
      case "char": {
        ctx.font = `600 ${Math.round(unitPx * 0.36)}px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.label ?? "", cx, cy);
        if (def.home) {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = accent;
          const barW = w * 0.26;
          ctx.beginPath();
          ctx.roundRect(cx - barW / 2, y0 + h * 0.8, barW, h * 0.05, h * 0.025);
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case "dual": {
        ctx.font = `600 ${Math.round(unitPx * 0.26)}px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.shift ?? "", cx, y0 + h * 0.3);
        ctx.fillText(def.label ?? "", cx, y0 + h * 0.7);
        break;
      }
      case "mod": {
        ctx.font = `500 ${Math.round(unitPx * 0.2)}px ${MONO}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(def.label ?? "", x0 + pad, y0 + h - pad, w - pad * 2);
        break;
      }
      case "fn": {
        ctx.font = `500 ${Math.round(unitPx * 0.18)}px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.label ?? "", cx, cy);
        break;
      }
      case "arrow": {
        // Drawn as triangles so it does not depend on arrow glyphs in the font.
        const s = Math.min(w, h) * 0.22;
        const dir = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[def.arrow ?? "up"];
        const [dx, dy] = dir;
        ctx.beginPath();
        ctx.moveTo(cx + dx * s, cy + dy * s);
        ctx.lineTo(cx - dx * s - dy * s, cy - dy * s + dx * s);
        ctx.lineTo(cx - dx * s + dy * s, cy - dy * s - dx * s);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "blank":
        break;
    }
  }

  ctx.restore();
}
