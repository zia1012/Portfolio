"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll driven by gsap.ticker, keeping ScrollTrigger in sync. */
export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      // Smooth-scroll in-page anchor links; offset clears the sticky header (h-16).
      anchors: { offset: -72 },
    });
    lenis.on("scroll", ScrollTrigger.update);
    setLenis(lenis);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
}
