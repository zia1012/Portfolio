import Link from "next/link";
import { projects } from "@/content/projects";
import { Copy } from "@/components/ui/Copy";
import { Section } from "@/components/ui/Section";
import { hasCopy, visibleItems } from "@/lib/content";
import { navLabel } from "@/lib/nav";
import { ProjectsTracker } from "./ProjectsTracker";

export function Projects() {
  return (
    <Section id="projects" title={navLabel("projects")} wide>
      {/* Phones: one column. md+: zig-zag, even entries left and odd entries right; the 3D
          laptop fills the empty side (see Laptop.tsx) and the scrim follows the text (Scrim.tsx).
          DOM order is unchanged. */}
      <ul className="grid max-w-2xl gap-14 md:block md:max-w-none md:space-y-24">
        {projects.map((project, index) => {
          const tags = visibleItems(project.tags);
          return (
            <li
              key={project.slug}
              data-project-slug={project.slug}
              className={`md:w-[52%] ${index % 2 === 1 ? "md:ml-auto" : ""}`.trim()}
            >
              <div className="group relative border-t border-border pt-6 transition-colors duration-200 hover:border-accent">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {/* The ::after overlay makes the whole entry clickable with a single link;
                        the focus ring is drawn on the overlay so it wraps the entry. */}
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-baseline gap-3 transition-colors duration-200 group-hover:text-accent after:absolute after:-inset-x-3 after:-top-px after:-bottom-3 after:rounded-sm focus-visible:outline-hidden focus-visible:after:outline-3 focus-visible:after:outline-accent focus-visible:after:outline-offset-2"
                    >
                      <span>{project.title}</span>
                      <span
                        aria-hidden="true"
                        className="text-accent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1.5 motion-safe:group-focus-within:translate-x-1.5"
                      >
                        →
                      </span>
                    </Link>
                  </h3>
                </div>
                {hasCopy(project.summary) ? (
                  <p className="mt-3 text-text-muted">
                    <Copy text={project.summary} />
                  </p>
                ) : null}
                {tags.length > 0 ? (
                  <ul className="dot-list mt-4 flex flex-wrap font-mono text-sm text-text-muted">
                    {tags.map((tag, tagIndex) => (
                      <li key={tagIndex}>
                        <Copy text={tag} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <ProjectsTracker sectionId="projects" />
    </Section>
  );
}
