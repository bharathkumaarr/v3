import type { ExperienceItem } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { ItemIcon } from "@/components/ui/link-styles";

type ExperienceListItemProps = {
  item: ExperienceItem;
  isLast?: boolean;
};

function formatDateRange(item: ExperienceItem) {
  if (item.present) {
    return (
      <>
        (<time dateTime={item.startYear}>{item.startYear}</time>—present)
      </>
    );
  }

  return (
    <>
      (<time dateTime={item.startYear}>{item.startYear}</time>—
      <time dateTime={item.endYear}>{item.endYear}</time>)
    </>
  );
}

export function ExperienceListItem({ item, isLast }: ExperienceListItemProps) {
  return (
    <li className="contents">
      <ContentRow
        contentClassName={isLast ? undefined : "pb-4"}
        sidebar={
          <ItemIcon src={item.icon} alt={`${item.company}'s logo`} />
        }
      >
        <header className="flex gap-1.5 text-sm lowercase">
          <h3 className="text-neutral-8">{item.company}</h3>
          <div className="inline text-neutral-8">{formatDateRange(item)}</div>
        </header>
        <p className="text-pretty text-sm lowercase text-neutral-6">
          {item.industry}, {item.location}
        </p>
        <p className="text-pretty text-sm lowercase text-neutral-6">
          {item.description}
        </p>
      </ContentRow>
    </li>
  );
}
