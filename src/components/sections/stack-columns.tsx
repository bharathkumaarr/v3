import Link from "next/link";
import { experience, projects } from "@/content/site";
import { FormattedText } from "@/components/ui/formatted-text";

export function StackColumns() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
      {/* Column 1: experience (no arrow marks on links) */}
      <div className="w-full sm:w-[192px]">
        <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-6">
          experience
        </h2>
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

      {/* Column 2: Selected Projects (keep arrow marks on links) */}
      <div className="w-full sm:w-[192px]">
        <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-6">
          <Link
            href="/projects"
            className="hover:text-neutral-8 hover:transition-colors hover:duration-150"
          >
            projects
          </Link>
        </h2>
        <div className="space-y-6">
          {projects.map((item) => (
            <div key={item.title} className="min-h-[84px] text-justify">
              <div className="flex items-center">
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] leading-[24px] text-neutral-8 underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-[16px] leading-[24px] text-neutral-8">
                    {item.title}
                  </span>
                )}
                {item.href && (
                  <span className="text-[13px] text-neutral-6 ml-1 select-none">
                    ↗
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

      {/* Column 3: writing (links to /writing) */}
      <div className="w-full sm:w-[192px]">
        <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-6">
          <Link
            href="/writing"
            className="hover:text-neutral-8 hover:transition-colors hover:duration-150"
          >
            writing
          </Link>
        </h2>
      </div>
    </div>
  );
}
