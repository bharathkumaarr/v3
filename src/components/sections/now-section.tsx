import { siteConfig } from "@/content/site";
import { FormattedText } from "@/components/ui/formatted-text";

export function NowSection() {
  const { now, contact } = siteConfig;
  const emailContact = contact.find((c) => c.label === "email");
  const xContact = contact.find((c) => c.label === "x");
  const linkedinContact = contact.find((c) => c.label === "linkedin");
  const calContact = contact.find((c) => c.label === "cal.com");

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
        reach me via{" "}
        <a
          href={emailContact?.href || "mailto:reddybharathkumar.m@gmail.com"}
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          {emailContact?.handle || "reddybharathkumar.m@gmail.com"}
        </a>
        , say hello at{" "}
        <a
          href={xContact?.href || "https://x.com/bharathkumarr"}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          {xContact?.handle || "@bharathkumarr"}
        </a>
        , find me on{" "}
        <a
          href={linkedinContact?.href || "https://linkedin.com/in/bkrm"}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          linkedin
        </a>
        , or pick a time on{" "}
        <a
          href={
            calContact?.href ||
            "https://cal.com/bharath-kumar-reddy/quick-chat"
          }
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
