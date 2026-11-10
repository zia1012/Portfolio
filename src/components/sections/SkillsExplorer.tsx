"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Copy } from "@/components/ui/Copy";
import { uiText } from "@/lib/ui-text";
import { SkillChip } from "./SkillChip";
import { SkillGlobe } from "./SkillGlobe";
import { SkillIcon } from "./SkillIcon";

export type ExplorerGroup = {
  name: string;
  items: { label: string; usage: number }[];
};

export type GlobeWord = {
  label: string;
  /** Indexes into the groups list; the first one is selected when the word is clicked. */
  groups: number[];
};

type SkillsExplorerProps = {
  groups: ExplorerGroup[];
  words: GlobeWord[];
  defaultIndex: number;
};

const t = uiText.skills;
const WIDE = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeWide(callback: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const tabId = (index: number) => `skills-tab-${index}`;
const panelId = (index: number) => `skills-panel-${index}`;

/**
 * Skill category tabs plus the decorative globe, sharing the active group. Every panel is
 * server-rendered (inactive ones `hidden`); with JS off, Skills.tsx stacks them all.
 */
export function SkillsExplorer({ groups, words, defaultIndex }: SkillsExplorerProps) {
  const [active, setActive] = useState(defaultIndex);
  const vertical = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Phones: keep the active pill visible in the scrolling row (e.g. after a globe click).
  useEffect(() => {
    const list = listRef.current;
    const tab = tabRefs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left >= list.scrollLeft && right <= list.scrollLeft + list.clientWidth) return;
    list.scrollTo({
      left: left - (list.clientWidth - tab.offsetWidth) / 2,
      behavior: window.matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth",
    });
  }, [active]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const last = groups.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = active === last ? 0 : active + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = active === 0 ? last : active - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    // Automatic activation: focusing a tab selects it (see onFocus).
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center lg:gap-10">
      {/* First in the DOM so it sits above the tabs on phones; right-hand column on md+. */}
      <div className="md:order-last">
        <SkillGlobe words={words} activeGroup={active} onSelectGroup={setActive} />
      </div>

      <div>
        <div
          ref={listRef}
          role="tablist"
          aria-label={t.tablistLabel}
          aria-orientation={vertical ? "vertical" : "horizontal"}
          onKeyDown={handleKeyDown}
          className="skills-tablist relative -m-1.5 flex overflow-x-auto p-1.5 [scrollbar-width:thin] md:flex-col md:overflow-visible"
        >
          {/* Index keys: content strings as keys would be serialised into the RSC payload. */}
          {groups.map((group, index) => {
            const selected = index === active;
            return (
              <button
                key={index}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={tabId(index)}
                aria-selected={selected}
                aria-controls={panelId(index)}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onFocus={() => setActive(index)}
                className="group relative flex h-11 shrink-0 items-center gap-3 border-b border-border px-3 text-left text-sm text-text-muted transition-colors before:absolute before:inset-x-0 before:-bottom-px before:h-0.5 before:bg-accent before:opacity-0 before:transition-opacity hover:text-text aria-selected:font-semibold aria-selected:text-text aria-selected:before:opacity-100 md:w-full md:border-b-0 md:border-l md:pl-4 md:before:inset-x-auto md:before:inset-y-0 md:before:-left-px md:before:h-auto md:before:w-0.5"
              >
                <SkillIcon group={group.name} />
                <span className="whitespace-nowrap">
                  <Copy text={group.name} />
                </span>
                <span
                  aria-hidden="true"
                  className="ml-auto min-w-6 text-right font-mono text-xs tabular-nums group-aria-selected:text-text"
                >
                  {group.items.length}
                </span>
                <span className="sr-only">{t.tabCount(group.items.length)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {groups.map((group, index) => (
            <div
              key={index}
              role="tabpanel"
              id={panelId(index)}
              aria-labelledby={tabId(index)}
              hidden={index !== active}
              tabIndex={0}
              className="skills-panel rounded-lg"
            >
              <div className="flex items-center gap-3">
                <SkillIcon group={group.name} />
                <h3 className="text-lg font-bold">
                  <Copy text={group.name} />
                </h3>
              </div>
              <p className="mt-1 text-sm text-text-muted">{t.count(group.items.length)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <SkillChip label={item.label} usage={item.usage} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
