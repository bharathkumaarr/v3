export const siteConfig = {
  name: "Bharath Kumar",
  title: "bharath / bharath kumar",
  description:
    "software engineer hanging out at the intersection of design and development",
  hero: {
    headline: "Bharath Kumar",
    role: "software engineer*",
    taglineLine2: "at the intersection of",
    taglineLine3: "design & development.",
    footnote:
      "happily bouncing around the stack: backend, infra, and frontend.",
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
      "software engineer working fullstack across backend and frontend on the core saas b2b2c platform.",
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
      "on the founding team, digging into the infrastructure layer.",
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
      "started as a member, now poking around community initiatives and ecosystem projects.",
    icon: "/icons/superteam.svg",
  },
];

export const projects: ProjectItem[] = [
  // {
  //   title: "Inploi SDK",
  //   description:
  //     "the official sdk for inploi. 8 packages and counting, with a core plus light ways to drop chatbot, job search, job alerts, and friends onto any site.",
  //   href: "https://www.npmjs.com/package/@inploi/sdk",
  //   icon: "/icons/project-1.svg",
  // },
  // {
  //   title: "Inploi Dashboard",
  //   description:
  //     "customer-facing dashboard on remix, playing bff with the laravel api behind inploi.",
  //   icon: "/icons/project-2.svg",
  // },
  {
    title: "shipyard",
    description:
      "a deployment platform that automates, coordinates, and reliably recovers application deployments across environments. its durable execution and idempotent operations reduced deployment recovery time by 68%.",
    icon: "/icons/shipyard.svg",
  },
  {
    title: "convo",
    description:
      "a multi tenant conversational ai platform enabling users to configure custom prompt driven agents with persistent, multi turn chat sessions.",
    icon: "/icons/convo.svg",
    href: "https://convo-sigma.vercel.app/"
  },
  {
    title: "traceRAG",
    description:
      "a source grounded document intelligence platform that turns complex PDFs into structured, verifiable insights. It combines hybrid search, LLM powered extraction, and deterministic citation verification to ensure every AI generated claim can be traced back to its original source.",
    icon: "/icons/convo.svg"
  },
];
