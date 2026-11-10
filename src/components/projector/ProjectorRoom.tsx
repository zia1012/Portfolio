import type { ReactNode } from "react";

// Without JavaScript the slide controls do nothing, so every slide is shown stacked instead,
// and the one-viewport lock from globals.css is undone so the page can scroll to all of them.
const noScriptCss =
  "body:has(.projector-room){height:auto!important;overflow:visible!important}" +
  "body:has(.projector-room)>footer{display:block!important}" +
  ".projector-screen{max-height:none!important}" +
  // Inline-size only: a size container would not grow with the stacked slides.
  ".deck-viewport{grid-template-rows:none!important;container-type:inline-size!important}" +
  ".deck-slide{visibility:visible!important;grid-area:auto!important}" +
  ".deck-slide+.deck-slide{border-top:1px solid var(--border)}" +
  // Only the slide nav is hidden; the back link in the control bar stays.
  ".deck-nav{display:none!important}";

/**
 * Dark room around the project slides: the page's <main>, always in the dark scope,
 * with a CSS projector hanging at the top centre. The beam and screen are in ProjectorScreen.
 * It fills the height left under the header (see "Projector" in globals.css).
 */
export function ProjectorRoom({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="dark projector-room relative flex-1 px-4 text-text sm:px-6"
    >
      <noscript>
        <style>{noScriptCss}</style>
      </noscript>
      <div className="projector-stage mx-auto w-full max-w-5xl">
        <div aria-hidden="true" className="projector">
          <div className="projector-body">
            <span className="projector-lens" />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
