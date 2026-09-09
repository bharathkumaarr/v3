import { siteConfig } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SkillTags } from "@/components/hero/skill-tags";

export function Hero() {
  const { hero } = siteConfig;

  return (
    <>
      <ContentRow>
        <h1 className="text-pretty text-4xl lowercase tracking-tighter text-neutral-8">
          i&apos;m{" "}
          <span className="font-semibold">{hero.headline}</span>, {hero.role}
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
