"use client";

import { useEffect, type ReactNode } from "react";
import { initClickAudio, playClickSound } from "@/lib/sound";

function isClickableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  // 1. Explicitly exclude page curl or theme switching interactions
  if (
    target.closest(
      '[data-page-curl], [data-no-click-sound], [data-theme-toggle]'
    )
  ) {
    return false;
  }

  // Also check if clicking a theme switch button or page turn button
  const button = target.closest("button");
  if (button) {
    const text = button.textContent?.toLowerCase() || "";
    const aria = button.getAttribute("aria-label")?.toLowerCase() || "";
    if (
      text.includes("turn the page") ||
      text.includes("theme") ||
      aria.includes("theme") ||
      aria.includes("turn the page")
    ) {
      return false;
    }
  }

  // 2. Semantic clickable elements or elements with interactive roles/attributes
  const interactive = target.closest(
    'a, button, [role="button"], [role="link"], [role="tab"], summary, input[type="button"], input[type="submit"], [data-clickable]'
  );
  if (interactive) return true;

  // 3. Styled clickable elements (e.g. elements with cursor: pointer)
  let curr: Element | null = target;
  let depth = 0;
  while (curr && depth < 3 && curr !== document.body && curr !== document.documentElement) {
    try {
      const style = window.getComputedStyle(curr);
      if (style.cursor === "pointer") {
        return true;
      }
    } catch {
      break;
    }
    curr = curr.parentElement;
    depth++;
  }

  return false;
}

export function ClickSoundProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Eagerly preload and decode sound buffer
    initClickAudio();

    const handleClick = (event: MouseEvent) => {
      // Only process primary clicks (left mouse button or keyboard activation)
      if (event.button !== 0) return;

      if (isClickableElement(event.target)) {
        playClickSound();
      }
    };

    // Attach to capture phase so we catch the click before any stopPropagation
    window.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return <>{children}</>;
}
