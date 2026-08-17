"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useTheme } from "next-themes";
import { getPaperAudio } from "@/lib/paper-sounds";
import {
  PEEL_MAX,
  PEEL_SNAP,
  buildFoldGeometry,
  peelFromPointerDelta,
  peelProgress,
  visualPeelAmount,
} from "@/lib/peel-math";
import { cn } from "@/lib/cn";
import { PaperFold } from "./paper-fold";

const DRAG_THRESHOLD = 5;
const SPRING = { type: "spring" as const, stiffness: 360, damping: 32, mass: 0.85 };
const subscribeMounted = (onStoreChange: () => void) => {
  queueMicrotask(onStoreChange);
  return () => {};
};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

type PagePeelShellProps = {
  children: ReactNode;
};

function useViewport() {
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

export function PagePeelShell({ children }: PagePeelShellProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const viewport = useViewport();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

  const peel = useMotionValue(0);
  const clipPath = useTransform(peel, (value) => {
    const geo = buildFoldGeometry(value, viewport.w, viewport.h);
    return `path('${geo.pagePath}')`;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [displayPeel, setDisplayPeel] = useState(0);

  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0, peel: 0 });
  const lastCrinkle = useRef(0);
  const audio = useRef<ReturnType<typeof getPaperAudio> | null>(null);
  const underRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    audio.current = getPaperAudio();
    audio.current.startAmbient();
    return () => audio.current?.stopAmbient();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!mounted) return;
    const target = resolvedTheme === "dark" ? PEEL_MAX : 0;
    peel.set(target);
  }, [mounted, resolvedTheme, peel]);

  useEffect(() => {
    const syncScroll = () => {
      if (underRef.current) underRef.current.scrollTop = window.scrollY;
    };
    window.addEventListener("scroll", syncScroll, { passive: true });
    syncScroll();
    return () => window.removeEventListener("scroll", syncScroll);
  }, [mounted]);

  useEffect(() => peel.on("change", (value) => setDisplayPeel(value)), [peel]);

  const playCrinkle = useCallback((intensity: number) => {
    const now = Date.now();
    if (now - lastCrinkle.current < 65) return;
    lastCrinkle.current = now;
    audio.current?.playCrinkle(intensity);
  }, []);

  const snapTo = useCallback(
    (dark: boolean) => {
      const target = dark ? PEEL_MAX : 0;
      setTheme(dark ? "dark" : "light");
      audio.current?.playRustle(dark ? 0.045 : 0.03);

      if (prefersReducedMotion) {
        peel.set(target);
        return;
      }

      void animate(peel, target, SPRING);
    },
    [peel, prefersReducedMotion, setTheme],
  );

  const finishDrag = useCallback(
    (value: number) => snapTo(peelProgress(value) >= PEEL_SNAP),
    [snapTo],
  );

  useEffect(() => {
    if (!isDragging) return;

    const finish = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
      finishDrag(peel.get());
    };

    window.addEventListener("pointerup", finish);
    window.addEventListener("blur", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("blur", finish);
    };
  }, [finishDrag, isDragging, peel]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    moved.current = false;
    setIsDragging(true);
    start.current = { x: event.clientX, y: event.clientY, peel: peel.get() };
    event.currentTarget.setPointerCapture(event.pointerId);
    audio.current?.playRustle(0.03);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const dx = start.current.x - event.clientX;
    const dy = event.clientY - start.current.y;
    if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) moved.current = true;

    peel.set(peelFromPointerDelta(dx, dy, start.current.peel));
    playCrinkle(Math.min(1, (Math.abs(dx) + Math.abs(dy)) / 130));
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    finishDrag(peel.get());
  };

  const onClick = () => {
    if (moved.current) return;
    snapTo(resolvedTheme !== "dark");
  };

  if (!mounted) {
    return <div className="relative min-h-screen">{children}</div>;
  }

  const hitSize = visualPeelAmount(displayPeel) + 56;
  const peelProgressValue = peelProgress(displayPeel);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-clip bg-neutral-1 transition-colors duration-300",
        isDragging && "cursor-grabbing",
      )}
      style={{ "--peel-progress": peelProgressValue } as CSSProperties}
    >
      <div
        ref={underRef}
        className="dark pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-neutral-1 text-neutral-8"
        aria-hidden
      >
        <div className="min-h-screen">{children}</div>
      </div>

      <motion.div
        className="light relative z-[2] min-h-screen bg-neutral-1 text-neutral-8 shadow-[0_0_60px_rgba(19,27,32,0.035)]"
        style={{ clipPath }}
      >
        {children}
      </motion.div>

      <div className="pointer-events-none fixed top-0 right-0 z-[40]">
        <PaperFold
          peel={visualPeelAmount(displayPeel)}
          viewportW={viewport.w}
          viewportH={viewport.h}
          clipPeel={displayPeel}
          isDragging={isDragging}
          reducedMotion={!!prefersReducedMotion}
        />
      </div>

      <div
        className={cn(
          "fixed top-0 right-0 z-[50] cursor-grab touch-none select-none active:cursor-grabbing",
        )}
        style={{ width: hitSize + 40, height: hitSize + 40 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        role="button"
        aria-label="Peel the corner to switch theme"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            snapTo(resolvedTheme !== "dark");
          }
        }}
      />
    </div>
  );
}
