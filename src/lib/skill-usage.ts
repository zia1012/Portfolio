import { publicText } from "./content";

/**
 * Loose skill name for matching: TODO parts and anything in parentheses removed,
 * lower case, whitespace collapsed. "AWS (EC2, S3, RDS)" → "aws".
 */
export function normaliseSkill(name: string): string {
  return publicText(name)
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Counts, per skill item, how many projects list a matching tag. Runs on the server. */
export function projectUsage(items: string[], projects: { tags: string[] }[]): Map<string, number> {
  const tagSets = projects.map(
    (project) => new Set(project.tags.map(normaliseSkill).filter((tag) => tag.length > 0)),
  );
  const usage = new Map<string, number>();
  for (const item of items) {
    const key = normaliseSkill(item);
    if (!key || usage.has(item)) continue;
    usage.set(
      item,
      tagSets.reduce((count, tags) => count + (tags.has(key) ? 1 : 0), 0),
    );
  }
  return usage;
}

/** Drops repeats ("Docker" in two groups), keeping the first spelling. */
export function uniqueSkills(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normaliseSkill(item) || item;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
