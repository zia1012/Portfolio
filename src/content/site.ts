import type { SiteContent } from "./types";

export const site: SiteContent = {
  name: "Mohammed Zia Mudassir",
  role: "Software Developer",
  yearsExperience: "2+",
  tagline: "Backend-leaning full-stack engineer.",
  heroIntro:
    "I build production backends with Node.js, Express and AWS. I've shipped Stafwise, a live SaaS HR platform, and Atruha Finance, a stock analysis platform.",
  primaryCta: { label: "View projects", href: "#projects" },
  secondaryCta: { label: "Get in touch", href: "#contact" },
  about: [
    "I'm a backend-focused Full Stack Developer with 2.5+ years of experience, passionate about turning complex problems into scalable, reliable software that solves real business challenges.",
    "I believe great software goes beyond writing code. It's about understanding problems, designing efficient solutions, and ensuring reliability in production. From building complex business logic and data pipelines to managing cloud infrastructure, I've taken ownership of features throughout the entire development lifecycle. My tech stack includes Node.js, React.js, Java, Spring Boot, PostgreSQL, and MySQL, with expertise in API development, backend architecture, and database optimization.",
    "I'm driven by challenging engineering problems, continuous learning, and the opportunity to build meaningful products that make a real-world impact.",
  ],
  email: "ziamudassir238@gmail.com",
  socials: [
    { label: "GitHub", href: "https://github.com/zia1012" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/zia-mudassir-726376255" },
  ],
  contactHeading: "Get in touch",
  contactIntro:
    "Email is the quickest way to reach me. You can also find me on GitHub and LinkedIn.",
  seo: {
    title: "Mohammed Zia Mudassir – Software Developer",
    description:
      "Mohammed Zia Mudassir, a backend-leaning full-stack engineer working with Node.js, Express and AWS. See Stafwise, Atruha Finance, AcadLynk and more projects.",
    siteUrl: "TODO: production URL",
    ogImage: "/og.png",
  },
  nav: [
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Contact", href: "#contact" },
  ],
};
