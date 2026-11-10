/**
 * Particle target shapes, one per scroll chapter (same order as CHAPTER_IDS):
 * sphere, torus, cube lattice, double helix, scattered cloud, envelope.
 * Plus two intro-only targets: `scatter` (start) and `initials` (text sampled from a canvas).
 * Uses a seeded PRNG so the output is deterministic.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sphere(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const radius = 1.8;
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    out[i * 3] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

function torus(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3);
  const R = 1.7;
  const tube = 0.35;
  for (let i = 0; i < count; i++) {
    const u = rand() * Math.PI * 2;
    const v = rand() * Math.PI * 2;
    const r = tube * Math.sqrt(rand());
    out[i * 3] = (R + r * Math.cos(v)) * Math.cos(u);
    out[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u) * 0.55;
    out[i * 3 + 2] = r * Math.sin(v) + (R + r * Math.cos(v)) * Math.sin(u) * 0.6;
  }
  return out;
}

function lattice(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const side = Math.ceil(Math.cbrt(count));
  const size = 3;
  const step = size / (side - 1);
  for (let i = 0; i < count; i++) {
    const x = i % side;
    const y = Math.floor(i / side) % side;
    const z = Math.floor(i / (side * side));
    out[i * 3] = x * step - size / 2;
    out[i * 3 + 1] = y * step - size / 2;
    out[i * 3 + 2] = z * step - size / 2;
  }
  return out;
}

function helix(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3);
  const turns = 3.5;
  const height = 4.4;
  const radius = 1.1;
  for (let i = 0; i < count; i++) {
    const strand = i % 2;
    const t = i / count;
    const angle = t * turns * Math.PI * 2 + strand * Math.PI;
    const jitter = () => (rand() - 0.5) * 0.12;
    out[i * 3] = Math.cos(angle) * radius + jitter();
    out[i * 3 + 1] = t * height - height / 2 + jitter();
    out[i * 3 + 2] = Math.sin(angle) * radius + jitter();
  }
  return out;
}

function cloud(count: number, rand: () => number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (rand() - 0.5) * 6;
    out[i * 3 + 1] = (rand() - 0.5) * 4.5;
    out[i * 3 + 2] = (rand() - 0.5) * 3;
  }
  return out;
}

/** Envelope size in local units and the flap tip height (fraction of the height from the top). */
const ENV_W = 3;
const ENV_H = 2;
const ENV_FLAP = 0.55;
/** How far the lower seams run from the bottom corners toward the centre (fraction). */
const ENV_SEAM = 0.55;
/** Roll baked into the shape (radians), so it sits slightly askew like a dropped letter. */
const ENV_TILT = -0.08;
/** Share of points: outline, flap, lower seams; the rest fills the body. */
const ENV_OUTLINE = 0.45;
const ENV_FLAP_SHARE = 0.3;
const ENV_SEAMS = 0.15;
/** Positional "dust" noise and z thickness (half-range). */
const ENV_NOISE = 0.02;
const ENV_Z = 0.04;

type Vec2 = [number, number];

/** `n` points evenly spaced by arc length along a polyline (open or closed). */
function alongPath(path: Vec2[], n: number, closed: boolean): Vec2[] {
  const pts = closed ? [...path, path[0]] : path;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lengths.push(len);
    total += len;
  }
  const out: Vec2[] = [];
  // Closed paths use (k + 0.5) / n so the seam point is not doubled; open ones include the ends.
  for (let k = 0; k < n; k++) {
    const u = closed ? (k + 0.5) / n : n === 1 ? 0.5 : k / (n - 1);
    let d = u * total;
    let seg = 0;
    while (seg < lengths.length - 1 && d > lengths[seg]) {
      d -= lengths[seg];
      seg++;
    }
    const f = lengths[seg] > 0 ? d / lengths[seg] : 0;
    out.push([
      pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f,
      pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f,
    ]);
  }
  return out;
}

/**
 * Envelope in the XY plane (faces the camera): rectangle outline, a V flap from the top
 * corners to a tip at ENV_FLAP of the height, short seams from the bottom corners, and a
 * sparse body. Lines are evenly spaced; the point order is shuffled (seeded) so the
 * per-index morph from the cloud does not sweep along the lines.
 */
function envelope(count: number): Float32Array {
  const rand = mulberry32(2024);
  const hw = ENV_W / 2;
  const hh = ENV_H / 2;
  const tip: Vec2 = [0, hh - ENV_FLAP * ENV_H];

  const nOutline = Math.round(count * ENV_OUTLINE);
  const nFlap = Math.round(count * ENV_FLAP_SHARE);
  const nSeams = Math.round(count * ENV_SEAMS);
  const nBody = Math.max(count - nOutline - nFlap - nSeams, 0);
  const nSeamEach = Math.floor(nSeams / 2);

  const seam = (side: number): Vec2[] => [
    [side * hw, -hh],
    [side * hw + (tip[0] - side * hw) * ENV_SEAM, -hh + (tip[1] + hh) * ENV_SEAM],
  ];

  const pts: Vec2[] = [
    ...alongPath(
      [
        [-hw, hh],
        [hw, hh],
        [hw, -hh],
        [-hw, -hh],
      ],
      nOutline,
      true,
    ),
    ...alongPath([[-hw, hh], tip, [hw, hh]], nFlap, false),
    ...alongPath(seam(-1), nSeamEach, false),
    ...alongPath(seam(1), nSeams - nSeamEach, false),
  ];

  // Body: jittered grid cells (even, low density), kept just inside the outline.
  const cols = Math.max(Math.round(Math.sqrt((nBody * ENV_W) / ENV_H)), 1);
  const rows = Math.max(Math.ceil(nBody / cols), 1);
  for (let k = 0; k < nBody; k++) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    pts.push([
      -hw * 0.94 + ((c + rand()) / cols) * ENV_W * 0.94,
      -hh * 0.94 + ((r + rand()) / rows) * ENV_H * 0.94,
    ]);
  }

  // Seeded Fisher-Yates shuffle of the index order.
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pts[i];
    pts[i] = pts[j];
    pts[j] = tmp;
  }

  const cos = Math.cos(ENV_TILT);
  const sin = Math.sin(ENV_TILT);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [px, py] = pts[i];
    const x = px + (rand() - 0.5) * 2 * ENV_NOISE;
    const y = py + (rand() - 0.5) * 2 * ENV_NOISE;
    out[i * 3] = x * cos - y * sin;
    out[i * 3 + 1] = x * sin + y * cos;
    out[i * 3 + 2] = (rand() - 0.5) * 2 * ENV_Z;
  }
  return out;
}

/** Intro start: points spread wide around and in front of the field. */
export function scatter(count: number): Float32Array {
  const rand = mulberry32(7);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (rand() - 0.5) * 11;
    out[i * 3 + 1] = (rand() - 0.5) * 7;
    out[i * 3 + 2] = (rand() - 0.5) * 5;
  }
  return out;
}

export type InitialsLayout = {
  /** Width of the text in world units. */
  width: number;
  /** Centre of the text in the particle group's local space. */
  cx: number;
  cy: number;
  /** Highest allowed top edge (local y); the text moves down to stay under it. */
  maxTop: number;
};

/**
 * "Initials" target: samples the filled pixels of `text` drawn on an offscreen canvas in a
 * bold heading font, mapped to a flat plane with a little z jitter. Returns null when no 2D
 * canvas is available (the caller falls back to the sphere).
 */
export function initials(
  count: number,
  text: string,
  fontFamily: string,
  layout: InitialsLayout,
): Float32Array | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !text) return null;

  const fontPx = 200;
  const font = `700 ${fontPx}px ${fontFamily}`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const left = Math.ceil(metrics.actualBoundingBoxLeft);
  const right = Math.ceil(metrics.actualBoundingBoxRight);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent);
  const pad = 4;
  const w = left + right + pad * 2;
  const h = ascent + descent + pad * 2;
  if (w <= pad * 2 || h <= pad * 2) return null;
  canvas.width = w;
  canvas.height = h;
  // Resizing resets the context state.
  ctx.font = font;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, pad + left, pad + ascent);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  // Candidate points on a 2px grid inside the glyphs.
  const stepPx = 2;
  const candidates: number[] = [];
  for (let y = 0; y < h; y += stepPx) {
    for (let x = 0; x < w; x += stepPx) {
      if (data[(y * w + x) * 4 + 3] > 128) candidates.push(x, y);
    }
  }
  const available = candidates.length / 2;
  if (available === 0) return null;

  const rand = mulberry32(11);
  // Partial Fisher-Yates: the first `take` candidates become a random, distinct sample.
  const take = Math.min(count, available);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rand() * (available - i));
    const tx = candidates[i * 2];
    const ty = candidates[i * 2 + 1];
    candidates[i * 2] = candidates[j * 2];
    candidates[i * 2 + 1] = candidates[j * 2 + 1];
    candidates[j * 2] = tx;
    candidates[j * 2 + 1] = ty;
  }

  const scale = layout.width / w;
  const cy = Math.min(layout.cy, layout.maxTop - (h * scale) / 2);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // More particles than candidates: reuse samples (jitter keeps them from stacking).
    const k = i < take ? i : Math.floor(rand() * take);
    const px = candidates[k * 2] + (rand() - 0.5) * stepPx;
    const py = candidates[k * 2 + 1] + (rand() - 0.5) * stepPx;
    out[i * 3] = layout.cx + (px - w / 2) * scale;
    out[i * 3 + 1] = cy - (py - h / 2) * scale;
    out[i * 3 + 2] = (rand() - 0.5) * 0.12;
  }
  return out;
}

export function buildShapes(count: number): Float32Array[] {
  const rand = mulberry32(42);
  return [
    sphere(count),
    torus(count, rand),
    lattice(count),
    helix(count, rand),
    cloud(count, rand),
    envelope(count),
  ];
}
