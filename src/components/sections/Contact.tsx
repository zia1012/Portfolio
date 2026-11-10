import { site } from "@/content/site";
import { Copy } from "@/components/ui/Copy";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Section } from "@/components/ui/Section";
import { hasCopy } from "@/lib/content";
import { uiText } from "@/lib/ui-text";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <Section id="contact" title={<Copy text={site.contactHeading} />} large>
      {hasCopy(site.contactIntro) ? (
        <p className="max-w-prose text-lg leading-relaxed text-text-muted">
          <Copy text={site.contactIntro} />
        </p>
      ) : null}

      {/* 24px+ bold, so the accent link is large text (3:1) in both themes. */}
      <p className="mt-8">
        <a
          href={`mailto:${site.email}`}
          className="inline-flex min-h-11 items-center font-heading text-2xl font-bold text-accent underline decoration-1 underline-offset-8 break-all transition-colors duration-200 hover:text-text sm:text-4xl"
        >
          <span className="sr-only">{uiText.contactEmailLabel}: </span>
          {site.email}
        </a>
      </p>

      <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        {site.socials.map((social) => (
          <li key={social.href}>
            <ExternalLink
              href={social.href}
              className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-text transition-colors duration-200 hover:text-accent"
            >
              {social.label}
              <span
                aria-hidden="true"
                className="text-accent motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-focus-visible:translate-x-0.5 motion-safe:group-focus-visible:-translate-y-0.5"
              >
                ↗
              </span>
            </ExternalLink>
          </li>
        ))}
      </ul>

      <ContactForm email={site.email} />
    </Section>
  );
}
