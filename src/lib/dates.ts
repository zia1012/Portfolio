import { cacheLife } from "next/cache";
import type { YearMonth } from "@/lib/dateParse";

// The pure helpers live in dateParse.ts so client code can import them without next/cache.
export {
  isPresent,
  monthsBetween,
  parseContentDate,
  type ParsedDate,
  type YearMonth,
} from "@/lib/dateParse";

/**
 * The current month. Cache Components treats the current time as runtime data, so it is
 * read inside a cached function (same approach as the footer year) and refreshed daily.
 * UTC, so the server's time zone does not change the result.
 */
export async function getCurrentMonth(): Promise<YearMonth> {
  "use cache";
  cacheLife("days");
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}
