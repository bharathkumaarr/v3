import { siteConfig } from "@/content/site";

export function Hero() {
  const { name, intro } = siteConfig;

  return (
    <header className="mb-14">
      <h1 className="text-[16px] font-medium leading-[28px] text-neutral-8 mb-7">
        {name}
      </h1>

      <p className="text-[16px] leading-[28px] text-neutral-8 mb-7 text-justify [text-align-last:left]">
        <em>{intro.leadItalic}</em> {intro.bio}
      </p>

      <p className="text-[16px] leading-[28px] text-neutral-8 mb-7 text-justify [text-align-last:left]">
        currently working fullstack at{" "}
        <a
          href="https://oneassure.in"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-1 underline-offset-[3px] decoration-neutral-4 hover:decoration-neutral-8 text-neutral-8 hover:transition-[text-decoration-color] hover:duration-150"
        >
          oneassure
        </a>{" "}
        building the core saas platform.
      </p>
    </header>
  );
}
