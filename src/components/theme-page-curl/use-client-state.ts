"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Small `useSyncExternalStore` helpers for values that only exist in the browser.
 *
 * Reading these through a store rather than `useEffect` + `setState` keeps the server
 * snapshot explicit and avoids a cascading render on mount.
 */

const noopSubscribe = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

/** False during SSR and the hydrating render, true from then on. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, alwaysTrue, alwaysFalse);
}

const mediaCache = new Map<string, MediaQueryList>();

function mediaFor(query: string): MediaQueryList {
  let media = mediaCache.get(query);
  if (!media) {
    media = window.matchMedia(query);
    mediaCache.set(query, media);
  }
  return media;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = mediaFor(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => mediaFor(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, alwaysFalse);
}
