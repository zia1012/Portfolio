import { cacheLife } from "next/cache";
import { site } from "@/content/site";
import { uiText } from "@/lib/ui-text";
import { ExternalLink } from "@/components/ui/ExternalLink";

// Cache Components treats the current time as runtime data; caching it keeps the footer static.
async function getYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await getYear();

  return (
    <footer className="relative z-10 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {site.name}
        </p>
        <nav aria-label={uiText.socialNavLabel}>
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:text-accent hover:underline"
              >
                {site.email}
              </a>
            </li>
            {site.socials.map((social) => (
              <li key={social.href}>
                <ExternalLink
                  href={social.href}
                  className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:text-accent hover:underline"
                >
                  {social.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
