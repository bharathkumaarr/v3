import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer/footer";
import { FormattedText } from "@/components/ui/formatted-text";
import { projectGroups } from "@/content/site";

export const metadata: Metadata = {
  title: "projects",
  description: "index of projects, open source, and systems software.",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="mx-auto w-full max-w-[1072px] px-6 sm:px-0 pt-28 pb-20">
        {/* 3-column layout matching paco.me/writing (192px sidebar, 640px center, 192px balance) */}
        <div className="lg:grid lg:grid-cols-[192px_640px_192px] lg:gap-x-6">
          {/* Left Column: Sidenote "index" link */}
          <nav className="mb-8 lg:mb-0 lg:sticky lg:top-28 lg:h-fit">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-neutral-8 hover:text-neutral-6 hover:transition-colors hover:duration-150"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-8"
              >
                <polyline points="9 14 4 9 9 4" />
                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
              </svg>
              <span className="text-[16px] leading-[28px]">
                <em>index</em>
              </span>
            </Link>
          </nav>

          {/* Center Column: projects Heading and Index Table */}
          <div className="w-full max-w-[640px]">
            <h1 className="text-[16px] font-medium leading-[28px] text-neutral-8 mb-8">
              projects
            </h1>

            {/* Table of Projects Grouped by Year */}
            <div className="space-y-10">
              {projectGroups.map((group) => (
                <div
                  key={group.year}
                  className="relative border-t border-neutral-3 pt-3"
                >
                  {/* Year */}
                  <span className="block sm:absolute sm:left-0 sm:top-3 text-[14px] text-neutral-6 tabular-nums font-mono mb-2 sm:mb-0">
                    {group.year}
                  </span>

                  {/* Projects for this year */}
                  <div className="sm:ml-[160px] divide-y divide-neutral-2/50 dark:divide-neutral-3/30">
                    {group.projects.map((project) => (
                      <div key={project.title} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="flex items-center flex-wrap gap-x-2">
                            <a
                              href={project.href || "#"}
                              target={project.href?.startsWith("http") ? "_blank" : undefined}
                              rel={project.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="group inline-flex items-center text-[16px] leading-[26px] text-neutral-8"
                            >
                              <span className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150">
                                {project.title}
                              </span>
                              {project.href?.startsWith("http") && (
                                <span className="text-[13px] text-neutral-6 ml-1 select-none no-underline inline-block group-hover:transition-transform group-hover:duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                  ↗
                                </span>
                              )}
                            </a>
                            {project.completed === false && (
                              <span className="text-[11px] leading-tight text-neutral-6 font-mono border border-neutral-4/60 dark:border-neutral-4 px-1.5 py-0.5 rounded select-none">
                                ongoing
                              </span>
                            )}
                          </div>
                          <span className="text-[14px] text-neutral-6 tabular-nums font-mono shrink-0">
                            {project.date}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-[14px] leading-[22px] text-neutral-6 mt-1 text-justify [text-align-last:left]">
                            <FormattedText>{project.description}</FormattedText>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Empty balance space matching 1072px grid */}
          <div className="hidden lg:block w-[192px]" aria-hidden="true" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
