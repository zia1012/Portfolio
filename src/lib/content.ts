/**
 * Helpers for content strings that still contain "TODO" placeholders.
 *
 * Development: TODO text is shown with a dashed accent outline so it is easy to spot.
 * Production: TODO text is hidden, and list items that are entirely TODO are dropped.
 */

export const showTodos = process.env.NODE_ENV !== "production";

/** True when the whole string is a placeholder. */
export function isTodo(s: string): boolean {
  return s.trimStart().startsWith("TODO");
}

/** Splits "Real text. TODO: missing bit" into the real part and the placeholder part. */
export function splitTodo(s: string): { text: string; todo: string | null } {
  const index = s.indexOf("TODO");
  if (index === -1) return { text: s, todo: null };
  return { text: s.slice(0, index).trim(), todo: s.slice(index).trim() };
}

/** The part of a string that is safe to publish (everything before any TODO). */
export function publicText(s: string): string {
  return splitTodo(s).text;
}

/** Whether a field has anything to render in the current environment. */
export function hasCopy(s: string | undefined): s is string {
  if (!s) return false;
  return showTodos || publicText(s).length > 0;
}

/** Drops list items that would render empty in the current environment. */
export function visibleItems(items: string[]): string[] {
  return items.filter((item) => hasCopy(item));
}
