"use client";

import { useEffect, type RefObject } from "react";
import { pageCurlConfig } from "./page-curl-config";
import type { Viewport } from "./page-curl-math";
import { PaperRenderer } from "./paper-renderer";

type Options = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Owned by the caller so the animation loop can reach the renderer directly. */
  rendererRef: RefObject<PaperRenderer | null>;
  viewport: Viewport;
  enabled: boolean;
  /** Called if the context is lost or never came up, so the caller can fall back. */
  onUnavailable: () => void;
};

/** Fewer segments on phones and low-core machines; the curl is smaller there anyway. */
function meshSegments(): number {
  const { segments, lowPowerSegments } = pageCurlConfig.mesh;

  const cores = navigator.hardwareConcurrency ?? 8;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return cores <= 4 || coarsePointer ? lowPowerSegments : segments;
}

/**
 * Owns the three.js renderer's lifecycle.
 *
 * The renderer lands in a ref so the animation loop can push uniforms into it without
 * going through React.
 */
export function usePaperRenderer({
  canvasRef,
  rendererRef,
  viewport,
  enabled,
  onUnavailable,
}: Options) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    let renderer: PaperRenderer;
    try {
      renderer = new PaperRenderer(canvas, meshSegments());
    } catch {
      onUnavailable();
      return;
    }

    rendererRef.current = renderer;

    const handleContextLost = (event: Event) => {
      // Preventing the default lets the browser attempt a restore, but the sheet is gone
      // for this session either way, so hand over to the DOM fallback.
      event.preventDefault();
      onUnavailable();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      rendererRef.current = null;
      renderer.dispose();
    };
  }, [canvasRef, enabled, onUnavailable, rendererRef]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.setViewport(
      viewport.width,
      viewport.height,
      Math.min(window.devicePixelRatio || 1, 2),
    );
  }, [rendererRef, viewport]);
}
