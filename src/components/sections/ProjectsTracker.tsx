"use client";

import { useEffect } from "react";
import {
  hasActiveProjectConsumers,
  setActiveProject,
  subscribeActiveProjectConsumers,
} from "@/components/three/activeProject";

/** Only the card crossing the middle 10% of the viewport counts as "in view". */
const ROOT_MARGIN = "-45% 0px -45% 0px";

type ProjectsTrackerProps = {
  /** id of the section whose `[data-project-slug]` cards are tracked. */
  sectionId: string;
};

/**
 * Reports which project card is in the middle of the viewport to the activeProject store,
 * for the 3D laptop screen. Renders nothing. Observes only while the 3D scene is subscribed.
 */
export function ProjectsTracker({ sectionId }: ProjectsTrackerProps) {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const start = () => {
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>(`#${CSS.escape(sectionId)} [data-project-slug]`),
      );
      if (cards.length === 0) return;
      const inBand = new Set<HTMLElement>();

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const card = entry.target as HTMLElement;
            if (entry.isIntersecting) inBand.add(card);
            else inBand.delete(card);
          }
          // If two cards share the band, the first in page order wins.
          const winner = cards.find((card) => inBand.has(card));
          setActiveProject(winner?.dataset.projectSlug ?? null);
        },
        { rootMargin: ROOT_MARGIN },
      );
      cards.forEach((card) => observer?.observe(card));
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      setActiveProject(null);
    };

    const sync = () => {
      const wanted = hasActiveProjectConsumers();
      if (wanted && !observer) start();
      else if (!wanted && observer) stop();
    };

    sync();
    const unsubscribe = subscribeActiveProjectConsumers(sync);
    return () => {
      unsubscribe();
      stop();
    };
  }, [sectionId]);

  return null;
}
