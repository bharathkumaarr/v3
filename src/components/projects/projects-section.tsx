import { projects } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectListItem } from "@/components/projects/project-list-item";

export function ProjectsSection() {
  return (
    <section className="contents">
      <ContentRow contentClassName="mt-8">
        <SectionHeading>selected projects</SectionHeading>
      </ContentRow>
      <ol className="contents">
        {projects.map((item, index) => (
          <ProjectListItem
            key={item.title}
            item={item}
            isLast={index === projects.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}
