import { projects } from "@/content/projects";
import { getActiveProject, subscribeActiveProject } from "./activeProject";

const PROJECT_INDEX = new Map(projects.map((project, index) => [project.slug, index]));
/** Same middle band as ProjectsTracker: the projects section counts while it crosses it. */
const BAND = "-45% 0px -45% 0px";

/**
 * Which side the readability scrim covers (md+). On the projects zig-zag it mirrors to the
 * right while an odd (right-hand) entry is active, and keeps that side between entries; it
 * returns to the left once the section leaves the middle of the viewport.
 * Calls `onChange(right)` now and after every change; returns the cleanup.
 * Used by the DOM scrim (static fallback) and the in-scene scrim (3D on).
 */
export function watchScrimSide(onChange: (right: boolean) => void): () => void {
  let side: "left" | "right" = "left";
  let inProjects = false;

  const apply = () => onChange(inProjects && side === "right");

  const onActive = () => {
    const slug = getActiveProject();
    const index = slug ? PROJECT_INDEX.get(slug) : undefined;
    if (index !== undefined) side = index % 2 === 1 ? "right" : "left";
    apply();
  };

  const unsubscribe = subscribeActiveProject(onActive);
  const section = document.getElementById("projects");
  const observer =
    section && "IntersectionObserver" in window
      ? new IntersectionObserver(
          ([entry]) => {
            inProjects = entry.isIntersecting;
            if (!inProjects) side = "left";
            apply();
          },
          { rootMargin: BAND },
        )
      : null;
  if (section) observer?.observe(section);
  onActive();

  return () => {
    unsubscribe();
    observer?.disconnect();
  };
}
