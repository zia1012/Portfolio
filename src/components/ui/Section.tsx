import type { ReactNode } from "react";
import { navIndex } from "@/lib/nav";

type SectionProps = {
  id: string;
  title: ReactNode;
  children: ReactNode;
  /** Full content width; otherwise the content stays in the max-w-2xl reading column. */
  wide?: boolean;
  /** Larger statement heading (contact). */
  large?: boolean;
};

/**
 * Home page section: anchor target for the nav and the scroll chapters. Open layout with
 * no box: index number (from the nav order), heading and a thin accent rule. The fixed
 * scrim in SceneLayer keeps the text readable over the 3D layer.
 */
export function Section({ id, title, children, wide = false, large = false }: SectionProps) {
  const headingId = `${id}-heading`;
  const index = navIndex(id);
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 px-4 py-16 sm:px-6 md:py-24 lg:min-h-[80svh]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline gap-4 sm:gap-5">
          {index ? (
            <span aria-hidden="true" className="shrink-0 font-mono text-2xl text-accent tabular-nums">
              {index}
            </span>
          ) : null}
          <h2
            id={headingId}
            className={`text-halo min-w-0 font-bold tracking-tight break-words ${
              large ? "text-5xl leading-none sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl"
            }`}
          >
            {title}
          </h2>
        </div>
        <span aria-hidden="true" className="section-rule mt-5" />
        <div className={wide ? "mt-10" : "mt-10 max-w-2xl"}>{children}</div>
      </div>
    </section>
  );
}
