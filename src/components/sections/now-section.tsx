import { siteConfig } from "@/content/site";
import { FormattedText } from "@/components/ui/formatted-text";

export function NowSection() {
  const { now, contact } = siteConfig;

  return (
    <section className="mb-20">
      {/* "now" Header */}
      <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-7">
        now
      </h2>

      <p className="text-[16px] leading-[28px] text-neutral-8 mb-7 text-justify [text-align-last:left]">
        <FormattedText>{now.paragraph1}</FormattedText>
      </p>

      <p className="text-[16px] leading-[28px] text-neutral-8 mb-14 text-justify [text-align-last:left]">
        <FormattedText>{now.paragraph2}</FormattedText>
      </p>

      {/* "connect" Header */}
      <h2 className="text-[14px] font-normal leading-[20px] text-neutral-6 mb-7">
        connect
      </h2>

      <p className="text-[16px] leading-[28px] text-neutral-8 text-justify [text-align-last:left]">
        reach me at{" "}
        <a
          href={contact[0]?.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          {contact[0]?.handle || "@bharathkumaarr"}
        </a>
        ,{" "}
        <a
          href={contact[1]?.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          linkedin
        </a>
        , or book a quick chat on{" "}
        <a
          href={contact[2]?.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          cal.com
        </a>
        .
      </p>
    </section>
  );
}
