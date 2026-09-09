"use client";

import { cn } from "@/lib/cn";

type ThemeFlipButtonProps = {
  isDark: boolean;
  onFlip: () => void;
};

/**
 * Keyboard route to the same theme change, so the gesture is never the only way in.
 *
 * Hidden the way a skip link is: announced to assistive technology, invisible and
 * layout-free until it takes focus, at which point it appears near the corner it stands
 * in for. That keeps the idle page pixel-identical to before.
 */
export function ThemeFlipButton({ isDark, onFlip }: ThemeFlipButtonProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className={cn(
        "sr-only",
        "focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:right-4 focus-visible:z-40",
        "focus-visible:rounded-md focus-visible:border focus-visible:border-neutral-4",
        "focus-visible:bg-neutral-1 focus-visible:px-3 focus-visible:py-1.5",
        "focus-visible:text-xs focus-visible:text-neutral-7 focus-visible:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-6",
      )}
    >
      turn the page to {isDark ? "light" : "dark"} theme
    </button>
  );
}
