import siteData from "./site.json";
import experienceData from "./experience.json";
import projectsData from "./projects.json";
import writingData from "./writing.json";

export type SiteConfig = typeof siteData;

export type ExperienceItem = {
  company: string;
  role?: string;
  period?: string;
  href?: string;
  startYear: string;
  endYear?: string;
  present?: boolean;
  industry: string;
  location: string;
  description: string;
  icon?: string;
  shipped?: string[];
};

export type ProjectItem = {
  title: string;
  description: string;
  date?: string;
  href?: string;
  icon: string;
  featured?: boolean;
  completed?: boolean;
};

export type ProjectGroup = {
  year: string;
  projects: Array<Omit<ProjectItem, "icon"> & { icon?: string }>;
};

export type WritingPost = {
  title: string;
  date: string;
  href: string;
  description?: string;
  featured?: boolean;
};

export type WritingGroup = {
  year: string;
  posts: WritingPost[];
};

export const siteConfig: SiteConfig = siteData;

export const experience: ExperienceItem[] = experienceData;

export const projectGroups: ProjectGroup[] = projectsData;

// All projects flattened
export const allProjects: ProjectItem[] = projectsData.flatMap((group) =>
  group.projects.map((p) => ({
    ...p,
    icon: ("icon" in p && typeof p.icon === "string" ? p.icon : "") || "/icons/shipyard.svg",
  }))
);

// Flattened featured projects for the homepage column
export const projects: ProjectItem[] = allProjects.filter((p) => p.featured ?? true);

export const writingEntries: WritingGroup[] = writingData;

// All writing posts flattened
export const allWritingPosts: WritingPost[] = writingData.flatMap((group) => group.posts);

// Featured writing posts for the homepage column
export const featuredWriting: WritingPost[] = allWritingPosts.filter((p) => p.featured ?? false);

