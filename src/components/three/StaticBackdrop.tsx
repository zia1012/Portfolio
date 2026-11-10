/** Static CSS decoration: the base layer, and the whole background when 3D is off. */
export function StaticBackdrop() {
  return <div aria-hidden="true" className="scene-fallback absolute inset-0" />;
}
