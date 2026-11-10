import type { Project } from "../types";

export const project: Project = {
  title: "Cafe Website",
  slug: "cafe-website",
  summary: "Client-facing cafe website in TypeScript with custom smooth-scroll behaviour.",
  tags: ["TypeScript"],
  role: "Designed and developed the platform using TypeScript, taking ownership of frontend implementation, functionality, and delivering the project from development to deployment.",
  problem: "The client needed a cafe website with smooth scrolling that connects the frontend and backend components.",
  approach: [
    "Built the site in TypeScript.",
    "Wrote custom smooth-scroll behaviour that bridges the frontend and backend components.",
    "TODO: another key decision on the Cafe Website and why.",
  ],
  outcome: "The site is live at a public demo link.",
  links: { live: "https://coffe-shop-ui-ux.vercel.app" },
  image: "/projects/cafe-website.webp",
  imageAlt: "Cafe website home page with menu and smooth-scrolling sections",
};
