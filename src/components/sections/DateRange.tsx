import { Copy } from "@/components/ui/Copy";
import { hasCopy } from "@/lib/content";
import { parseContentDate } from "@/lib/dates";
import { uiText } from "@/lib/ui-text";

function renderDate(text: string, edge: "start" | "end") {
  const parsed = parseContentDate(text, edge);
  return parsed ? (
    <time dateTime={parsed.iso}>
      <Copy text={text} />
    </time>
  ) : (
    <span>
      <Copy text={text} />
    </span>
  );
}

/** "April 2025 → Present". The arrow is decorative; screen readers hear "to". */
export function DateRange({ start, end }: { start: string; end: string }) {
  const showStart = hasCopy(start);
  const showEnd = hasCopy(end);
  if (!showStart && !showEnd) return null;
  return (
    <span>
      {showStart ? renderDate(start, "start") : null}
      {showStart && showEnd ? (
        <>
          <span aria-hidden="true"> → </span>
          <span className="sr-only"> {uiText.experience.rangeTo} </span>
        </>
      ) : null}
      {showEnd ? renderDate(end, "end") : null}
    </span>
  );
}
