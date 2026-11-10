import { site } from "@/content/site";
import { uiText } from "@/lib/ui-text";
import { HomeLink } from "./HomeLink";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

/** Nav anchors point at home-page sections, so prefix them with "/" to work from any page. */
const links = site.nav.map((item) => ({
  label: item.label,
  href: item.href.startsWith("#") ? `/${item.href}` : item.href,
}));

const navLinkClass =
  "inline-flex min-h-11 items-center rounded-full px-3 text-text-muted hover:text-accent";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <HomeLink className="inline-flex min-h-11 items-center font-heading text-lg font-bold tracking-tight text-text hover:text-accent">
          {site.name}
        </HomeLink>

        <div className="flex items-center gap-1">
          <nav aria-label={uiText.mainNavLabel} className="hidden md:block">
            <ul className="flex items-center gap-1">
              <li>
                <HomeLink className={navLinkClass}>{uiText.home}</HomeLink>
              </li>
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={navLinkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
          <MobileMenu links={links} homeLabel={uiText.home} />
        </div>
      </div>
    </header>
  );
}
