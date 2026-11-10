import type { ReactNode } from "react";

/**
 * Pull-down projection screen: roller bar, cream surface (light tokens in both themes),
 * and a weight bar with a pull tab. The light beam from the projector lands on it.
 * Purely presentational; the slides are passed in as children.
 */
export function ProjectorScreen({ children }: { children: ReactNode }) {
  return (
    <div className="projector-screen">
      <div aria-hidden="true" className="projector-beam">
        <div className="projector-dust">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <div aria-hidden="true" className="projector-roller" />
      <div className="projector-unroll">
        <div className="projector-surface">{children}</div>
        <div aria-hidden="true" className="projector-weight-track">
          <div className="projector-weight" />
        </div>
      </div>
    </div>
  );
}
