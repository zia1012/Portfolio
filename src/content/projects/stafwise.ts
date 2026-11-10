import type { Project } from "../types";

export const project: Project = {
  title: "Stafwise",
  slug: "stafwise",
  summary:
    "Employee management SaaS for HR teams, covering attendance, shift scheduling, leave approvals, payroll and subscription billing.",
  tags: ["Node.js", "Express.js", "MySQL", "JWT", "AWS", "Stripe"],
  role: "I built Stafwise from scratch as a full-stack SaaS platform, including the backend, payroll engine, Super Admin dashboard and Stripe billing.",
  problem:
    "HR teams need to track attendance, schedule shifts, approve leave and run payroll with correct work hours and deductions. Stafwise handles all of this in one multi-tenant product.",
  approach: [
    "Built the backend for attendance tracking, shift scheduling, leave approvals and precise work-hour calculations.",
    "Wrote a payroll engine that automates overtime, tax deductions, pension contributions and effective-date salary changes.",
    "Built a Super Admin dashboard for multi-tenant subscription management, user provisioning and HR workflows through RESTful APIs.",
    "Added Stripe subscription billing with automated recurring payments, and role-based access control that follows plan upgrades, downgrades and renewals.",
  ],
  outcome: "Stafwise is live in production with paying customers.",
  links: { live: "https://stafwise.com/" },
  image: "/projects/stafwise.webp",
  imageAlt: "Stafwise employee scheduling and attendance screen",
};
