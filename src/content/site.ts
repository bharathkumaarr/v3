export const siteConfig = {
  name: "Bharath Kumar",
  title: "bharath / bharath kumar",
  description:
    "software engineer at the intersection of design and web development",
  hero: {
    headline: "Bharath Kumar",
    role: "software engineer*",
    taglineLine2: "at the intersection of",
    taglineLine3: "design & development.",
    footnote:
      "building across the stack — backend, infrastructure, and frontend.",
    tags: ["backend", "frontend", "infra"],
  },
  contact: [
    { label: "GitHub", href: "https://github.com/bharathkumaarr" },
    { label: "LinkedIn", href: "https://linkedin.com/in/bkrm" },
    {
      label: "cal.com",
      href: "https://cal.com/bharath-kumar-reddy/quick-chat",
    },
  ],
};

export type ExperienceItem = {
  company: string;
  href?: string;
  startYear: string;
  endYear?: string;
  present?: boolean;
  industry: string;
  location: string;
  description: string;
  icon: string;
};

export type ProjectItem = {
  title: string;
  description: string;
  href?: string;
  icon: string;
};

export const experience: ExperienceItem[] = [
  {
    company: "OneAssure",
    href: "https://oneassure.in",
    startYear: "2025",
    present: true,
    industry: "insurtech",
    location: "india",
    description:
      "building the core saas b2b2c platform end to end — apis, web app, and the pieces in between.",
    icon: "/icons/oneassure.svg",
  },
  {
    company: "Vipernetwork",
    href: "https://vipernet.xyz",
    startYear: "2024",
    endYear: "2025",
    industry: "web3 infrastructure",
    location: "india",
    description:
      "software engineer on the founding team, building at the infrastructure level.",
    icon: "/icons/vipernetwork.svg",
  },
  {
    company: "Superteam",
    href: "https://superteam.fun",
    startYear: "2023",
    present: true,
    industry: "web3",
    location: "india",
    description:
      "started as a member, now a contributor to community initiatives and ecosystem projects.",
    icon: "/icons/superteam.svg",
  },
];

export const projects: ProjectItem[] = [
  {
    title: "Inploi SDK",
    description:
      "the official software development kit for inploi. consists of 8 packages (and counting) with a core and many lightweight ways to implement features of the inploi platform on any website, such as chatbot, job search and job alerts.",
    href: "https://www.npmjs.com/package/@inploi/sdk",
    icon: "/icons/project-1.svg",
  },
  {
    title: "Inploi Dashboard",
    description:
      "customer-facing dashboard built on remix as a bff interplaying with the laravel api that powers the inploi platform.",
    icon: "/icons/project-2.svg",
  },
  {
    title: "Winden UI",
    description:
      "internal design system library with about 50 components. built for react, styled with vanilla extract.",
    href: "https://vite-and-design-system-ui-docs.vercel.app/",
    icon: "/icons/project-3.svg",
  },
];
