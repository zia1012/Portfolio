import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import type { Project } from "@/content/types";
import { buttonClasses } from "@/components/ui/buttonStyles";
import { Copy } from "@/components/ui/Copy";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Tag } from "@/components/ui/Tag";
import { ProjectorRoom } from "@/components/projector/ProjectorRoom";
import { SlideDeck, type Slide } from "@/components/projector/SlideDeck";
import { hasCopy, publicText, visibleItems } from "@/lib/content";
import { screenshotSrc } from "@/lib/screenshots";
import { getSiteUrl } from "@/lib/seo";
import { uiText } from "@/lib/ui-text";

// Every slug comes from generateStaticParams and is fully prerendered, so opt this segment
// out of the dev-only instant-navigation (App Shell) validation instead of adding Suspense.
export const instant = false;

const labels = uiText.project;

function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return {};

  // Never publish TODO text in metadata; fall back to the site description if nothing is left.
  const description = publicText(project.summary) || site.seo.description;
  const path = `/projects/${project.slug}`;
  const hasUrl = getSiteUrl() !== null;

  return {
    title: project.title,
    description,
    openGraph: {
      type: "article",
      title: `${project.title} – ${site.name}`,
      description,
      ...(hasUrl ? { url: path } : {}),
    },
    twitter: { card: "summary_large_image", title: `${project.title} – ${site.name}`, description },
    ...(hasUrl ? { alternates: { canonical: path } } : {}),
  };
}

/** Heading and body of a content slide (everything after the overview). */
/** Heading and body of a content slide (everything after the overview).
 *  Type and spacing scale with the screen (see "Slide type scale" in globals.css). */
function SlideSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <>
      <h2 className="slide-heading">{heading}</h2>
      <span aria-hidden="true" className="slide-rule" />
      <div className="slide-content">{children}</div>
    </>
  );
}

/** "https://www.acadlynk.com/" → "acadlynk.com" (visible label of the overview link). */
function displayHost(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/** aria-label replaces ExternalLink's hidden "(opens in new tab)" text, so repeat it here. */
function withNewTab(label: string): string {
  return `${label} ${uiText.newTab}`;
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();

  const tags = visibleItems(project.tags);
  const approach = visibleItems(project.approach);
  const screenshot = screenshotSrc(project.slug);
  const showLinks = Boolean(project.links.live || project.links.source);

  const slides: Slide[] = [
    {
      name: labels.overview,
      content: (
        <div className={screenshot ? "slide-overview" : "slide-overview slide-overview-solo"}>
          <div>
            <h1 className="slide-title">{project.title}</h1>
            {hasCopy(project.summary) ? (
              <p className="slide-summary slide-gap">
                <Copy text={project.summary} />
              </p>
            ) : null}
            {tags.length > 0 ? (
              <ul aria-label={labels.tags} className="slide-gap flex flex-wrap gap-x-2 gap-y-1.5">
                {/* Index keys: content strings as keys would be serialised into the RSC payload. */}
                {tags.map((tag, index) => (
                  <li key={index}>
                    <Tag label={tag} />
                  </li>
                ))}
              </ul>
            ) : null}
            {showLinks ? (
              <ul aria-label={labels.quickLinks} className="slide-gap flex flex-wrap gap-2">
                {project.links.live ? (
                  <li className="max-w-full">
                    <ExternalLink
                      href={project.links.live}
                      aria-label={withNewTab(labels.live(project.title))}
                      className={buttonClasses("primary", "slide-cta")}
                    >
                      {displayHost(project.links.live)}
                      <span aria-hidden="true">↗</span>
                    </ExternalLink>
                  </li>
                ) : null}
                {project.links.source ? (
                  <li className="max-w-full">
                    <ExternalLink
                      href={project.links.source}
                      aria-label={withNewTab(labels.source(project.title))}
                      className={buttonClasses(
                        project.links.live ? "secondary" : "primary",
                        "slide-cta",
                      )}
                    >
                      {labels.sourceShort}
                      <span aria-hidden="true">↗</span>
                    </ExternalLink>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          {/* Screenshot slot: discovered in public/projects/ (see next.config.ts). Slugs
              without a file render nothing and the text column goes single-column. */}
          {screenshot ? (
            <Image
              src={screenshot}
              alt={project.imageAlt}
              width={1200}
              height={580}
              loading="eager"
              sizes="(min-width: 1024px) 420px, (min-width: 640px) 42vw, calc(100vw - 66px)"
              className="slide-media rounded-lg border border-border"
            />
          ) : null}
        </div>
      ),
    },
  ];

  if (hasCopy(project.role)) {
    slides.push({
      name: labels.role,
      content: (
        <SlideSection heading={labels.role}>
          <p className="slide-statement">
            <Copy text={project.role} />
          </p>
        </SlideSection>
      ),
    });
  }

  if (hasCopy(project.problem)) {
    slides.push({
      name: labels.problem,
      content: (
        <SlideSection heading={labels.problem}>
          <p className="slide-statement">
            <Copy text={project.problem} />
          </p>
        </SlideSection>
      ),
    });
  }

  if (approach.length > 0) {
    slides.push({
      name: labels.approach,
      content: (
        <SlideSection heading={labels.approach}>
          {/* Two CSS columns on a wide screen once there are 3+ bullets. */}
          <ul className={approach.length >= 3 ? "slide-list slide-list-split" : "slide-list"}>
            {approach.map((item, index) => (
              <li key={index}>
                <Copy text={item} />
              </li>
            ))}
          </ul>
        </SlideSection>
      ),
    });
  }

  if (hasCopy(project.outcome)) {
    slides.push({
      name: labels.outcome,
      content: (
        <SlideSection heading={labels.outcome}>
          <p className="slide-statement">
            <Copy text={project.outcome} />
          </p>
        </SlideSection>
      ),
    });
  }

  return (
    <ProjectorRoom>
      <SlideDeck
        title={project.title}
        slides={slides}
        backLink={
          <Link
            href="/#projects"
            className="inline-flex h-9 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-accent underline-offset-4 hover:underline"
          >
            <span aria-hidden="true">←</span> {labels.back}
          </Link>
        }
      />
    </ProjectorRoom>
  );
}
