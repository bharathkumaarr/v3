import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import { Footer } from "@/components/footer/footer";
import { FormattedText } from "@/components/ui/formatted-text";
import { experience } from "@/content/site";

export const metadata: Metadata = {
  title: "experience",
  description: "index of professional experience, engineering roles, and shipped systems.",
};

export default function ExperiencePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <main className="mx-auto w-full max-w-[1072px] px-6 sm:px-0 pt-28 pb-20">
        {/* 3-column layout matching paco.me/writing (192px sidebar, 640px center, 192px balance) */}
        <div className="lg:grid lg:grid-cols-[192px_640px_192px] lg:gap-x-6">
          {/* Left Column: Sidenote "index" link */}
          <nav className="mb-8 lg:mb-0 lg:sticky lg:top-28 lg:h-fit" style={{ viewTransitionName: "index-backlink" }}>
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

          {/* Center Column: experience Heading and Detailed List */}
          <div className="w-full max-w-[640px]">
            <h1
              className="w-fit text-[16px] font-medium leading-[28px] text-neutral-8 mb-8"
              style={{ viewTransitionName: "page-title-experience" }}
            >
              experience
            </h1>

            {/* List of Experiences */}
            <div className="space-y-12">
              {experience.map((item, idx) => (
                <div
                  key={item.company}
                  className="relative border-t border-neutral-3 pt-3"
                  style={{ viewTransitionName: `subpage-item-${idx}` }}
                >
                  {/* Period / Timeline on the left */}
                  <span className="block sm:absolute sm:left-0 sm:top-3 text-[14px] text-neutral-6 tabular-nums font-mono mb-2 sm:mb-0">
                    {item.period ||
                      (item.present
                        ? `${item.startYear} — present`
                        : `${item.startYear} — ${item.endYear || ""}`)}
                  </span>

                  {/* Details on the right */}
                  <div className="sm:ml-[192px]">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex items-baseline flex-wrap gap-x-2">
                        <a
                          href={item.href || "#"}
                          target={item.href?.startsWith("http") ? "_blank" : undefined}
                          rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="group inline-flex items-center text-[16px] leading-[26px] text-neutral-8"
                        >
                          <span className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150">
                            {item.company}
                          </span>
                          {item.href?.startsWith("http") && (
                            <span className="text-[13px] text-neutral-6 ml-1 select-none no-underline inline-block group-hover:transition-transform group-hover:duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                              ↗
                            </span>
                          )}
                        </a>
                        {item.role && (
                          <span className="text-[14px] text-neutral-6">
                            {item.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] text-neutral-6 font-mono shrink-0">
                        {item.location}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[14px] leading-[22px] text-neutral-6 mt-1.5 text-justify [text-align-last:left]">
                        <FormattedText>{item.description}</FormattedText>
                      </p>
                    )}

                    {item.shipped && item.shipped.length > 0 && (
                      <div className="mt-4 pt-1">
                        <span className="text-[12px] font-mono text-neutral-5 select-none block mb-2">
                          shipped:
                        </span>
                        <ul className="space-y-2 text-[14px] leading-[22px] text-neutral-6 text-justify [text-align-last:left]">
                          {item.shipped.map((shipItem, idx) => (
                            <li
                              key={idx}
                              className="relative pl-3.5 before:content-['–'] before:absolute before:left-0 before:text-neutral-4 dark:before:text-neutral-5"
                            >
                              <FormattedText>{shipItem}</FormattedText>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
