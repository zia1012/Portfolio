export type SocialLink = { label: string; href: string };

export type SiteContent = {
  name: string;
  role: string;
  location?: string;
  /** Shown as "2+" in the About stats. Keep the user's own wording from the resume. */
  yearsExperience?: string;
  tagline: string;
  heroIntro: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /** Paragraphs, 80–150 words total. */
  about: string[];
  email: string;
  socials: SocialLink[];
  contactHeading: string;
  contactIntro: string;
  seo: { title: string; description: string; siteUrl: string; ogImage: string };
  /** Anchors: #about #projects #experience #skills #contact */
  nav: { label: string; href: string }[];
};

export type Project = {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  role: string;
  problem: string;
  approach: string[];
  outcome: string;
  links: { live?: string; source?: string };
  /** Path under /projects/<slug>.webp */
  image: string;
  imageAlt: string;
};

export type ExperienceEntry = {
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
};

export type SkillGroup = { group: string; items: string[] };

export type EducationEntry = {
  degree: string;
  school: string;
  location?: string;
  start: string;
  end: string;
  detail?: string;
};

export type Certification = { name: string; issuer: string; date?: string };
