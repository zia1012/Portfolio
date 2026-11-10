"use client";

import { useEffect } from "react";
import {
  hasActiveCommitConsumers,
  setActiveCommit,
  subscribeActiveCommitConsumers,
} from "@/components/three/activeCommit";

/** Same middle band as ProjectsTracker: only the commit crossing the middle 10% counts. */
const ROOT_MARGIN = "-45% 0px -45% 0px";

type CommitTrackerProps = {
  /** id of the section whose `[data-commit-index]` entries are tracked. */
  sectionId: string;
};

/**
 * Reports which timeline commit is in the middle of the viewport to the activeCommit store,
 * for the 3D laptop screen. Renders nothing. Observes only while the 3D scene is subscribed.
 */
export function CommitTracker({ sectionId }: CommitTrackerProps) {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const start = () => {
      const commits = Array.from(
        document.querySelectorAll<HTMLElement>(`#${CSS.escape(sectionId)} [data-commit-index]`),
      );
      if (commits.length === 0) return;
      const inBand = new Set<HTMLElement>();

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const commit = entry.target as HTMLElement;
            if (entry.isIntersecting) inBand.add(commit);
            else inBand.delete(commit);
          }
          // If two commits share the band, the first in page order wins.
          const winner = commits.find((commit) => inBand.has(commit));
          const index = winner ? Number(winner.dataset.commitIndex) : NaN;
          setActiveCommit(Number.isInteger(index) ? index : null);
        },
        { rootMargin: ROOT_MARGIN },
      );
      commits.forEach((commit) => observer?.observe(commit));
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      setActiveCommit(null);
    };

    const sync = () => {
      const wanted = hasActiveCommitConsumers();
      if (wanted && !observer) start();
      else if (!wanted && observer) stop();
    };

    sync();
    const unsubscribe = subscribeActiveCommitConsumers(sync);
    return () => {
      unsubscribe();
      stop();
    };
  }, [sectionId]);

  return null;
}
