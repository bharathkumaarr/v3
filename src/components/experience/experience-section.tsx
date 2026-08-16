import { experience } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExperienceListItem } from "@/components/experience/experience-list-item";

export function ExperienceSection() {
  return (
    <section className="contents">
      <ContentRow contentClassName="mt-8">
        <SectionHeading>latest experience</SectionHeading>
      </ContentRow>
      <ol className="contents">
        {experience.map((item, index) => (
          <ExperienceListItem
            key={item.company}
            item={item}
            isLast={index === experience.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}
