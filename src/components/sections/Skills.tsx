import { skills } from "@/content/skills";
import { projects } from "@/content/projects";
import { Section } from "@/components/ui/Section";
import { hasCopy, publicText, visibleItems } from "@/lib/content";
import { navLabel } from "@/lib/nav";
import { normaliseSkill, projectUsage, uniqueSkills } from "@/lib/skill-usage";
import { SkillsExplorer, type ExplorerGroup, type GlobeWord } from "./SkillsExplorer";

/** Tab selected on load (exact group name in src/content/skills.ts); falls back to the first. */
const DEFAULT_GROUP = "Backend";
/** Most words the globe shows. */
const MAX_WORDS = 40;

// Without JavaScript the tabs do nothing: hide them and the pause button, and stack every panel.
const noScriptCss =
  ".skills-tablist,.skill-globe-pause{display:none!important}" +
  ".skills-panel[hidden]{display:block!important}" +
  ".skills-panel+.skills-panel{margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border)}";

/** Short globe label: TODO part and parentheses removed. "AWS (EC2, S3, RDS)" → "AWS". */
function globeLabel(item: string): string {
  return publicText(item)
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
}

export function Skills() {
  const visibleGroups = skills
    .map((group) => ({ ...group, items: visibleItems(group.items) }))
    .filter((group) => hasCopy(group.group) && group.items.length > 0);

  const allItems = visibleGroups.flatMap((group) => group.items);
  // Computed at build time: how many projects list each skill as a tag.
  const usage = projectUsage(allItems, projects);

  const groups: ExplorerGroup[] = visibleGroups.map((group) => ({
    name: group.group,
    items: group.items.map((item) => ({ label: item, usage: usage.get(item) ?? 0 })),
  }));

  // One word per unique skill; an item listed in two groups (Docker) belongs to both.
  const groupKeys = visibleGroups.map(
    (group) => new Set(group.items.map((item) => normaliseSkill(item) || item)),
  );
  const words: GlobeWord[] = uniqueSkills(allItems)
    .map((item) => {
      const key = normaliseSkill(item) || item;
      return {
        label: globeLabel(item),
        groups: groupKeys.flatMap((keys, index) => (keys.has(key) ? [index] : [])),
      };
    })
    .filter((word) => word.label.length > 0)
    .slice(0, MAX_WORDS);

  const defaultIndex = Math.max(
    0,
    groups.findIndex((group) => group.name === DEFAULT_GROUP),
  );

  return (
    <Section id="skills" title={navLabel("skills")} wide>
      <noscript>
        <style>{noScriptCss}</style>
      </noscript>
      <SkillsExplorer groups={groups} words={words} defaultIndex={defaultIndex} />
    </Section>
  );
}
