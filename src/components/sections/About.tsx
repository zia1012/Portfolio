import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { Copy } from "@/components/ui/Copy";
import { CountUp } from "@/components/ui/CountUp";
import { Section } from "@/components/ui/Section";
import { isTodo, visibleItems } from "@/lib/content";
import { navLabel } from "@/lib/nav";
import { uiText } from "@/lib/ui-text";

type Stat = { value: number; suffix: string; label: string };

/** "2+" -> { value: 2, suffix: "+" }. Returns null when there is no leading number. */
function parseLeadingNumber(s: string | undefined): { value: number; suffix: string } | null {
  const match = s?.trim().match(/^(\d+)(.*)$/);
  return match ? { value: Number(match[1]), suffix: match[2].trim() } : null;
}

function buildStats(): Stat[] {
  const stats: Stat[] = [];
  const years = parseLeadingNumber(site.yearsExperience);
  if (years && years.value > 0) {
    stats.push({ ...years, label: uiText.about.yearsLabel(years.value) });
  }
  if (projects.length > 0) {
    stats.push({ value: projects.length, suffix: "", label: uiText.about.projectsLabel(projects.length) });
  }
  const live = projects.filter((p) => p.links.live && !isTodo(p.links.live)).length;
  if (live > 0) {
    stats.push({ value: live, suffix: "", label: uiText.about.liveSitesLabel(live) });
  }
  return stats;
}

export function About() {
  const stats = buildStats();
  return (
    <Section id="about" title={navLabel("about")}>
      <div className="max-w-prose space-y-5 text-lg leading-relaxed text-text-muted">
        {visibleItems(site.about).map((paragraph, index) => (
          // Index keys: content strings as keys would be serialised into the RSC payload.
          <p
            key={index}
            className={
              index === 0 ? "font-heading text-2xl leading-snug text-text sm:text-3xl" : undefined
            }
          >
            <Copy text={paragraph} />
          </p>
        ))}
      </div>
      {stats.length > 0 && (
        <dl className="mt-12 grid max-w-3xl grid-cols-3 gap-4 sm:gap-8">
          {stats.map((stat, index) => (
            // dt must come before dd in HTML; flex-col-reverse shows the number first.
            <div key={index} className="flex min-w-0 flex-col-reverse justify-end border-t border-border pt-4">
              <dt className="font-mono text-xs leading-snug text-text-muted sm:text-sm">{stat.label}</dt>
              <dd className="font-heading text-[clamp(1.75rem,9vw,2.5rem)] leading-none text-accent sm:text-[clamp(2.5rem,6vw,4rem)]">
                <CountUp to={stat.value} suffix={stat.suffix} delayMs={index * 120} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}
