import type { Metadata } from "next";
import { Link } from "next-view-transitions";
import { Footer } from "@/components/footer/footer";
import { writingEntries } from "@/content/site";

export const metadata: Metadata = {
  title: "writing",
  description: "thoughts on software engineering, design, and systems.",
};

export default function WritingPage() {
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

          {/* Center Column: writing Heading and Index Table */}
          <div className="w-full max-w-[640px]">
            <h1
              className="w-fit text-[16px] font-medium leading-[28px] text-neutral-8 mb-8"
              style={{ viewTransitionName: "page-title-writing" }}
            >
              writing
            </h1>

            {/* Table of Articles Grouped by Year */}
            <div className="space-y-6">
              {writingEntries.map((group, idx) => (
                <div
                  key={group.year}
                  className="relative border-t border-neutral-3 pt-3"
                  style={{ viewTransitionName: `subpage-item-${idx}` }}
                >
                  {/* Year */}
                  <span className="block sm:absolute sm:left-0 sm:top-3 text-[14px] text-neutral-6 tabular-nums font-mono mb-2 sm:mb-0">
                    {group.year}
                  </span>

                  {/* Posts for this year */}
                  <div className="sm:ml-[160px] divide-y divide-transparent">
                    {group.posts.map((post) => (
                      <a
                        key={post.title}
                        href={post.href}
                        className="group flex items-baseline justify-between py-2 text-neutral-8"
                      >
                        <p className="text-[16px] leading-[28px] text-neutral-8 underline decoration-1 underline-offset-[3px] decoration-neutral-4 group-hover:decoration-neutral-8 group-hover:transition-[text-decoration-color] group-hover:duration-150 pr-4">
                          {post.title}
                        </p>
                        <span className="text-[14px] text-neutral-6 tabular-nums font-mono shrink-0">
                          {post.date}
                        </span>
                      </a>
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
