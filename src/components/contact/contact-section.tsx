import { siteConfig } from "@/content/site";
import { ContentRow } from "@/components/layout/content-row";
import { SectionHeading } from "@/components/ui/section-heading";
import { PillLink } from "@/components/ui/link-styles";

export function ContactSection() {
  return (
    <section className="contents">
      <ContentRow contentClassName="mt-8">
        <SectionHeading>contact</SectionHeading>
      </ContentRow>
      <ContentRow>
        <ol className="-mx-1.5 flex flex-wrap gap-2">
          {siteConfig.contact.map((link) => (
            <li key={link.label}>
              <PillLink href={link.href}>{link.label}</PillLink>
            </li>
          ))}
        </ol>
      </ContentRow>
    </section>
  );
}
