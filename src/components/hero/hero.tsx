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
        <h1 className="text-[min(2.25rem,5.85cqi)] leading-[1.11] text-balance lowercase tracking-tighter text-neutral-8">
          <span className="whitespace-nowrap">
            i{"\u2019"}m{" "}
            <span className="font-semibold">{hero.headline}</span>, {hero.role}
          </span>
          <br />
          {hero.taglineLine2}
          <br />
          {hero.taglineLine3}
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
