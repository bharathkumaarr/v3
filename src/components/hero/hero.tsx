import { siteConfig } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SkillTags } from "@/components/hero/skill-tags";

export function Hero() {
  const { hero } = siteConfig;

  return (
    <>
      {/* Full-bleed in the page grid; U+2019 apostrophe matches frederic.ooo. */}
      <h1 className="col-span-full text-[min(2.25rem,calc((100vw-2rem)*0.058))] lowercase tracking-tighter text-neutral-8">
        <span className="block whitespace-nowrap">
          i{"\u2019"}m{" "}
          <span className="font-semibold">{hero.headline}</span>, {hero.role}
        </span>
        <span className="block">{hero.taglineLine2}</span>
        <span className="block">{hero.taglineLine3}</span>
      </h1>

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
