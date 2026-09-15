import { siteConfig } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SkillTags } from "@/components/hero/skill-tags";

export function Hero() {
  const { hero } = siteConfig;

  return (
    <>
      <ContentRow contentClassName="@container">
        {/*
          Scale with the content column (not full-bleed) so line 1 stays on one row
          while the heading stays left-aligned with the rest of the page grid.
        */}
        <h1 className="text-[min(2.25rem,5.85cqi)] lowercase tracking-tighter text-neutral-8">
          <span className="block whitespace-nowrap">
            i{"\u2019"}m{" "}
            <span className="font-semibold">{hero.headline}</span>, {hero.role}
          </span>
          <span className="block">{hero.taglineLine2}</span>
          <span className="block">{hero.taglineLine3}</span>
        </h1>
      </ContentRow>

      <ContentRow
        sidebar={
          <p className="mt-8 text-md lowercase text-neutral-8">*</p>
        }
        contentClassName="mt-8"
      >
        <p className="text-pretty text-sm lowercase text-neutral-7">
          {hero.footnote}
        </p>
        <SkillTags tags={hero.tags} />
      </ContentRow>
    </>
  );
}
