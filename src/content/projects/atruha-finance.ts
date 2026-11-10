import type { Project } from "../types";

export const project: Project = {
  title: "Atruha Finance",
  slug: "atruha-finance",
  summary:
    "Stock analysis platform that serves live and historical stock data to authenticated users.",
  tags: ["Node.js", "Puppeteer", "Cheerio", "AWS"],
  role: "I owned the backend infrastructure and all data pipeline work in an Agile  Environment.",
  problem:
    "Users want live and historical stock data in one place, but some of the market data sources have no public API.",
  approach: [
    "Designed and deployed backend APIs that serve live and historical stock data to authenticated users.",
    "Wrote custom Puppeteer and Cheerio scrapers to pull market data from sources with no public API.",
    "Deployed the backend on AWS.",
  ],
  outcome: "Atruha Finance is live, and the scrapers ran reliably in production.",
  links: { live: "https://atruhafinance.com/" },
  image: "/projects/atruha-finance.webp",
  imageAlt: "Atruha Finance website home page",
};
