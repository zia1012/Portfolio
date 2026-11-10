import type { Project } from "../types";

export const project: Project = {
  title: "News Application",
  slug: "news-app",
  summary:
    "Production backend for a mobile news app with live feeds, AI article summaries and personalized content.",
  tags: ["Node.js", "Express.js", "JWT", "GNews API", "Perplexity API", "Google Gemini"],
  role: "I built the production backend including auth, news feed integration and the AI summarization pipeline.",
  problem:
    "A mobile news app needs secure accounts, live news feeds and short AI summaries of full articles, without running past AI model quotas.",
  approach: [
    "Built auth (login, signup and token refresh) with JWT.",
    "Integrated the GNews API for live news feeds and the Grok API for AI article summaries and personalized content.",
    "Built a RAG summarization pipeline with Node.js and Google Gemini, using full-article retrieval and content-aware prompting.",
    "Added tiered model fallback, quota-aware rate limiting and circuit breakers so summaries keep working when a model is unavailable or near its quota.",
  ],
  outcome: "The backend runs in production for the mobile news app.",
  links: {},
  image: "/projects/news-app.webp",
  imageAlt: "Mobile news app screen showing a news feed with AI article summaries",
};
