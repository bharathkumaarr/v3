"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { revealPolygon, type FoldSolution, type Viewport } from "./page-curl-math";
import { PaperAudio } from "./paper-audio";
import type { PaperRenderer } from "./paper-renderer";
import { ThemeFlipButton } from "./theme-flip-button";
import { ThemeRevealLayer } from "./theme-reveal-layer";
import { useHydrated, useMediaQuery } from "./use-client-state";
import { usePageCurl, type CurlPhase } from "./use-page-curl";
import { usePaperRenderer } from "./use-paper-renderer";

type ThemeName = "light" | "dark";

const EMPTY_CLIP = "polygon(0px 0px, 0px 0px, 0px 0px)";

/**
 * Percentage polygons for the no-WebGL path. Both have three points so `clip-path`
 * interpolates between them, giving a diagonal turn rather than a fade.
 */
const WIPE_CLOSED = "polygon(100% 0%, 100% 0%, 100% 0%)";
const WIPE_OPEN = "polygon(-120% 0%, 100% 0%, 100% 220%)";

function appliedTheme(): ThemeName {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Resolves once the theme system has actually written the class onto the document. */
function waitForTheme(theme: ThemeName, timeoutMs = 700): Promise<void> {
  return new Promise((resolve) => {
    const deadline = performance.now() + timeoutMs;

    const check = () => {
      if (appliedTheme() === theme || performance.now() > deadline) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };

    check();
  });
}

/**
 * Turns the whole site over like a sheet of paper to switch themes.
 *
 * Three layers, from the back forward:
 *
 *   1. the real site, untouched normal-flow DOM in the live theme
 *   2. a clipped copy of it in the other theme, revealed by the fold's geometry
 *   3. a transparent WebGL canvas that draws the curled paper and its shadow
 *
 * Nothing about the site itself is transformed into 3D. The canvas only ever draws the
 * lifted flap, which is why the content stays real text and stays interactive.
 *
 * The paper's front face is painted with the live theme's page background rather than a
 * rasterised snapshot of the DOM. Texturing the live DOM would mean rasterising it every
 * frame, which costs blurry text and a stalled main thread; because the grabbed corner
 * sits in empty page background, painting the flat background colour is an exact match
 * for what the paper would be carrying there.
 */
export function ThemePageCurl({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useHydrated();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [webglFailed, setWebglFailed] = useState(false);
  const [revealTheme, setRevealTheme] = useState<ThemeName>("dark");

  const layerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grabRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PaperRenderer | null>(null);

  const pendingTheme = useRef<ThemeName | null>(null);
  const fallbackBusy = useRef(false);
  // Stable for the lifetime of the shell. Construction is cheap and does not open an
  // AudioContext; that waits for the first press so the browser allows it.
  const [audio] = useState(() => new PaperAudio());

  const theme: ThemeName = resolvedTheme === "dark" ? "dark" : "light";
  const interactive = mounted && !webglFailed && !reducedMotion;

  useEffect(() => {
    // Reduced motion skips the physical turn, so it skips the paper sounds with it.
    audio.setEnabled(!reducedMotion);
  }, [audio, reducedMotion]);

  useEffect(() => () => audio.dispose(), [audio]);

  /**
   * WebGL is assumed available and disproved on first contact, rather than probed with a
   * throwaway context. Renderer construction throws synchronously on a failed context,
   * so the fallback takes over before anything has been drawn.
   */
  const handleUnavailable = useCallback(() => setWebglFailed(true), []);

  /* ------------------------------------------------------------ frame plumbing */

  const syncScroll = useCallback(() => {
    const content = contentRef.current;
    if (content) {
      content.style.transform = `translate3d(0, ${-window.scrollY}px, 0)`;
    }
  }, []);

  const syncRevealTheme = useCallback(() => {
    setRevealTheme(appliedTheme() === "dark" ? "light" : "dark");
    pendingTheme.current = null;
  }, []);

  const handleFrame = useCallback((fold: FoldSolution, viewport: Viewport) => {
    const layer = layerRef.current;
    if (layer) layer.style.clipPath = revealPolygon(fold, viewport);

    rendererRef.current?.draw({
      dirX: fold.dirX,
      dirY: fold.dirY,
      creaseDistance: fold.creaseDistance,
      radius: fold.radius,
      progress: fold.progress,
    });
  }, []);

  const handleCommit = useCallback(() => {
    const next: ThemeName = theme === "dark" ? "light" : "dark";
    pendingTheme.current = next;
    setTheme(next);
  }, [setTheme, theme]);

  const isThemeApplied = useCallback(() => {
    const wanted = pendingTheme.current;
    return wanted == null || appliedTheme() === wanted;
  }, []);

  const handlePhaseChange = useCallback((phase: CurlPhase) => {
    const element = grabRef.current;
    if (element) element.style.cursor = phase === "drag" ? "grabbing" : "grab";
  }, []);

  const { viewport, grabRadius, wake, isBusy } = usePageCurl({
    grabRef,
    enabled: interactive,
    onFrame: handleFrame,
    onCommit: handleCommit,
    isThemeApplied,
    onSyncReveal: syncRevealTheme,
    onSyncScroll: syncScroll,
    onPhaseChange: handlePhaseChange,
    audio: audio,
  });

  usePaperRenderer({
    canvasRef,
    rendererRef,
    viewport,
    enabled: interactive,
    onUnavailable: handleUnavailable,
  });

  /** Without the canvas there is no flap to hide the reveal, so it must sit flat. */
  useEffect(() => {
    if (interactive) return;
    const layer = layerRef.current;
    if (layer) layer.style.clipPath = EMPTY_CLIP;
  }, [interactive]);

  /* ------------------------------------------------------------------- colours */

  useEffect(() => {
    const renderer = rendererRef.current;
    const layer = layerRef.current;
    if (!renderer || !layer) return;

    // Read straight from the cascade so the paper tracks the palette rather than
    // duplicating it. The layer carries the opposite theme's class.
    const front = getComputedStyle(document.documentElement).getPropertyValue("--neutral-1");
    const back = getComputedStyle(layer).getPropertyValue("--neutral-1");

    renderer.setThemeColors(front, back);
    wake();
  }, [rendererRef, resolvedTheme, revealTheme, viewport, wake]);

  /** Keeps the reveal layer opposite the live theme, except mid-turn where it is frozen. */
  useEffect(() => {
    if (!resolvedTheme) return;
    if (isBusy() || fallbackBusy.current) return;
    setRevealTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [isBusy, resolvedTheme]);

  /* ------------------------------------------------------------------ fallback */

  /**
   * Used for the keyboard control, and as the whole interaction when WebGL is missing or
   * reduced motion is requested: a short diagonal turn of the same reveal layer.
   */
  const runFallbackFlip = useCallback(async () => {
    if (fallbackBusy.current || isBusy()) return;

    const next: ThemeName = theme === "dark" ? "light" : "dark";
    const layer = layerRef.current;

    if (!layer) {
      setTheme(next);
      return;
    }

    fallbackBusy.current = true;
    syncScroll();
    audio.unlock();
    audio.turn();

    const animation = layer.animate(
      [{ clipPath: WIPE_CLOSED }, { clipPath: WIPE_OPEN }],
      {
        duration: reducedMotion ? 200 : 460,
        easing: "cubic-bezier(0.32, 0, 0.24, 1)",
        fill: "forwards",
      },
    );

    try {
      await animation.finished;
    } catch {
      // Cancelled by a resize or unmount; fall through and settle the theme anyway.
    }

    pendingTheme.current = next;
    setTheme(next);
    await waitForTheme(next);

    // Swap under cover: the revealed copy fills the screen and already matches the new
    // theme, so dropping back to the real DOM is a no-op on screen.
    layer.style.clipPath = EMPTY_CLIP;
    animation.cancel();
    syncRevealTheme();

    fallbackBusy.current = false;
  }, [audio, isBusy, reducedMotion, setTheme, syncRevealTheme, syncScroll, theme]);

  const handleFallbackPointer = useCallback(() => {
    if (interactive) return;
    void runFallbackFlip();
  }, [interactive, runFallbackFlip]);

  /* --------------------------------------------------------------------- render */

  return (
    <>
      {children}

      {mounted && (
        <>
          <ThemeRevealLayer
            theme={revealTheme}
            layerRef={layerRef}
            contentRef={contentRef}
          >
            {children}
          </ThemeRevealLayer>

          {interactive && (
            <canvas
              ref={canvasRef}
              className="pointer-events-none fixed inset-0 z-20 h-full w-full"
              aria-hidden
            />
          )}

          <div
            ref={grabRef}
            className="fixed top-0 right-0 z-30 touch-none select-none"
            style={{
              width: grabRadius,
              height: grabRadius,
              cursor: interactive ? "grab" : "pointer",
            }}
            onClick={handleFallbackPointer}
            aria-hidden
          />

          <ThemeFlipButton
            isDark={theme === "dark"}
            onFlip={() => void runFallbackFlip()}
          />
        </>
      )}
    </>
  );
}
