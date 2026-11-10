import type { SkillGroup } from "./types";

export const skills: SkillGroup[] = [
  { group: "Languages", items: ["JavaScript (ES6+)", "Java", "TypeScript", "HTML", "CSS"] },
  { group: "Backend", items: ["Node.js", "Express.js", "Spring Boot", "REST API design"] },
  { group: "Frontend", items: ["React.js", "Responsive layout"] },
  {
    group: "Databases",
    items: ["MySQL", "MongoDB", "PostgreSQL", "Schema design", "Query optimization"],
  },
  {
    group: "Cloud / DevOps",
    items: ["AWS (EC2, S3, RDS)", "Docker", "CI/CD with Git + Maven"],
  },
  {
    group: "Auth & Security",
    items: ["JWT", "OAuth 2.0", "Passport.js", "Spring Security", "Role-based access"],
  },
  {
    group: "Integrations",
    items: ["Puppeteer", "Cheerio", "GNews API", "Perplexity API", "Razorpay"],
  },
  { group: "Tools", items: ["Postman", "GitHub", "VS Code", "Docker"] },
  {
    group: "AI Tools",
    items: ["Kiro IDE", "Claude Sonnet", "Claude Opus", "Prompt Engineering"],
  },
];
