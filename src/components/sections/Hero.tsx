import { site } from "@/content/site";
import { Copy } from "@/components/ui/Copy";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { TypeLine } from "@/components/ui/TypeLine";
import { TypeSequence } from "@/components/ui/TypeSequence";
import { hasCopy } from "@/lib/content";
import { uiText } from "@/lib/ui-text";

/** "Mohammed Zia Mudassir" → lead "Mohammed Zia", last "Mudassir". One word → no accent line. */
function splitName(name: string): { lead: string; last: string | null } {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return { lead: name, last: null };
  return { lead: words.slice(0, -1).join(" "), last: words[words.length - 1] };
}

export function Hero() {
  const { lead, last } = splitName(site.name);

  return (
    <section
      id="top"
      aria-labelledby="top-heading"
      className="relative flex scroll-mt-20 items-center px-4 py-16 sm:px-6 md:min-h-[calc(100svh-4rem)] md:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Typing: role + location stay under ~700ms so the h1 (likely LCP) starts early. */}
        <TypeSequence className="max-w-[44rem]">
          <p className="hero-kicker font-mono text-sm text-text-muted lowercase sm:text-base">
            <span aria-hidden="true" className="text-accent">
              {"// "}
            </span>
            <TypeLine speed={35} maxMs={380}>
              <Copy text={site.role} />
            </TypeLine>
            {hasCopy(site.location) ? (
              <>
                <span aria-hidden="true" className="text-accent">
                  {" · "}
                </span>
                <span className="sr-only">, {uiText.locationLabel}: </span>
                <TypeLine speed={35} maxMs={300}>
                  <Copy text={site.location} />
                </TypeLine>
              </>
            ) : null}
          </p>
          <h1
            id="top-heading"
            className="hero-name text-halo mt-6 font-bold tracking-tight break-words"
          >
            <TypeLine speed={45} maxMs={last ? 420 : 650}>
              {lead}
            </TypeLine>
            {last ? (
              <>
                {" "}
                <span className="hero-name-accent">
                  <TypeLine speed={45} maxMs={300}>
                    {last}
                  </TypeLine>
                </span>
              </>
            ) : null}
          </h1>
          {hasCopy(site.tagline) ? (
            <p className="mt-8 max-w-[36rem] font-heading text-xl text-text sm:text-2xl">
              <TypeLine speed={30} maxMs={600}>
                <Copy text={site.tagline} />
              </TypeLine>
            </p>
          ) : null}
          {hasCopy(site.heroIntro) ? (
            <p className="mt-4 max-w-[36rem] text-lg leading-relaxed text-text-muted">
              <TypeLine speed={12} maxMs={1350}>
                <Copy text={site.heroIntro} />
              </TypeLine>
            </p>
          ) : null}
          <div className="type-reveal mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href={site.primaryCta.href}>{site.primaryCta.label}</ButtonLink>
            <a
              href={site.secondaryCta.href}
              className="group inline-flex min-h-11 items-center gap-2 font-medium text-text underline-offset-8 transition-colors duration-200 hover:text-accent hover:underline"
            >
              {site.secondaryCta.label}
              <span
                aria-hidden="true"
                className="text-accent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
              >
                →
              </span>
            </a>
          </div>
        </TypeSequence>
      </div>

      {/* Decorative cue; only where the hero fills the viewport (md+). */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-1/2 hidden w-full max-w-6xl -translate-x-1/2 items-center gap-3 px-6 font-mono text-xs text-text-muted md:flex"
      >
        <span className="scroll-cue-line" />
        <span>
          {uiText.scrollCue} <span className="text-accent">↓</span>
        </span>
      </div>
    </section>
  );
}
