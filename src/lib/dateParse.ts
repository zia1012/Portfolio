import { publicText } from "@/lib/content";

/**
 * Pure date helpers for content strings. Kept apart from dates.ts (which imports
 * next/cache) so client code, such as the 3D laptop screen, can use them too.
 */

/** A calendar month. `month` is 0-based (0 = January). */
export type YearMonth = { year: number; month: number };

/** A parsed content date, plus a machine-readable value for `<time dateTime>`. */
export type ParsedDate = YearMonth & { iso: string };

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** True when an end date means "still going". */
export function isPresent(s: string): boolean {
  return publicText(s).toLowerCase() === "present";
}

/**
 * Parses "April 2025", "Apr 2025", "Sept. 2025" or "2025". A bare year counts as January
 * when it is a start date and December when it is an end date. Anything else returns null.
 */
export function parseContentDate(s: string, edge: "start" | "end"): ParsedDate | null {
  const text = publicText(s);
  const yearOnly = /^(\d{4})$/.exec(text);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    return { year, month: edge === "start" ? 0 : 11, iso: yearOnly[1] };
  }
  const monthYear = /^([A-Za-z]{3,})\.?\s+(\d{4})$/.exec(text);
  if (!monthYear) return null;
  const word = monthYear[1].toLowerCase();
  const month = MONTHS.findIndex((name) => name.startsWith(word));
  if (month === -1) return null;
  const year = Number(monthYear[2]);
  return { year, month, iso: `${monthYear[2]}-${String(month + 1).padStart(2, "0")}` };
}

/** Whole months from start to end, counting both months (Oct 2023 – Dec 2024 = 15). */
export function monthsBetween(start: YearMonth, end: YearMonth): number | null {
  const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;
  return months > 0 ? months : null;
}
