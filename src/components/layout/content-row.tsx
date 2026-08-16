import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const pageGridClassName =
  "grid w-full grid-cols-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-4";

type ContentRowProps = {
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ContentRow({
  sidebar,
  children,
  className,
  contentClassName,
}: ContentRowProps) {
  const hasSidebar = sidebar != null;

  return (
    <div className={cn("grid grid-cols-1 gap-y-2 sm:contents", className)}>
      <div
        className={cn(
          "flex items-start sm:justify-end",
          !hasSidebar && "hidden sm:flex",
        )}
      >
        {sidebar}
      </div>
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </div>
  );
}
