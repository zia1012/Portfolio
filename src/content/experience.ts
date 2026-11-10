import type { ExperienceEntry } from "./types";

export const experience: ExperienceEntry[] = [
  {
    company: "Atmez AI Solution",
    role: "Backend Engineer",
    start: "April 2025",
    end: "Present",
    bullets: [
      "Engineered a RAG-based news summarization pipeline with Node.js and Google Gemini, covering full-article retrieval, prompt engineering, model fallback and cost-efficient content generation.",
      "Designed and maintained Node.js/Express.js APIs for high-volume data ingestion, processing and AI-powered content delivery, secured with JWT and OAuth 2.0.",
      "Built automated web scraping pipelines with Puppeteer and Cheerio to collect, transform and process structured data from multiple sources.",
      "Deployed and managed backend services on AWS (EC2, S3, RDS) with monitoring, rate limiting and fault-tolerant architecture.",
    ],
  },
  {
    company: "TODO: company name",
    role: "Associate Software Engineer",
    start: "Oct 2023",
    end: "Dec 2024",
    bullets: [
      "Built full-stack features across Java + Spring Boot backends and React.js frontends, taking them from design to deployment on my own.",
      "Set up CI/CD pipelines with Git, Maven and Docker to automate deployments to AWS and GCP, with MySQL as the primary database.",
      "Built a client-facing TypeScript portfolio site with smooth-scroll integration.",
    ],
  },
];
