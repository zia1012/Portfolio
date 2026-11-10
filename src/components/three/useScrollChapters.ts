"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTER_IDS } from "./chapters";

gsap.registerPlugin(ScrollTrigger);

/**
 * Writes a fractional chapter index into `chapter.current` (0 = hero … 5 = contact).
 * Each section after the hero gets a scrubbed ScrollTrigger that runs from 0 to 1 while
 * its top edge moves from 85% to 35% of the viewport; the chapter value is the sum.
 */
export function useScrollChapters(chapter: RefObject<number>) {
  useEffect(() => {
    const segments = new Array<number>(CHAPTER_IDS.length).fill(0);
    const write = () => {
      chapter.current = segments.reduce((sum, value) => sum + value, 0);
    };

    const ctx = gsap.context(() => {
      CHAPTER_IDS.forEach((id, index) => {
        if (index === 0) return;
        const trigger = document.getElementById(id);
        if (!trigger) return;
        const update = (self: ScrollTrigger) => {
          segments[index] = self.progress;
          write();
        };
        ScrollTrigger.create({
          trigger,
          start: "top 85%",
          end: "top 35%",
          onUpdate: update,
          onRefresh: update,
        });
      });
    });

    return () => ctx.revert();
  }, [chapter]);
}
