import { Copy } from "@/components/ui/Copy";
import { uiText } from "@/lib/ui-text";

/**
 * Skill chip with an optional project usage badge. The badge number is aria-hidden; the
 * sr-only suffix gives the chip the name "Node.js, used in 3 projects".
 */
export function SkillChip({ label, usage }: { label: string; usage: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-text-muted">
      <span>
        <Copy text={label} />
      </span>
      {usage > 0 ? (
        <>
          <span
            aria-hidden="true"
            className="-mr-1.5 inline-flex min-w-5 items-center justify-center rounded-full border border-accent/70 px-1.5 font-mono text-xs leading-4 font-semibold text-text tabular-nums"
          >
            {usage}
          </span>
          <span className="sr-only">{uiText.skills.usedIn(usage)}</span>
        </>
      ) : null}
    </span>
  );
}
