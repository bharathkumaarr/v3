import Link from "next/link";
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
        (<time dateTime={item.startYear}>{item.startYear}</time>-present)
      </>
    );
  }

  return (
    <>
      (<time dateTime={item.startYear}>{item.startYear}</time>-
      <time dateTime={item.endYear}>{item.endYear}</time>)
    </>
  );
}

function CompanyLogo({ item }: { item: ExperienceItem }) {
  const icon = <ItemIcon src={item.icon} alt={`${item.company}'s logo`} />;

  if (!item.href) return icon;

  return (
    <Link
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.company} website`}
      className="group rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-7"
    >
      {icon}
    </Link>
  );
}

export function ExperienceListItem({ item, isLast }: ExperienceListItemProps) {
  return (
    <li className="contents">
      <ContentRow
        contentClassName={isLast ? undefined : "pb-8"}
        sidebar={<CompanyLogo item={item} />}
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
