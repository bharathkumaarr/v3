import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  children: string;
  className?: string;
};

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold lowercase tracking-tight text-neutral-8 sm:text-sm",
        className,
      )}
    >
      {children}
    </h2>
  );
}
