import type { ProjectItem } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { ExternalLink, ItemIcon } from "@/components/ui/link-styles";

type ProjectListItemProps = {
  item: ProjectItem;
  isLast?: boolean;
};

export function ProjectListItem({ item, isLast }: ProjectListItemProps) {
  return (
    <li className="contents">
      <ContentRow
        contentClassName={isLast ? undefined : "pb-4"}
        sidebar={<ItemIcon src={item.icon} alt="" />}
      >
        <header className="text-sm lowercase">
          <h3 className="text-neutral-8">
            {item.href ? (
              <ExternalLink href={item.href}>{item.title}</ExternalLink>
            ) : (
              item.title
            )}
          </h3>
        </header>
        <p className="text-pretty text-sm lowercase text-neutral-6">
          {item.description}
        </p>
      </ContentRow>
    </li>
  );
}
