/**
 * Scroll chapters: one per home-page section, in page order. The index of a section here
 * is also the index of its particle shape in shapes.ts.
 */
export const CHAPTER_IDS = ["top", "about", "projects", "experience", "skills", "contact"] as const;

export type Pose = {
  /** Position (world units; desktop layout, text column on the left). */
  x: number;
  y: number;
  z: number;
  /** Rotation in radians. */
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  /** Lid hinge angle: negative = open and leaning back, ~1.5 = closed. */
  lid: number;
};

export const POSES: Pose[] = [
  // hero: centred-right, open, three-quarter view
  // (z -0.4 keeps every corner >= 0.1 world units inside the view at 1440x900 incl. tilt/float)
  { x: 2.0, y: -0.1, z: -0.4, rx: 0.35, ry: -0.55, rz: 0, scale: 1, lid: -0.25 },
  // about: screen facing the viewer, angled slightly toward the text on the left
  { x: 2.1, y: 0.2, z: -0.3, rx: 0.18, ry: -0.35, rz: 0.04, scale: 0.92, lid: -0.2 },
  // projects: screen facing the viewer
  { x: 1.9, y: -0.15, z: 0.5, rx: 0.12, ry: -0.12, rz: 0, scale: 1.05, lid: -0.15 },
  // experience: three-quarter view toward the timeline, lid open
  { x: 2.1, y: -0.1, z: -0.5, rx: 0.22, ry: -0.45, rz: -0.03, scale: 0.92, lid: -0.2 },
  // skills: spun around, seen from behind
  { x: 2.1, y: 0.35, z: -1, rx: 0.85, ry: -2.4, rz: 0.2, scale: 0.8, lid: -0.05 },
  // contact: settling down and closing
  { x: 1.8, y: -0.6, z: 0, rx: 0.55, ry: -0.3, rz: 0, scale: 0.9, lid: 1.45 },
];

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Splits a fractional chapter value (e.g. 2.4) into the two chapters and the eased mix. */
export function chapterMix(chapter: number, count: number): { from: number; to: number; t: number } {
  const clamped = Math.min(Math.max(chapter, 0), count - 1);
  const from = Math.floor(clamped);
  const to = Math.min(from + 1, count - 1);
  return { from, to, t: smoothstep(clamped - from) };
}
