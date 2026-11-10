"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  MathUtils,
  SRGBColorSpace,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera,
} from "three";
import { projects } from "@/content/projects";
import { visibleItems } from "@/lib/content";
import { screenshotSrc } from "@/lib/screenshots";
import type { YearMonth } from "@/lib/dateParse";
import { ABOUT_TITLE, createAboutFeed, type AboutFeed } from "./aboutScreen";
import { getActiveCommit, subscribeActiveCommit } from "./activeCommit";
import { getActiveProject, subscribeActiveProject } from "./activeProject";
import { CHAPTER_IDS, POSES, chapterMix, smoothstep } from "./chapters";
import { HEAD_COMMIT, SCREEN_COMMITS, drawExperienceScreen } from "./experienceScreen";
import {
  createTerminalFeed,
  drawHeroTerminal,
  drawTerminalScreen,
  type CursorCell,
  type TerminalFeed,
} from "./heroTerminal";
import { Keyboard } from "./Keyboard";
import { KEYBOARD_AREA_D, KEYBOARD_AREA_W } from "./keyboardLayout";
import {
  SCREEN_CANVAS_H,
  SCREEN_CANVAS_W,
  drawProjectScreen,
  drawProjectScreenshot,
  headingFontFamily,
  hostOf,
  type ScreenProject,
} from "./projectScreen";
import type { SceneColors } from "./useThemeColors";

const ABOUT_CHAPTER = CHAPTER_IDS.indexOf("about");
const PROJECTS_CHAPTER = CHAPTER_IDS.indexOf("projects");
const EXPERIENCE_CHAPTER = CHAPTER_IDS.indexOf("experience");
/** How close the smoothed chapter must be to the projects chapter to show the project display. */
const PROJECT_RANGE = 0.6;
/** The hero terminal shows while the smoothed chapter is below this. */
const HERO_RANGE = 0.6;
/** How close the smoothed chapter must be to the about / experience chapter. */
const ABOUT_RANGE = 0.5;
const EXPERIENCE_RANGE = 0.5;
/** Crossfade duration between the screen displays, in seconds. */
const FADE_SECONDS = 0.3;
/** In-canvas crossfade when the active commit changes, in seconds. */
const COMMIT_FADE_SECONDS = 0.15;
/** The About and Experience canvases redraw at most this often (about 30 per second). */
const MIN_DRAW_INTERVAL = 1 / 30 - 0.002;

/**
 * Overlay planes above the base display (z 0.002), 0.001 apart. All overlays are transparent
 * with depthWrite off, so their draw order comes from renderOrder, not from depth sorting.
 */
const LAYER = {
  code: { z: 0.004, order: 1 },
  project: { z: 0.005, order: 2 },
  hero: { z: 0.006, order: 3 },
  about: { z: 0.007, order: 4 },
  experience: { z: 0.008, order: 5 },
  /** Block cursors of the hero and About terminals. */
  cursor: { z: 0.009, order: 6 },
} as const;

/** Cursor-following tilt in the hero (desktop pointer only), in radians. */
const TILT_YAW = 0.18;
const TILT_PITCH = 0.1;
const TILT_LAMBDA = 3;
/** The tilt fades out linearly between chapter 0 and this value. */
const TILT_FADE = 0.8;

type Display = "code" | "hero" | "about" | "project" | "experience";

/**
 * Projects zig-zag (md+): even cards sit on the left, odd on the right, and the laptop moves
 * to the empty side. side = +1 puts it on the right, -1 on the left.
 */
const PROJECT_INDEX = new Map(projects.map((p, index) => [p.slug, index]));
/** Preferred distance from the centre on the empty side, in world units. */
const SIDE_X = 2.0;
/** Yaw toward the card: -SIDE_YAW on the right, +SIDE_YAW on the left. */
const SIDE_YAW = 0.25;
const SIDE_LAMBDA = 3;
/** Gap kept between the laptop and the viewport edge, in world units. */
const EDGE_MARGIN = 0.1;

/**
 * Largest |x| at which the laptop (projects pose, yawed by SIDE_YAW) stays inside the view.
 * Checks the two outer corners of the base: the front one is nearer the camera, so it is
 * usually the one that clips first.
 */
function maxSideX(aspect: number, tanHalfFov: number, cameraZ: number): number {
  const pose = POSES[PROJECTS_CHAPTER];
  const halfW = 1.2 * pose.scale;
  const halfD = 0.8 * pose.scale;
  const cos = Math.cos(SIDE_YAW);
  const sin = Math.sin(SIDE_YAW);
  let limit = Infinity;
  // Laptop on the left, yaw +SIDE_YAW (the right side is the mirror image).
  for (const z of [halfD, -halfD]) {
    const x = -halfW;
    const cornerX = x * cos + z * sin;
    // +0.1: the model is offset forward inside the root group.
    const cornerZ = pose.z + 0.1 + (-x * sin + z * cos);
    const halfVisible = (cameraZ - cornerZ) * tanHalfFov * aspect;
    limit = Math.min(limit, halfVisible - Math.abs(cornerX) - EDGE_MARGIN);
  }
  return Math.max(limit, 0);
}

const SCREEN_PROJECTS = new Map<string, ScreenProject>(
  projects.map((p) => [
    p.slug,
    {
      slug: p.slug,
      title: p.title,
      tags: visibleItems(p.tags),
      ...(screenshotSrc(p.slug)
        ? { screenshot: { src: screenshotSrc(p.slug) as string, host: hostOf(p.links.live) } }
        : {}),
    },
  ]),
);

function createScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_CANVAS_W;
  canvas.height = SCREEN_CANVAS_H;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { ctx: canvas.getContext("2d"), texture };
}

/** The viewer's current month (client-only canvas code, so no caching concerns). */
function currentMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/** Moves and scales a unit-plane cursor mesh onto a canvas cell of the screen. */
function placeCursor(mesh: Mesh, cell: CursorCell) {
  mesh.position.set(
    -SCREEN_W / 2 + ((cell.x + cell.w / 2) / SCREEN_CANVAS_W) * SCREEN_W,
    0.76 + SCREEN_H / 2 - ((cell.y + cell.h / 2) / SCREEN_CANVAS_H) * SCREEN_H,
    LAYER.cursor.z,
  );
  mesh.scale.set((cell.w / SCREEN_CANVAS_W) * SCREEN_W, (cell.h / SCREEN_CANVAS_H) * SCREEN_H, 1);
}

/** Glowing "code" bars on the screen: indent level and width in screen units. */
const CODE_LINES = [
  { indent: 0, width: 0.9, opacity: 1 },
  { indent: 1, width: 1.2, opacity: 0.75 },
  { indent: 2, width: 0.7, opacity: 0.75 },
  { indent: 2, width: 1.0, opacity: 0.55 },
  { indent: 1, width: 0.4, opacity: 0.75 },
  { indent: 0, width: 0.25, opacity: 1 },
  { indent: 0, width: 1.1, opacity: 0.55 },
  { indent: 1, width: 0.8, opacity: 0.75 },
];

const SCREEN_W = 2.2;
const SCREEN_H = 1.32;
/** Light theme: how far the keyboard deck blends from the body colour toward --text. */
const DECK_DARKEN = 0.35;
const LINE_H = 0.06;
const LINE_GAP = 0.14;

type LaptopProps = {
  chapter: RefObject<number>;
  /** Mouse/pen position over the window, -1..1 (y up); stays at 0 for touch. */
  pointer: RefObject<{ x: number; y: number }>;
  colors: SceneColors;
};

export function Laptop({ chapter, pointer, colors }: LaptopProps) {
  const root = useRef<Group>(null);
  const hinge = useRef<Group>(null);
  const cursor = useRef<Mesh>(null);
  const smoothed = useRef(0);
  /** Damped toward +1 (laptop right) or -1 (laptop left); keeps its value when no card is active. */
  const side = useRef(1);
  const sideTarget = useRef(1);

  const screenBg = colors.isDark ? colors.background : colors.text;
  // Light theme: the body is --text-muted, so the deck is 35% of the way to --text to give
  // the keyboard area an edge. Dark: --surface.
  const deck = useMemo(
    () =>
      colors.isDark
        ? colors.surface
        : `#${new Color(colors.muted).lerp(new Color(colors.text), DECK_DARKEN).getHexString()}`,
    [colors],
  );

  // Project display: a canvas texture redrawn only when the active slug or the theme changes.
  const screen = useRef<ReturnType<typeof createScreenTexture>>(null);
  const codeLines = useRef<Group>(null);
  const lineMaterials = useRef<(MeshBasicMaterial | null)[]>([]);
  const cursorMaterial = useRef<MeshBasicMaterial>(null);
  const projectMesh = useRef<Mesh>(null);
  const projectMaterial = useRef<MeshBasicMaterial>(null);
  const activeSlug = useRef<string | null>(getActiveProject());
  /** Slug currently painted on the canvas (kept while fading out). */
  const drawnSlug = useRef<string | null>(null);
  const dirty = useRef(true);
  const fontsReady = useRef(false);
  const colorsRef = useRef({ colors, screenBg });
  /** Linear crossfade weight (0..1) per display; eased when applied. */
  const weights = useRef<Record<Display, number>>({
    code: 0,
    hero: 1,
    about: 0,
    project: 0,
    experience: 0,
  });

  // About screen: `curl /v1/me` typed once, redrawn (throttled) after the feed changes.
  const aboutScreen = useRef<ReturnType<typeof createScreenTexture>>(null);
  const aboutFeed = useRef<AboutFeed>(null);
  const aboutMesh = useRef<Mesh>(null);
  const aboutMaterial = useRef<MeshBasicMaterial>(null);
  const aboutCursor = useRef<Mesh>(null);
  const aboutCursorMaterial = useRef<MeshBasicMaterial>(null);
  const aboutDirty = useRef(true);
  const aboutDrawn = useRef(false);
  const aboutCell = useRef<CursorCell>(null);
  const aboutLastDraw = useRef(-Infinity);

  // Experience screen: git log of the jobs, redrawn when the active commit or theme changes.
  const expScreen = useRef<ReturnType<typeof createScreenTexture>>(null);
  /** Snapshot of the previous frame, faded out over the new one when the commit changes. */
  const expPrev = useRef<CanvasRenderingContext2D>(null);
  const expMesh = useRef<Mesh>(null);
  const expMaterial = useRef<MeshBasicMaterial>(null);
  const activeCommit = useRef<number | null>(getActiveCommit());
  /** Commit currently painted on the canvas (null before the first draw). */
  const drawnCommit = useRef<number | null>(null);
  const expDirty = useRef(true);
  /** The next redraw is a theme change: no in-canvas fade. */
  const expThemeChanged = useRef(false);
  const expNeedsDraw = useRef(false);
  const expFadeStart = useRef<number | null>(null);
  const expLastDraw = useRef(-Infinity);

  // Hero terminal: its own canvas texture, redrawn only after the feed adds text.
  const heroScreen = useRef<ReturnType<typeof createScreenTexture>>(null);
  const heroFeed = useRef<TerminalFeed>(null);
  const heroMesh = useRef<Mesh>(null);
  const heroMaterial = useRef<MeshBasicMaterial>(null);
  const heroCursor = useRef<Mesh>(null);
  const heroCursorMaterial = useRef<MeshBasicMaterial>(null);
  const heroDirty = useRef(true);
  const heroDrawn = useRef(false);
  const heroCell = useRef<CursorCell>(null);
  /** Damped pointer tilt, already weighted by the hero fade-out. */
  const tilt = useRef({ yaw: 0, pitch: 0 });
  /** Decoded screenshots by slug; a missing entry means not loaded (or failed), so text is drawn. */
  const screenshots = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => {
    let cancelled = false;
    const loaded = screenshots.current;
    SCREEN_PROJECTS.forEach((project) => {
      const src = project.screenshot?.src;
      if (!src) return;
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image
        .decode()
        .then(() => {
          if (cancelled) return;
          loaded.set(project.slug, image);
          if (activeSlug.current === project.slug) dirty.current = true;
        })
        .catch(() => {
          // Keep the text display for this project.
        });
    });
    return () => {
      cancelled = true;
      loaded.clear();
    };
  }, []);

  useEffect(() => {
    colorsRef.current = { colors, screenBg };
    dirty.current = true;
    heroDirty.current = true;
    aboutDirty.current = true;
    expDirty.current = true;
    expThemeChanged.current = true;
  }, [colors, screenBg]);

  // About texture and its feed (same pattern as the hero); typing starts the first time the
  // About display becomes the target, in useFrame. Timers pause while the tab is hidden.
  useEffect(() => {
    const material = aboutMaterial.current;
    const created = createScreenTexture();
    aboutScreen.current = created;
    aboutDrawn.current = false;
    aboutDirty.current = true;
    if (material) {
      material.map = created.texture;
      material.needsUpdate = true;
    }
    const feed = createAboutFeed(() => {
      aboutDirty.current = true;
    });
    aboutFeed.current = feed;
    const onVisibility = () => (document.hidden ? feed.pause() : feed.resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      feed.stop();
      aboutFeed.current = null;
      if (material) material.map = null;
      created.texture.dispose();
      aboutScreen.current = null;
    };
  }, []);

  // Experience texture plus an offscreen snapshot canvas for the commit crossfade.
  useEffect(() => {
    const material = expMaterial.current;
    const created = createScreenTexture();
    const prevCanvas = document.createElement("canvas");
    prevCanvas.width = SCREEN_CANVAS_W;
    prevCanvas.height = SCREEN_CANVAS_H;
    expScreen.current = created;
    expPrev.current = prevCanvas.getContext("2d");
    drawnCommit.current = null;
    expDirty.current = true;
    if (material) {
      material.map = created.texture;
      material.needsUpdate = true;
    }
    return () => {
      if (material) material.map = null;
      created.texture.dispose();
      expScreen.current = null;
      expPrev.current = null;
      // Release the snapshot's backing store.
      prevCanvas.width = 0;
      prevCanvas.height = 0;
    };
  }, []);

  useEffect(() => {
    // Subscribing also tells CommitTracker to start observing the timeline.
    const unsubscribe = subscribeActiveCommit(() => {
      activeCommit.current = getActiveCommit();
      expDirty.current = true;
    });
    activeCommit.current = getActiveCommit();
    return unsubscribe;
  }, []);

  // Hero terminal texture and its feed. Same create, attach, dispose pattern as the project
  // display; the feed's timers pause while the tab is hidden.
  useEffect(() => {
    const material = heroMaterial.current;
    const created = createScreenTexture();
    heroScreen.current = created;
    heroDrawn.current = false;
    heroDirty.current = true;
    if (material) {
      material.map = created.texture;
      material.needsUpdate = true;
    }
    const feed = createTerminalFeed(() => {
      heroDirty.current = true;
    });
    heroFeed.current = feed;
    const onVisibility = () => (document.hidden ? feed.pause() : feed.resume());
    document.addEventListener("visibilitychange", onVisibility);
    feed.start();
    if (document.hidden) feed.pause();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      feed.stop();
      heroFeed.current = null;
      if (material) material.map = null;
      created.texture.dispose();
      heroScreen.current = null;
    };
  }, []);

  useEffect(() => {
    // Subscribing also tells ProjectsTracker to start observing the cards.
    const unsubscribe = subscribeActiveProject(() => {
      activeSlug.current = getActiveProject();
      if (activeSlug.current) dirty.current = true;
    });
    activeSlug.current = getActiveProject();
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const font = `700 64px ${headingFontFamily()}`;
    Promise.all([document.fonts.ready, document.fonts.load(font).catch(() => [])]).finally(() => {
      if (cancelled) return;
      fontsReady.current = true;
      dirty.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Texture lives in a ref and is attached to the material imperatively, then disposed on unmount.
  useEffect(() => {
    const material = projectMaterial.current;
    const created = createScreenTexture();
    screen.current = created;
    drawnSlug.current = null;
    dirty.current = true;
    if (material) {
      material.map = created.texture;
      material.needsUpdate = true;
    }
    return () => {
      if (material) material.map = null;
      created.texture.dispose();
      screen.current = null;
    };
  }, []);

  useFrame((state, delta) => {
    if (!root.current || !hinge.current) return;
    smoothed.current = MathUtils.damp(smoothed.current, chapter.current, 4, delta);
    const { from, to, t } = chapterMix(smoothed.current, POSES.length);
    const a = POSES[from];
    const b = POSES[to];
    const mix = (key: keyof (typeof POSES)[number]) => MathUtils.lerp(a[key], b[key], t);

    // Narrow screens: tuck the laptop behind the text, smaller and higher.
    const narrow = state.size.width < 768;
    const time = state.clock.elapsedTime;
    const float = Math.sin(time * 0.8) * 0.06;

    // Zig-zag projects: move to the side opposite the active card (wide screens only).
    const activeIndex = activeSlug.current ? PROJECT_INDEX.get(activeSlug.current) : undefined;
    if (activeIndex !== undefined) sideTarget.current = activeIndex % 2 === 0 ? 1 : -1;
    side.current = MathUtils.damp(side.current, sideTarget.current, SIDE_LAMBDA, delta);
    const sideWeight = narrow
      ? 0
      : 1 - MathUtils.clamp(Math.abs(smoothed.current - PROJECTS_CHAPTER), 0, 1);
    let x = mix("x");
    let ry = mix("ry");
    if (sideWeight > 0) {
      const camera = state.camera as PerspectiveCamera;
      const tanHalfFov = Math.tan(MathUtils.degToRad(camera.fov) / 2);
      const sideX = Math.min(
        SIDE_X,
        maxSideX(state.size.width / state.size.height, tanHalfFov, camera.position.z),
      );
      x = MathUtils.lerp(x, side.current * sideX, sideWeight);
      ry = MathUtils.lerp(ry, -side.current * SIDE_YAW, sideWeight);
    }

    root.current.position.set(
      narrow ? x * 0.2 : x,
      mix("y") + float + (narrow ? 0.9 : 0),
      mix("z") - (narrow ? 1 : 0),
    );
    // Hero only, wide screens only: turn toward the pointer, fading out by chapter TILT_FADE.
    const tiltWeight = narrow ? 0 : 1 - MathUtils.clamp(smoothed.current / TILT_FADE, 0, 1);
    const p = pointer.current;
    tilt.current.yaw = MathUtils.damp(tilt.current.yaw, p.x * TILT_YAW * tiltWeight, TILT_LAMBDA, delta);
    tilt.current.pitch = MathUtils.damp(
      tilt.current.pitch,
      -p.y * TILT_PITCH * tiltWeight,
      TILT_LAMBDA,
      delta,
    );

    root.current.rotation.set(
      mix("rx") + tilt.current.pitch,
      ry + Math.sin(time * 0.4) * 0.04 + tilt.current.yaw,
      mix("rz"),
    );
    root.current.scale.setScalar(mix("scale") * (narrow ? 0.6 : 1));
    hinge.current.rotation.x = mix("lid");

    if (cursor.current) cursor.current.visible = Math.floor(time * 2) % 2 === 0;

    // Redraw the project texture only when something it depends on changed.
    const slug = activeSlug.current;
    const target = screen.current;
    if (dirty.current && fontsReady.current && slug && target?.ctx) {
      const project = SCREEN_PROJECTS.get(slug);
      if (project) {
        const { colors: c, screenBg: bg } = colorsRef.current;
        const image = screenshots.current.get(slug);
        if (image) drawProjectScreenshot(target.ctx, project, image, c, bg);
        else drawProjectScreen(target.ctx, project, c, bg);
        target.texture.needsUpdate = true;
        drawnSlug.current = slug;
      }
      dirty.current = false;
    }

    // Hero terminal: redraw only after the feed added a character or line (or the theme
    // changed), and only while it is (or is becoming) visible.
    const hero = heroScreen.current;
    const feed = heroFeed.current;
    const heroWanted = smoothed.current < HERO_RANGE;
    if (heroDirty.current && hero?.ctx && feed && (heroWanted || weights.current.hero > 0)) {
      const { colors: c, screenBg: bg } = colorsRef.current;
      heroCell.current = drawHeroTerminal(hero.ctx, feed.state, c, bg);
      hero.texture.needsUpdate = true;
      heroDrawn.current = true;
      heroDirty.current = false;
    }

    const w = weights.current;

    // About: throttled redraw after the feed changed, while visible or becoming visible.
    const aboutWanted = Math.abs(smoothed.current - ABOUT_CHAPTER) < ABOUT_RANGE;
    const about = aboutScreen.current;
    const aboutFeedNow = aboutFeed.current;
    if (
      aboutDirty.current &&
      about?.ctx &&
      aboutFeedNow &&
      (aboutWanted || w.about > 0) &&
      time - aboutLastDraw.current >= MIN_DRAW_INTERVAL
    ) {
      const { colors: c, screenBg: bg } = colorsRef.current;
      aboutCell.current = drawTerminalScreen(about.ctx, aboutFeedNow.state, c, bg, ABOUT_TITLE);
      about.texture.needsUpdate = true;
      aboutDrawn.current = true;
      aboutDirty.current = false;
      aboutLastDraw.current = time;
    }

    // Experience: redraw when the active commit or the theme changed; a commit change fades
    // the previous frame out over COMMIT_FADE_SECONDS (a few throttled redraws).
    const expWanted = Math.abs(smoothed.current - EXPERIENCE_CHAPTER) < EXPERIENCE_RANGE;
    const exp = expScreen.current;
    if (exp?.ctx && SCREEN_COMMITS.length > 0 && (expWanted || w.experience > 0)) {
      const requested = activeCommit.current;
      const commit =
        requested !== null && requested >= 0 && requested < SCREEN_COMMITS.length
          ? requested
          : HEAD_COMMIT;
      if (expDirty.current || commit !== drawnCommit.current) {
        const prev = expPrev.current;
        const fade =
          prev !== null &&
          drawnCommit.current !== null &&
          commit !== drawnCommit.current &&
          !expThemeChanged.current &&
          w.experience > 0;
        if (fade) {
          prev.clearRect(0, 0, SCREEN_CANVAS_W, SCREEN_CANVAS_H);
          prev.drawImage(exp.ctx.canvas, 0, 0);
          expFadeStart.current = time;
        } else {
          expFadeStart.current = null;
        }
        drawnCommit.current = commit;
        expDirty.current = false;
        expThemeChanged.current = false;
        expNeedsDraw.current = true;
      }
      const fadeStart = expFadeStart.current;
      if (
        (expNeedsDraw.current || fadeStart !== null) &&
        time - expLastDraw.current >= MIN_DRAW_INTERVAL
      ) {
        const { colors: c, screenBg: bg } = colorsRef.current;
        drawExperienceScreen(exp.ctx, SCREEN_COMMITS, commit, c, bg, currentMonth());
        const prev = expPrev.current;
        if (fadeStart !== null && prev) {
          const t = (time - fadeStart) / COMMIT_FADE_SECONDS;
          if (t < 1) {
            exp.ctx.globalAlpha = 1 - smoothstep(t);
            exp.ctx.drawImage(prev.canvas, 0, 0);
            exp.ctx.globalAlpha = 1;
          } else {
            expFadeStart.current = null;
          }
        }
        exp.texture.needsUpdate = true;
        expNeedsDraw.current = false;
        expLastDraw.current = time;
      }
    }

    // One display is the target, in priority order: project, hero, about, experience, code.
    // Every weight ramps linearly over FADE_SECONDS toward 1 (target) or 0, and smoothstep is
    // applied. smoothstep(w) + smoothstep(1 - w) = 1, so a crossfade between two displays
    // always adds up to full opacity.
    const showProject =
      Math.abs(smoothed.current - PROJECTS_CHAPTER) < PROJECT_RANGE &&
      slug !== null &&
      drawnSlug.current !== null;
    const display: Display = showProject
      ? "project"
      : heroWanted && heroDrawn.current
        ? "hero"
        : aboutWanted && aboutDrawn.current
          ? "about"
          : expWanted && drawnCommit.current !== null
            ? "experience"
            : "code";
    const step = Math.min(delta, 0.1) / FADE_SECONDS;

    // The About output types once, the first time it is the target. If it fades out before
    // it finished, it jumps to the complete output so a later visit shows no retype.
    if (aboutFeedNow) {
      if (display === "about" && !aboutFeedNow.started) {
        aboutFeedNow.start();
        if (document.hidden) aboutFeedNow.pause();
      } else if (display !== "about" && w.about === 0 && aboutFeedNow.started && !aboutFeedNow.done) {
        aboutFeedNow.finish();
      }
    }
    // The hero starts at full weight; if its canvas never drew (no 2D context), hand that
    // weight to the code lines instead of fading out a blank plane.
    if (!heroDrawn.current && w.hero > 0) {
      w.code = Math.min(1, w.code + w.hero);
      w.hero = 0;
    }
    (Object.keys(w) as Display[]).forEach((key) => {
      w[key] = MathUtils.clamp(w[key] + (key === display ? step : -step), 0, 1);
    });
    const codeF = smoothstep(w.code);
    const heroF = smoothstep(w.hero);
    const aboutF = smoothstep(w.about);
    const projectF = smoothstep(w.project);
    const expF = smoothstep(w.experience);

    if (aboutMesh.current && aboutMaterial.current) {
      aboutMesh.current.visible = aboutF > 0;
      aboutMaterial.current.opacity = aboutF;
    }
    const aboutCellNow = aboutCell.current;
    if (aboutCursor.current && aboutCursorMaterial.current && aboutCellNow) {
      // Solid while typing, blinking before and after.
      const typing = aboutFeedNow !== null && aboutFeedNow.started && !aboutFeedNow.done;
      aboutCursor.current.visible = aboutF > 0 && (typing || Math.floor(time * 2) % 2 === 0);
      placeCursor(aboutCursor.current, aboutCellNow);
      aboutCursorMaterial.current.opacity = aboutF * 0.85;
    }
    if (expMesh.current && expMaterial.current) {
      expMesh.current.visible = expF > 0;
      expMaterial.current.opacity = expF;
    }

    if (projectMesh.current && projectMaterial.current) {
      projectMesh.current.visible = projectF > 0;
      projectMaterial.current.opacity = projectF;
    }
    if (codeLines.current) codeLines.current.visible = codeF > 0;
    CODE_LINES.forEach((line, index) => {
      const material = lineMaterials.current[index];
      if (material) material.opacity = line.opacity * codeF;
    });
    if (cursorMaterial.current) cursorMaterial.current.opacity = codeF;

    if (heroMesh.current && heroMaterial.current) {
      heroMesh.current.visible = heroF > 0;
      heroMaterial.current.opacity = heroF;
    }
    const cell = heroCell.current;
    if (heroCursor.current && heroCursorMaterial.current && cell) {
      // Solid while a line is typing, blinking otherwise.
      const typing = feed !== null && feed.state.typed !== null;
      heroCursor.current.visible = heroF > 0 && (typing || Math.floor(time * 2) % 2 === 0);
      placeCursor(heroCursor.current, cell);
      heroCursorMaterial.current.opacity = heroF * 0.85;
    }
  });

  return (
    <group ref={root}>
      {/* Offset so the whole laptop rotates around its middle. */}
      <group position={[0, -0.45, 0.1]}>
        {/* Base */}
        <RoundedBox args={[2.4, 0.1, 1.6]} radius={0.04} smoothness={3} position={[0, 0.05, 0]}>
          <meshStandardMaterial color={colors.muted} metalness={0.35} roughness={0.45} />
        </RoundedBox>
        {/* Keyboard area */}
        <mesh position={[0, 0.101, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[KEYBOARD_AREA_W, KEYBOARD_AREA_D]} />
          <meshStandardMaterial color={deck} roughness={0.85} />
        </mesh>
        {/* Keycaps and legends */}
        <Keyboard
          keycap={screenBg}
          legend={colors.isDark ? colors.text : colors.background}
          accent={colors.accent}
          z={-0.2}
        />
        {/* Trackpad */}
        <mesh position={[0, 0.101, 0.47]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.42]} />
          <meshStandardMaterial color={deck} roughness={0.6} />
        </mesh>

        {/* Lid, hinged on the back edge of the base */}
        <group ref={hinge} position={[0, 0.1, -0.78]}>
          <RoundedBox args={[2.4, 1.5, 0.06]} radius={0.03} smoothness={3} position={[0, 0.75, -0.03]}>
            <meshStandardMaterial color={colors.muted} metalness={0.35} roughness={0.45} />
          </RoundedBox>
          {/* Display */}
          <mesh position={[0, 0.76, 0.002]}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial color={screenBg} />
          </mesh>
          <group ref={codeLines}>
            {/* Terminal lines (unlit, so they read as glowing). Opacity is driven in useFrame. */}
            {CODE_LINES.map((line, index) => {
              const x = -SCREEN_W / 2 + 0.16 + line.indent * 0.16 + line.width / 2;
              const y = 0.76 + SCREEN_H / 2 - 0.16 - index * LINE_GAP;
              return (
                <mesh key={index} position={[x, y, LAYER.code.z]} renderOrder={LAYER.code.order}>
                  <planeGeometry args={[line.width, LINE_H]} />
                  <meshBasicMaterial
                    ref={(material) => {
                      lineMaterials.current[index] = material;
                    }}
                    color={colors.screenAccent}
                    toneMapped={false}
                    transparent
                    opacity={line.opacity}
                  />
                </mesh>
              );
            })}
            {/* Blinking cursor */}
            <mesh
              ref={cursor}
              position={[
                -SCREEN_W / 2 + 0.2,
                0.76 + SCREEN_H / 2 - 0.16 - CODE_LINES.length * LINE_GAP,
                LAYER.code.z,
              ]}
              renderOrder={LAYER.code.order}
            >
              <planeGeometry args={[0.08, LINE_H * 1.4]} />
              <meshBasicMaterial ref={cursorMaterial} color={colors.screenAccent} toneMapped={false} transparent />
            </mesh>
          </group>
          {/* Project display: name of the project card in view, crossfaded over the code lines. */}
          <mesh
            ref={projectMesh}
            position={[0, 0.76, LAYER.project.z]}
            renderOrder={LAYER.project.order}
            visible={false}
          >
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              ref={projectMaterial}
              toneMapped={false}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
          {/* Hero terminal: API server log, shown in the hero chapter. */}
          <mesh ref={heroMesh} position={[0, 0.76, LAYER.hero.z]} renderOrder={LAYER.hero.order}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              ref={heroMaterial}
              toneMapped={false}
              transparent
              opacity={1}
              depthWrite={false}
            />
          </mesh>
          {/* About: `curl /v1/me | jq`, shown in the about chapter. */}
          <mesh
            ref={aboutMesh}
            position={[0, 0.76, LAYER.about.z]}
            renderOrder={LAYER.about.order}
            visible={false}
          >
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              ref={aboutMaterial}
              toneMapped={false}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
          {/* Experience: git log synced with the timeline, shown in the experience chapter. */}
          <mesh
            ref={expMesh}
            position={[0, 0.76, LAYER.experience.z]}
            renderOrder={LAYER.experience.order}
            visible={false}
          >
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial
              ref={expMaterial}
              toneMapped={false}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
          {/* Block cursors for the hero and About terminals; placed and scaled in useFrame. */}
          <mesh ref={heroCursor} renderOrder={LAYER.cursor.order} visible={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              ref={heroCursorMaterial}
              color={colors.screenAccent}
              toneMapped={false}
              transparent
              depthWrite={false}
            />
          </mesh>
          <mesh ref={aboutCursor} renderOrder={LAYER.cursor.order} visible={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              ref={aboutCursorMaterial}
              color={colors.screenAccent}
              toneMapped={false}
              transparent
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
