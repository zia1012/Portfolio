"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { markSceneReady } from "@/lib/boot";
import { Laptop } from "./Laptop";
import { Particles } from "./Particles";
import { SceneScrim } from "./SceneScrim";
import { createScrimUniforms } from "./scrimProfile";
import { useScrollChapters } from "./useScrollChapters";
import { useSmoothScroll } from "./useSmoothScroll";
import { useThemeColors } from "./useThemeColors";

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function pickParticleCount(): number {
  const narrow = window.innerWidth < 768;
  const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
  return narrow || lowCore ? 900 : 2500;
}

/** Tells the boot overlay the scene has drawn once (marked after that frame is rendered). */
function FirstFrame() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(markSceneReady);
  });
  return null;
}

/** The R3F scene. Loaded client-side only via SceneLayer (next/dynamic, ssr: false). */
export default function Scene() {
  const chapter = useRef(0);
  const [particleCount] = useState(pickParticleCount);
  const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const colors = useThemeColors();
  const [scrim] = useState(createScrimUniforms);
  /** Mouse/pen position over the window, -1..1 with y up. Touch is ignored, so it stays 0. */
  const pointer = useRef({ x: 0, y: 0 });

  useSmoothScroll();
  useScrollChapters(chapter);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = 1 - (event.clientY / window.innerHeight) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={hidden ? "never" : "always"}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className="scene-fade-in"
    >
      <FirstFrame />
      <ambientLight intensity={colors.isDark ? 0.5 : 0.8} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color={colors.accent} />
      <Particles
        chapter={chapter}
        pointer={pointer}
        count={particleCount}
        color={colors.accent}
        isDark={colors.isDark}
        scrim={scrim}
      />
      <Laptop chapter={chapter} pointer={pointer} colors={colors} />
      {/* Readability scrim inside the canvas: over the laptop, under the particles. */}
      <SceneScrim uniforms={scrim} color={colors.background} />
    </Canvas>
  );
}
