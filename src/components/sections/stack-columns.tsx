import Link from "next/link";
import {
  experience,
  projects,
  allProjects,
  featuredWriting,
  allWritingPosts,
} from "@/content/site";
import { FormattedText } from "@/components/ui/formatted-text";

type ColumnHeaderProps = {
  href: string;
  title: string;
  badge: string;
};

function ColumnHeader({ href, title, badge }: ColumnHeaderProps) {
  return (
    <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-6">
      <Link
        href={href}
        className="group inline-flex items-center text-neutral-6 hover:text-neutral-8 hover:transition-colors hover:duration-150"
      >
        <span className="inline-flex items-center">
          <span className="inline-block transition-all duration-150 ease-out group-hover:opacity-0 group-hover:translate-x-1.5 text-neutral-5">
            /
          </span>
          <span>{title}</span>
        </span>
        <span className="ml-2 opacity-0 -translate-x-1.5 transition-all duration-150 delay-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:duration-200 group-hover:delay-100 ease-out text-[11px] leading-tight text-neutral-6 font-mono border border-neutral-4/60 dark:border-neutral-4 px-1.5 py-0.5 rounded select-none whitespace-nowrap">
          {badge}
        </span>
      </Link>
    </h2>
  );
}

export function StackColumns() {
  const remainingProjects = allProjects.length - projects.length;
  const remainingWriting = allWritingPosts.length - featuredWriting.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
      {/* Column 1: experience */}
      <div className="w-full sm:w-[192px]">
        <ColumnHeader
          href="/experience"
          title="experience"
          badge="show more details"
        />
        <div className="space-y-6">
          {experience.map((item) => (
            <div key={item.company} className="min-h-[84px] text-justify">
              <div className="flex items-center">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] leading-[24px] text-neutral-8 underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
                  >
                    {item.company}
                  </a>
                ) : (
                  <span className="text-[16px] leading-[24px] text-neutral-8">
                    {item.company}
                  </span>
                )}
              </div>
              <p className="text-[14px] leading-[20px] text-neutral-6 mt-1 text-justify [text-align-last:left]">
                <FormattedText>{item.description}</FormattedText>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Selected Projects */}
      <div className="w-full sm:w-[192px]">
        <ColumnHeader href="/projects" title="projects" badge="view all" />
        <div className="space-y-6">
          {projects.map((item) => (
            <div key={item.title} className="min-h-[84px] text-justify">
              <div className="flex items-center flex-wrap gap-x-2">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center text-[16px] leading-[24px] text-neutral-8"
                  >
                    <span className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150">
                      {item.title}
                    </span>
                    <span className="text-[13px] text-neutral-6 ml-1 select-none no-underline inline-block group-hover:transition-transform group-hover:duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      ↗
                    </span>
                  </a>
                ) : (
                  <span className="text-[16px] leading-[24px] text-neutral-8">
                    {item.title}
                  </span>
                )}
                {item.completed === false && (
                  <span className="text-[11px] leading-tight text-neutral-6 font-mono border border-neutral-4/60 dark:border-neutral-4 px-1.5 py-0.5 rounded select-none">
                    ongoing
                  </span>
                )}
              </div>
              <p className="text-[14px] leading-[20px] text-neutral-6 mt-1 text-justify [text-align-last:left]">
                <FormattedText>{item.description}</FormattedText>
              </p>
            </div>
          ))}

          {remainingProjects > 0 && (
            <div className="pt-2">
              <Link
                href="/projects"
                className="group inline-flex items-center text-[13px] font-mono text-neutral-6 hover:text-neutral-8 hover:transition-colors hover:duration-150"
              >
                <span className="underline decoration-1 underline-offset-[3px] decoration-neutral-4/60 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150">
                  +{remainingProjects} more
                </span>
                <span className="ml-1 text-[11px] select-none no-underline inline-block group-hover:transition-transform group-hover:duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Column 3: writing */}
      <div className="w-full sm:w-[192px]">
        <ColumnHeader href="/writing" title="writing" badge="view all" />
        <div className="space-y-6">
          {featuredWriting.map((item) => (
            <div key={item.title} className="min-h-[84px] text-justify">
              <div className="flex items-center">
                <a
                  href={item.href || "#"}
                  className="text-[16px] leading-[24px] text-neutral-8 underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
                >
                  {item.title}
                </a>
              </div>
              {item.description ? (
                <p className="text-[14px] leading-[20px] text-neutral-6 mt-1 text-justify [text-align-last:left]">
                  <FormattedText>{item.description}</FormattedText>
                </p>
              ) : (
                <span className="text-[13px] leading-[20px] text-neutral-6 tabular-nums font-mono block mt-1">
                  {item.date}
                </span>
              )}
            </div>
          ))}

          {remainingWriting > 0 && (
            <div className="pt-2">
              <Link
                href="/writing"
                className="group inline-flex items-center text-[13px] font-mono text-neutral-6 hover:text-neutral-8 hover:transition-colors hover:duration-150"
              >
                <span className="underline decoration-1 underline-offset-[3px] decoration-neutral-4/60 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150">
                  +{remainingWriting} more
                </span>
                <span className="ml-1 text-[11px] select-none no-underline inline-block group-hover:transition-transform group-hover:duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
