import type { Project } from "../types";

export const project: Project = {
  title: "AcadLynk",
  slug: "acadlynk",
  summary:
    "School management and learning management system covering admissions, attendance, exams, courses, assignments and gradebooks.",
  tags: ["TypeScript", "PostgreSQL", "React.js", "R2 Bucket", "Razorpay"],
  role: "I built the REST APIs, PostgreSQL schemas and Razorpay billing, and designed the UI/UX for the school management modules.",
  problem:
    "Schools often manage admissions, attendance, examinations, academic records, and student progress across multiple systems. This creates disconnected workflows, increases administrative work, and makes it harder to track student performance.",
  approach: [
    "Built school management modules for student admissions, attendance tracking, examination management and academic records, and designed their UI/UX.",
    "Built the LMS side: course and content creation, assignment distribution and submission, gradebook management and student progress tracking.",
    "Wrote secure RESTful APIs and optimized PostgreSQL schemas for student data, attendance records and exam results.",
    "Added Razorpay subscription billing with recurring plans and webhook-based payment verification, so a school's plan tier and payment status gate which features it can use.",
    "Stored student documents, certificates and profile images securely in an R2 Bucket.",
  ],
  outcome:
    "AcadLynk brings school management and learning management together in one integrated platform, helping schools simplify operations, streamline learning, and manage everything in one place.",
  links: { live: "https://acadlynk.com/" },
  image: "/projects/acadlynk.webp",
  imageAlt: "AcadLynk school management dashboard",
};
