"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { markSceneReady } from "@/lib/boot";
import { Scrim } from "./Scrim";
import { StaticBackdrop } from "./StaticBackdrop";

/** The DOM scrim stays up while the scene chunk loads; the scene then brings its own. */
const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => <Scrim /> });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglSupport = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const noopSubscribe = () => () => {};

/**
 * Fixed, full-viewport layer behind the page. Server render and reduced-motion / no-WebGL
 * users get the static gradient under the DOM scrim. Everyone else gets the 3D scene (and
 * Lenis), which draws its own scrim between the laptop and the particles (SceneScrim), so
 * the DOM scrim is left out: it would cover the particles too.
 */
export function SceneLayer() {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => false);
  const enabled = !reducedMotion && webgl;

  // No scene will ever mount: tell the boot overlay so it does not wait for the cap.
  // Checked directly (not from `enabled`) because the hydration pass uses the server snapshot.
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches || !hasWebGL()) markSceneReady();
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
      <StaticBackdrop />
      {enabled ? <Scene /> : <Scrim />}
    </div>
  );
}
