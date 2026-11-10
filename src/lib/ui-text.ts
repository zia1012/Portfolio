/**
 * Interface labels (buttons, form labels, status messages, screen-reader text).
 * Site copy lives in src/content/. These strings are UI microcopy that the content files
 * do not cover yet; the content writer can move them into src/content/ later.
 */
export const uiText = {
  skipLink: "Skip to content",
  mainNavLabel: "Main",
  /** First header nav item; links to the top of the home page. Not in site.nav (no section number). */
  home: "Home",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  themeToggle: "Dark theme",
  newTab: "(opens in new tab)",
  socialNavLabel: "Social links",
  project: {
    role: "My role",
    problem: "The problem",
    approach: "Approach",
    outcome: "Outcome",
    live: (title: string) => `Visit the ${title} live site`,
    source: (title: string) => `View the ${title} source code`,
    /** Visible label of the compact source button on the overview slide. */
    sourceShort: "Source code",
    /** aria-label of the link row on the overview slide. */
    quickLinks: "Project links",
    back: "Back to projects",
    tags: "Tags",
    overview: "Overview",
  },
  /** Projector-style slide deck on the project page. */
  slides: {
    region: (title: string) => `${title} presentation`,
    previous: "Previous",
    next: "Next",
    previousLabel: "Previous slide",
    nextLabel: "Next slide",
    dotsLabel: "Choose a slide",
    goTo: (n: number, name: string) => `Go to slide ${n}: ${name}`,
    /** aria-label of each slide group. */
    slideLabel: (n: number, total: number, name: string) => `${n} of ${total}: ${name}`,
    /** Polite live announcement after a slide change. */
    status: (n: number, total: number, name: string) => `Slide ${n} of ${total}: ${name}`,
    /** Visible "03 / 06" counter. */
    counter: (n: number, total: number) =>
      `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
  },
  contactForm: {
    heading: "Send a message",
    name: "Name",
    email: "Email",
    message: "Message",
    honeypot: "Leave this field empty",
    submit: "Send message",
    sending: "Sending…",
    success: "Thanks, your message was sent. I'll reply by email.",
    error: "Something went wrong and your message wasn't sent. Please try again or email me at",
    notConnected: "The form isn't connected yet. Email me at",
    nameRequired: "Enter your name.",
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter an email address like name@example.com.",
    messageRequired: "Enter a message.",
  },
  contactEmailLabel: "Email",
  locationLabel: "Location",
  /** Decorative boot overlay on the first home visit per session (aria-hidden). */
  boot: {
    command: "$ boot zia.dev",
    loading: "> loading scene...",
    loadingDone: "> loading scene... ok",
    ready: "> ready",
  },
  /** Decorative scroll cue at the bottom of the hero (aria-hidden). */
  scrollCue: "scroll",
  experience: {
    education: "Education",
    certifications: "Certifications",
    /** aria-label of the work history list. */
    timelineLabel: "Work history, newest first",
    /** Decorative terminal header above the timeline (aria-hidden). */
    terminalPrompt: "~/career $",
    terminalCommand: "git log --graph --oneline",
    /** Decorative ref badges (aria-hidden). */
    headRef: "HEAD -> main",
    tagRef: (n: number) => `tag: v${n}`,
    mergeRef: "merge: education",
    /** Decorative prefix before the company name (aria-hidden). */
    companyPrefix: "@",
    /** Screen-reader word between start and end dates (the visible arrow is aria-hidden). */
    rangeTo: "to",
    /** Duration chip, e.g. "1 yr 3 mos" or "8 mos". */
    duration: (totalMonths: number) => {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
      if (months > 0) parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);
      return parts.join(" ");
    },
  },
  /** Stats row under the About paragraphs. Numbers come from src/content/. */
  about: {
    yearsLabel: (n: number) => (n === 1 ? "year of experience" : "years of experience"),
    projectsLabel: (n: number) => (n === 1 ? "project" : "projects"),
    liveSitesLabel: (n: number) => (n === 1 ? "live site" : "live sites"),
  },
  skills: {
    /** Muted count under each group heading. */
    count: (n: number) => `${n} ${n === 1 ? "skill" : "skills"}`,
    /** Screen-reader suffix on a category tab (the visible count badge is aria-hidden). */
    tabCount: (n: number) => `, ${n} ${n === 1 ? "skill" : "skills"}`,
    /** Screen-reader suffix on a chip that has a project usage badge. */
    usedIn: (n: number) => `, used in ${n} ${n === 1 ? "project" : "projects"}`,
    /** aria-label of the category tab list. */
    tablistLabel: "Skill categories",
    /** Accessible name of the globe's pause toggle. Fixed, because aria-pressed carries the state. */
    pauseGlobe: "Pause skill globe",
  },
} as const;
