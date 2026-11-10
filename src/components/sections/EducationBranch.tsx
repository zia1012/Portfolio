import type { EducationEntry } from "@/content/types";
import { Copy } from "@/components/ui/Copy";
import { hasCopy } from "@/lib/content";
import { shortHash } from "@/lib/shortHash";
import { uiText } from "@/lib/ui-text";
import { DateRange } from "./DateRange";

const labels = uiText.experience;

/**
 * Education as a side branch merged into the main line. The curved connector is drawn by
 * Experience (it has to sit inside the graph); this renders the branch's nodes and cards.
 */
export function EducationBranch({ schools }: { schools: EducationEntry[] }) {
  return (
    <div>
      <h3 className="sr-only">{labels.education}</h3>
      <ol className="grid gap-10">
        {schools.map((entry, index) => {
          const place = [entry.school, entry.location].filter((part) => hasCopy(part)).join(", ");
          return (
            // Index keys: content strings as keys would be serialised into the RSC payload.
            <li key={index} className="git-branch-item">
              <span className="git-node git-node-branch" aria-hidden="true" />
              <div className="git-reveal">
                <p aria-hidden="true" className="flex flex-wrap items-center gap-2 font-mono text-xs leading-5">
                  <span className="text-text-muted">{shortHash(entry.degree + entry.start)}</span>
                  <span className="rounded-md border border-accent/50 px-1.5 text-accent">
                    {labels.mergeRef}
                  </span>
                </p>
                <h4 className="mt-2 text-xl font-bold">
                  <Copy text={entry.degree} />
                </h4>
                {place ? (
                  <p className="mt-1 font-medium text-accent">
                    <Copy text={place} />
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-sm text-text-muted">
                  <DateRange start={entry.start} end={entry.end} />
                </p>
                {hasCopy(entry.detail) ? (
                  <p className="mt-3 text-text-muted">
                    <Copy text={entry.detail} />
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
