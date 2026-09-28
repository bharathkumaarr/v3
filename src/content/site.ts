import siteData from "./site.json";
import experienceData from "./experience.json";
import projectsData from "./projects.json";
import writingData from "./writing.json";

export type SiteConfig = typeof siteData;

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
  date?: string;
  href?: string;
  icon: string;
  featured?: boolean;
};

export type ProjectGroup = {
  year: string;
  projects: Array<Omit<ProjectItem, "icon"> & { icon?: string }>;
};

export type WritingPost = {
  title: string;
  date: string;
  href: string;
};

export type WritingGroup = {
  year: string;
  posts: WritingPost[];
};

export const siteConfig: SiteConfig = siteData;

export const experience: ExperienceItem[] = experienceData;

export const projectGroups: ProjectGroup[] = projectsData;

// Flattened featured projects for the homepage column
export const projects: ProjectItem[] = projectsData.flatMap((group) =>
  group.projects
    .filter((p) => p.featured ?? true)
    .map((p) => ({
      ...p,
      icon: ("icon" in p && typeof p.icon === "string" ? p.icon : "") || "/icons/shipyard.svg",
    }))
);

export const writingEntries: WritingGroup[] = writingData;
