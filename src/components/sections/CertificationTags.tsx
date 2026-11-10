import type { Certification } from "@/content/types";
import { Copy } from "@/components/ui/Copy";
import { hasCopy } from "@/lib/content";
import { uiText } from "@/lib/ui-text";

/** Certifications as a row of git-tag style pills. */
export function CertificationTags({ certs }: { certs: Certification[] }) {
  return (
    <div className="git-reveal">
      <h3 className="text-xl font-bold">{uiText.experience.certifications}</h3>
      <ul className="mt-4 flex flex-wrap gap-2">
        {certs.map((cert, index) => (
          // Index keys: content strings as keys would be serialised into the RSC payload.
          <li
            key={index}
            className="inline-flex max-w-full items-start gap-2 rounded-md border border-accent/40 bg-surface/80 px-3 py-1.5 text-sm"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="mt-0.5 size-3.5 shrink-0 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="M2 2h5.17a1 1 0 0 1 .7.29l6 6a1 1 0 0 1 0 1.42l-4.16 4.16a1 1 0 0 1-1.42 0l-6-6A1 1 0 0 1 2 7.17Z" />
              <circle cx="5" cy="5.25" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <span className="font-medium">
                <Copy text={cert.name} />
              </span>
              {hasCopy(cert.issuer) ? (
                <span className="text-text-muted">
                  <span className="sr-only">, </span>
                  <Copy text={cert.issuer} />
                </span>
              ) : null}
              {hasCopy(cert.date) ? (
                <span className="font-mono text-xs text-text-muted">
                  <span className="sr-only">, </span>
                  <Copy text={cert.date} />
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
