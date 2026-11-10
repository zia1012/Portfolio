import { Copy } from "./Copy";

export function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-sm text-text-muted">
      <Copy text={label} />
    </span>
  );
}
