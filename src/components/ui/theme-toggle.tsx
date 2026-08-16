"use client";

import { Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "fixed right-4 top-1/2 z-50 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg",
        "bg-neutral-8 text-amber-400 shadow-sm transition-all",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-7 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-1",
      )}
    >
      <Sun className="hidden size-4 dark:block" strokeWidth={2.5} />
      <span className="text-base leading-none dark:hidden" aria-hidden="true">
        ✳
      </span>
    </button>
  );
}
