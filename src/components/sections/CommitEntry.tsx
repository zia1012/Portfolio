import type { ExperienceEntry } from "@/content/types";
import { Copy } from "@/components/ui/Copy";
import { hasCopy, visibleItems } from "@/lib/content";
import { isPresent, monthsBetween, parseContentDate, type YearMonth } from "@/lib/dates";
import { shortHash } from "@/lib/shortHash";
import { uiText } from "@/lib/ui-text";
import { DateRange } from "./DateRange";

const labels = uiText.experience;

type CommitEntryProps = {
  entry: ExperienceEntry;
  /** Version number for the decorative tag badge, oldest job = 1. */
  version: number;
  /** The current month, used when the end date is "Present". */
  now: YearMonth;
  /** Position in the timeline (newest = 0); read by CommitTracker for the 3D laptop screen. */
  index: number;
};

/** One job on the git-log timeline: a node on the graph line and the commit text beside it. */
export function CommitEntry({ entry, version, now, index }: CommitEntryProps) {
  const current = isPresent(entry.end);
  const roleShown = hasCopy(entry.role);
  const bullets = visibleItems(entry.bullets);
  const start = parseContentDate(entry.start, "start");
  const end = current ? now : parseContentDate(entry.end, "end");
  const months = start && end ? monthsBetween(start, end) : null;

  return (
    <li className="git-commit" data-commit-index={index}>
      <span className="git-node" data-head={current ? "" : undefined} aria-hidden="true" />
      <div className="git-reveal">
        <p aria-hidden="true" className="flex flex-wrap items-center gap-2 font-mono text-xs leading-5">
          <span className="text-text-muted">{shortHash(entry.role + entry.start)}</span>
          {current ? (
            <span className="rounded-md bg-accent px-1.5 font-semibold text-accent-contrast">
              {labels.headRef}
            </span>
          ) : (
            <span className="rounded-md border border-border px-1.5 text-text-muted">
              {labels.tagRef(version)}
            </span>
          )}
        </p>
        <h3 className="mt-2 text-xl font-bold">
          <Copy text={roleShown ? entry.role : entry.company} />
        </h3>
        {roleShown && hasCopy(entry.company) ? (
          <p className="mt-1 font-medium text-accent">
            <span aria-hidden="true">{labels.companyPrefix} </span>
            <Copy text={entry.company} />
          </p>
        ) : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-text-muted">
          <DateRange start={entry.start} end={entry.end} />
          {months ? (
            <span className="rounded-full border border-border px-2 text-xs leading-5">
              {labels.duration(months)}
            </span>
          ) : null}
        </p>
        {bullets.length > 0 ? (
          <ul className="git-diff mt-4 space-y-2 text-text-muted">
            {bullets.map((bullet, index) => (
              // Index keys: content strings as keys would be serialised into the RSC payload.
              <li key={index}>
                <Copy text={bullet} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
