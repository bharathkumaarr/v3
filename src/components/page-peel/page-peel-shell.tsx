"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { getPaperAudio } from "@/lib/paper-sounds";
import { cn } from "@/lib/cn";

const MIN_PEEL = 36;
const MAX_PEEL = 220;
const SNAP_DARK = 0.52;
const DRAG_THRESHOLD = 6;

type PagePeelShellProps = {
  children: ReactNode;
};

function peelClipPath(offset: number) {
  const x = Math.max(MIN_PEEL, offset);
  const y = Math.max(MIN_PEEL * 0.72, offset * 0.72);
  return `polygon(0 0, calc(100% - ${x}px) 0, 100% ${y}px, 100% 100%, 0 100%)`;
}

export function PagePeelShell({ children }: PagePeelShellProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [peel, setPeel] = useState(MIN_PEEL);
  const peelRef = useRef(MIN_PEEL);
  const [mounted, setMounted] = useState(false);
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0, peel: MIN_PEEL });
  const lastCrinkle = useRef(0);
  const audio = useRef<ReturnType<typeof getPaperAudio> | null>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    audio.current = getPaperAudio();
    audio.current.startAmbient();
    return () => audio.current?.stopAmbient();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const next = resolvedTheme === "dark" ? MAX_PEEL : MIN_PEEL;
    setPeel(next);
    peelRef.current = next;
  }, [mounted, resolvedTheme]);

  useEffect(() => {
    const syncScroll = () => {
      if (!underRef.current || syncing.current) return;
      syncing.current = true;
      underRef.current.scrollTop = window.scrollY;
      syncing.current = false;
    };

    window.addEventListener("scroll", syncScroll, { passive: true });
    syncScroll();
    return () => window.removeEventListener("scroll", syncScroll);
  }, [mounted]);

  const playCrinkleThrottled = useCallback((intensity: number) => {
    const now = Date.now();
    if (now - lastCrinkle.current < 70) return;
    lastCrinkle.current = now;
    audio.current?.playCrinkle(intensity);
  }, []);

  const applyTheme = useCallback(
    (dark: boolean) => {
      setTheme(dark ? "dark" : "light");
      const next = dark ? MAX_PEEL : MIN_PEEL;
      setPeel(next);
      peelRef.current = next;
      audio.current?.playRustle(dark ? 0.05 : 0.03);
    },
    [setTheme],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    moved.current = false;
    start.current = { x: event.clientX, y: event.clientY, peel };
    event.currentTarget.setPointerCapture(event.pointerId);
    audio.current?.playRustle(0.035);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const dx = start.current.x - event.clientX;
    const dy = event.clientY - start.current.y;
    if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) moved.current = true;

    const delta = Math.max(0, dx + dy * 0.65);
    const next = Math.min(MAX_PEEL, Math.max(MIN_PEEL, start.current.peel + delta));

    setPeel(next);
    peelRef.current = next;
    playCrinkleThrottled(Math.min(1, delta / 120));
  };

  const finishPeel = (value: number) => {
    const progress = (value - MIN_PEEL) / (MAX_PEEL - MIN_PEEL);
    applyTheme(progress >= SNAP_DARK);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    finishPeel(peelRef.current);
  };

  const onClick = () => {
    if (moved.current) return;
    applyTheme(resolvedTheme !== "dark");
  };

  if (!mounted) {
    return <div className="relative min-h-screen">{children}</div>;
  }

  const progress = (peel - MIN_PEEL) / (MAX_PEEL - MIN_PEEL);
  const foldSize = 56 + progress * 36;

  return (
    <div className="relative min-h-screen">
      <div
        ref={underRef}
        className="dark pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-neutral-1 text-neutral-8"
        aria-hidden="true"
      >
        <div className="min-h-screen">{children}</div>
      </div>

      <div
        className={cn(
          "light relative z-[2] min-h-screen bg-neutral-1 text-neutral-8",
          "transition-[clip-path] duration-150 ease-out",
        )}
        style={{ clipPath: peelClipPath(peel) }}
      >
        {children}
      </div>

      <div
        className="fixed top-0 right-0 z-[60] cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ width: foldSize * 2.2, height: foldSize * 2.2 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        role="button"
        aria-label="Peel the page corner to reveal dark mode"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            applyTheme(resolvedTheme !== "dark");
          }
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 origin-top-right"
          style={{
            width: foldSize * 1.65,
            height: foldSize * 1.65,
            perspective: "900px",
          }}
        >
          <div
            className={cn(
              "absolute top-0 right-0 border-b border-l border-neutral-3",
              "shadow-[(-8px)_10px_24px_rgba(19,27,32,0.16)]",
            )}
            style={{
              width: foldSize * 1.45,
              height: foldSize * 1.45,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              background:
                "linear-gradient(145deg, #ffffff 0%, #f4f6f8 38%, #e2e6ea 66%, #c8ced4 100%)",
              transform: `rotateX(${16 + progress * 20}deg) rotateY(${-20 - progress * 26}deg) rotateZ(${-2 - progress * 4}deg) translateZ(${10 + progress * 20}px)`,
              transformStyle: "preserve-3d",
            }}
          />
          <div
            className="absolute top-0 right-0 bg-neutral-8/12"
            style={{
              width: foldSize * 0.5,
              height: foldSize * 0.5,
              clipPath: "polygon(100% 0, 100% 100%, 0 0)",
              filter: "blur(0.5px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
