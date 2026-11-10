"use client";

import { useEffect, useRef } from "react";
import { watchScrimSide } from "./scrimSide";

/**
 * DOM readability layer over the static backdrop (styles in globals.css). Only rendered when
 * the 3D scene is off (reduced motion, no WebGL); with the scene on, SceneScrim draws the same
 * gradient inside the canvas so the particles can sit on top of it.
 * md+: a gradient on the text side, mirrored on the projects zig-zag (see scrimSide.ts).
 * Written straight to the DOM.
 */
export function Scrim() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return watchScrimSide((right) => {
      if (right) element.dataset.side = "right";
      else delete element.dataset.side;
    });
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="scrim">
      <div className="scrim-layer scrim-left" />
      <div className="scrim-layer scrim-right" />
    </div>
  );
}
