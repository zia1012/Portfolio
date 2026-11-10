import { experience } from "@/content/experience";
import { certifications, education } from "@/content/education";
import { Section } from "@/components/ui/Section";
import { hasCopy } from "@/lib/content";
import { getCurrentMonth } from "@/lib/dates";
import { navLabel } from "@/lib/nav";
import { uiText } from "@/lib/ui-text";
import { CertificationTags } from "./CertificationTags";
import { CommitEntry } from "./CommitEntry";
import { CommitTracker } from "./CommitTracker";
import { EducationBranch } from "./EducationBranch";

const labels = uiText.experience;

/**
 * Work history as a "git log --graph": newest job first, education merged in as a side
 * branch, certifications as tags. Graph line, nodes, hashes and badges are decorative.
 * The timeline stays in the left column on lg, where the 3D laptop is on the right.
 */
export async function Experience() {
  // In production, drop entries that have neither a company nor a role yet.
  const entries = experience.filter((entry) => hasCopy(entry.company) || hasCopy(entry.role));
  const schools = education.filter((entry) => hasCopy(entry.degree) || hasCopy(entry.school));
  const certs = certifications.filter((cert) => hasCopy(cert.name));
  const now = await getCurrentMonth();
  const hasMerge = schools.length > 0;

  return (
    <Section id="experience" title={navLabel("experience")} wide>
      <div className="git-log max-w-2xl lg:max-w-[44rem]">
        <p
          aria-hidden="true"
          className="flex max-w-full flex-wrap gap-x-2 font-mono text-xs text-text-muted sm:text-sm"
        >
          <span className="text-accent">{labels.terminalPrompt}</span>
          <span>{labels.terminalCommand}</span>
        </p>

        <div className="git-graph mt-8" data-merge={hasMerge ? "" : undefined}>
          <span className="git-line" aria-hidden="true" />
          <span className="git-line-progress" aria-hidden="true" />
          <ol aria-label={labels.timelineLabel} className="grid gap-10">
            {entries.map((entry, index) => (
              // Index keys: content strings as keys would be serialised into the RSC payload.
              <CommitEntry
                key={index}
                entry={entry}
                version={entries.length - index}
                now={now}
                index={index}
              />
            ))}
          </ol>
          {hasMerge ? (
            <svg
              aria-hidden="true"
              className="git-merge"
              viewBox="0 0 26 48"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M1 0 C1 26 25 20 25 48"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}
        </div>

        {hasMerge ? <EducationBranch schools={schools} /> : null}

        {certs.length > 0 ? (
          <div className="mt-14">
            <CertificationTags certs={certs} />
          </div>
        ) : null}
      </div>
      <CommitTracker sectionId="experience" />
    </Section>
  );
}
