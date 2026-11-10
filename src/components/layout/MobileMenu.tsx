"use client";

import { useEffect, useRef, useState } from "react";
import { uiText } from "@/lib/ui-text";
import { HomeLink } from "./HomeLink";

type MobileMenuProps = {
  links: { label: string; href: string }[];
  /** Label of the first item, a link to the top of the home page. */
  homeLabel: string;
};

const linkClass = "flex min-h-12 items-center rounded-md px-2 text-lg text-text hover:text-accent";

export function MobileMenu({ links, homeLabel }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = "mobile-menu";

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? uiText.menuClose : uiText.menuOpen}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-full text-text hover:bg-surface hover:text-accent"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label={uiText.mainNavLabel}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-background px-4 pb-4 shadow-lg"
      >
        <ul className="flex flex-col">
          <li>
            <HomeLink className={linkClass} onNavigate={() => setOpen(false)}>
              {homeLabel}
            </HomeLink>
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)} className={linkClass}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
