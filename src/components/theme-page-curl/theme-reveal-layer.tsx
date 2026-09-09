"use client";

import { memo, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

type ThemeRevealLayerProps = {
  /** Theme this layer paints in: always the opposite of the live one. */
  theme: "light" | "dark";
  /** The clipped layer itself. Its `clip-path` is written to directly each frame. */
  layerRef: RefObject<HTMLDivElement | null>;
  /** Inner wrapper, offset to match document scroll. */
  contentRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

/**
 * The page as it looks in the other theme, sitting underneath the real one.
 *
 * The sheet is turned by clipping this layer to the region the paper no longer covers,
 * so the reveal is caused by the fold's geometry rather than an opacity fade. It starts
 * clipped to nothing, which means the browser has nothing to paint while idle and the
 * live site is untouched.
 *
 * It is `inert` and `aria-hidden`: a second copy of the page is a visual prop, and must
 * never be reachable by the keyboard, a screen reader or a pointer.
 */
export const ThemeRevealLayer = memo(function ThemeRevealLayer({
  theme,
  layerRef,
  contentRef,
  children,
}: ThemeRevealLayerProps) {
  return (
    <div
      ref={layerRef}
      className={cn(
        theme,
        // !important so pill/link transition utilities cannot outrank this and color-tween
        // when the reveal theme class flips under an empty clip.
        "pointer-events-none fixed inset-0 z-10 overflow-hidden [&_*]:!transition-none",
      )}
      style={{
        clipPath: "polygon(0px 0px, 0px 0px, 0px 0px)",
        visibility: "hidden",
        background: "var(--neutral-1)",
        color: "var(--neutral-8)",
      }}
      aria-hidden
      inert
    >
      <div ref={contentRef} className="absolute inset-x-0 top-0 will-change-transform">
        {children}
      </div>
    </div>
  );
});
