import type { ReactNode } from "react";

type TypeLineProps = {
  children: ReactNode;
  /** Milliseconds per character. */
  speed: number;
  /** Upper limit for the whole line, so long text does not drag. */
  maxMs: number;
};

/**
 * One line typed by TypeSequence. The real text (the "ghost") always stays in the
 * layout and the accessibility tree, so it reserves the line's full size from the
 * first paint. TypeSequence fills the aria-hidden layer on top of it while typing.
 */
export function TypeLine({ children, speed, maxMs }: TypeLineProps) {
  return (
    <span className="type-line" data-speed={speed} data-max-ms={maxMs}>
      <span className="type-ghost">{children}</span>
      <span className="type-typed" aria-hidden="true" />
    </span>
  );
}
