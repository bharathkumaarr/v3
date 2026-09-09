"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { grabZoneRadius, pageCurlConfig } from "./page-curl-config";
import {
  clamp,
  coversViewport,
  defaultDirection,
  distanceToCoverViewport,
  foldFromPointer,
  makeViewport,
  smoothstep,
  solveFold,
  type FoldSolution,
  type Viewport,
} from "./page-curl-math";
import {
  MAX_FRAME_DELTA,
  VelocityTracker,
  decideRelease,
  makeSpring,
  settleSpring,
  springAtRest,
  stepSpring,
  type SpringParams,
} from "./page-curl-physics";

export type CurlPhase = "idle" | "hover" | "drag" | "commit" | "settling";

type Options = {
  /** Element that accepts the press. Listeners are attached natively, not via React. */
  grabRef: React.RefObject<HTMLElement | null>;
  /** False when reduced motion is requested or WebGL is unavailable. */
  enabled: boolean;
  /** Called every animation frame with the current fold. Must not trigger a render. */
  onFrame: (fold: FoldSolution, viewport: Viewport) => void;
  /** Flip the real theme. Called once the fold has covered the viewport. */
  onCommit: () => void;
  /** True once the DOM actually reflects the committed theme. */
  isThemeApplied: () => boolean;
  /** Re-point the reveal layer at the new opposite theme, after the fold has collapsed. */
  onSyncReveal: () => void;
  /** Keeps the reveal layer's scroll offset aligned with the document. */
  onSyncScroll: () => void;
  /** Cursor affordance only; fires on phase transitions, not per frame. */
  onPhaseChange?: (phase: CurlPhase) => void;
};

/** Guard so a stuck theme write can never freeze the page mid-turn. */
const SETTLE_TIMEOUT_MS = 700;
/** Pause at fully flat before the new resting dog-ear eases back in. */
const REVEAL_SWAP_HOLD_MS = 90;
/** Aim past bare coverage so the committed turn finishes briskly. */
const COMMIT_OVERSHOOT = 1.18;

export function usePageCurl({
  grabRef,
  enabled,
  onFrame,
  onCommit,
  isThemeApplied,
  onSyncReveal,
  onSyncScroll,
  onPhaseChange,
}: Options) {
  const [viewport, setViewport] = useState<Viewport>(() => makeViewport(1, 1));
  const [grabRadius, setGrabRadius] = useState<number>(pageCurlConfig.grabZone.min);

  const viewportRef = useRef(viewport);
  const phaseRef = useRef<CurlPhase>("idle");

  // Fold distance and fold direction, each integrated as a damped spring.
  const distance = useRef(makeSpring(0));
  const angle = useRef(makeSpring(Math.PI * 0.75));

  const distanceTarget = useRef(0);
  const angleTarget = useRef(Math.PI * 0.75);
  const activeSpring = useRef<SpringParams>(pageCurlConfig.returnSpring);

  const pointer = useRef({ x: 0, y: 0, seen: false });
  const pointerId = useRef<number | null>(null);
  const velocity = useRef(new VelocityTracker());

  const commitTarget = useRef(0);
  const settleStartedAt = useRef(0);
  const holdUntil = useRef(0);

  const rafRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);
  const restingFrames = useRef(0);

  /** Reassigned each render so the loop always sees current callbacks. */
  const tickRef = useRef<(dt: number, now: number) => boolean>(() => true);

  const setPhase = useCallback(
    (next: CurlPhase) => {
      if (phaseRef.current === next) return;
      phaseRef.current = next;
      onPhaseChange?.(next);
    },
    [onPhaseChange],
  );

  const wake = useCallback(() => {
    if (!enabled) return;
    restingFrames.current = 0;
    if (rafRef.current != null) return;

    lastFrameTime.current = performance.now();
    rafRef.current = requestAnimationFrame(function step(now: number) {
      const elapsed = Math.min((now - lastFrameTime.current) / 1000, MAX_FRAME_DELTA);
      lastFrameTime.current = now;

      if (tickRef.current(elapsed, now)) {
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    });
  }, [enabled]);

  /* ------------------------------------------------------------------ viewport */

  useEffect(() => {
    const measure = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const next = makeViewport(width, height);

      viewportRef.current = next;
      setViewport(next);
      setGrabRadius(grabZoneRadius(width, height));
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  /* --------------------------------------------------------------- animation */

  tickRef.current = (dt: number, now: number): boolean => {
    const view = viewportRef.current;
    const phase = phaseRef.current;

    if (phase === "drag") {
      const fold = foldFromPointer(pointer.current, view);
      distanceTarget.current = fold.distance;
      angleTarget.current = Math.atan2(fold.dirY, fold.dirX);
      activeSpring.current = pageCurlConfig.dragSpring;
      velocity.current.add(fold.distance, now);
    } else if (phase === "commit" || phase === "settling") {
      // While settling we hold at full coverage: the screen already shows the revealed
      // theme, so the real theme can be swapped underneath with nothing to see.
      distanceTarget.current = commitTarget.current;
      activeSpring.current = pageCurlConfig.commitSpring;
    } else {
      const { idleCurl, hoverCurl } = pageCurlConfig.affordance;
      const radius = grabZoneRadius(view.width, view.height);
      const reach = pointer.current.seen
        ? Math.hypot(view.width - pointer.current.x, pointer.current.y)
        : Number.POSITIVE_INFINITY;
      const proximity =
        1 - smoothstep(radius, radius + pageCurlConfig.hoverZone.padding, reach);

      const resting = idleCurl + (hoverCurl - idleCurl) * proximity;
      distanceTarget.current = now < holdUntil.current ? 0 : resting;

      // The corner steers toward the pointer as it comes closer, and relaxes back onto
      // the diagonal once the pointer leaves.
      const fallback = defaultDirection(view);
      const restAngle = Math.atan2(fallback.y, fallback.x);
      const toward = foldFromPointer(pointer.current, view);
      const pointerAngle =
        toward.distance > 1 ? Math.atan2(toward.dirY, toward.dirX) : restAngle;

      angleTarget.current = restAngle + (pointerAngle - restAngle) * proximity;
      activeSpring.current =
        proximity > 0.01 ? pageCurlConfig.hoverSpring : pageCurlConfig.returnSpring;
    }

    stepSpring(distance.current, distanceTarget.current, activeSpring.current, dt);
    stepSpring(angle.current, angleTarget.current, activeSpring.current, dt);

    const foldAngle = clamp(angle.current.value, Math.PI / 2, Math.PI);
    const fold = solveFold(
      Math.max(0, distance.current.value),
      Math.cos(foldAngle),
      Math.sin(foldAngle),
      view,
    );

    onSyncScroll();
    onFrame(fold, view);

    if (phase === "commit" && coversViewport(fold, view)) {
      setPhase("settling");
      settleStartedAt.current = now;
      onCommit();
    } else if (phase === "settling") {
      const timedOut = now - settleStartedAt.current > SETTLE_TIMEOUT_MS;
      if (isThemeApplied() || timedOut) {
        // Collapse instantly while the revealed theme still fills the screen, so the
        // handoff to the real DOM lands on identical pixels.
        settleSpring(distance.current, 0);
        settleSpring(angle.current, angleTarget.current);
        holdUntil.current = now + REVEAL_SWAP_HOLD_MS;
        onSyncReveal();
        setPhase("idle");
      }
    }

    const settled =
      phaseRef.current !== "drag" &&
      phaseRef.current !== "commit" &&
      phaseRef.current !== "settling" &&
      now >= holdUntil.current &&
      springAtRest(distance.current, distanceTarget.current) &&
      springAtRest(angle.current, angleTarget.current, 0.002, 0.02);

    if (!settled) {
      restingFrames.current = 0;
      return false;
    }

    restingFrames.current += 1;
    if (restingFrames.current < pageCurlConfig.idleFramesBeforePark) return false;

    // Land exactly on the target so the parked canvas is pixel-stable.
    settleSpring(distance.current, distanceTarget.current);
    settleSpring(angle.current, angleTarget.current);

    const parkedAngle = clamp(angleTarget.current, Math.PI / 2, Math.PI);
    onFrame(
      solveFold(
        Math.max(0, distanceTarget.current),
        Math.cos(parkedAngle),
        Math.sin(parkedAngle),
        view,
      ),
      view,
    );

    return true;
  };

  /* ---------------------------------------------------------------- pointers */

  const releaseCapture = useCallback(
    (id: number) => {
      try {
        grabRef.current?.releasePointerCapture(id);
      } catch {
        // Capture was already released, e.g. the browser cancelled the pointer.
      }
    },
    [grabRef],
  );

  const cancelInteraction = useCallback(() => {
    if (pointerId.current != null) releaseCapture(pointerId.current);
    pointerId.current = null;
    velocity.current.reset();

    if (phaseRef.current === "drag") setPhase("hover");
    wake();
  }, [releaseCapture, setPhase, wake]);

  useEffect(() => {
    if (!enabled) return;

    const trackProximity = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.seen = true;

      const phase = phaseRef.current;
      if (phase === "commit" || phase === "settling") return;
      if (phase === "drag") {
        wake();
        return;
      }

      const view = viewportRef.current;
      const reach = Math.hypot(view.width - event.clientX, event.clientY);
      const radius =
        grabZoneRadius(view.width, view.height) + pageCurlConfig.hoverZone.padding;

      setPhase(reach <= radius ? "hover" : "idle");
      wake();
    };

    window.addEventListener("pointermove", trackProximity, { passive: true });
    return () => window.removeEventListener("pointermove", trackProximity);
  }, [enabled, setPhase, wake]);

  useEffect(() => {
    const element = grabRef.current;
    if (!enabled || !element) return;

    const onPointerDown = (event: PointerEvent) => {
      // Never let a second gesture interrupt a turn that is already completing.
      const phase = phaseRef.current;
      if (phase === "commit" || phase === "settling") return;
      if (pointerId.current != null) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerId.current = event.pointerId;
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.seen = true;

      velocity.current.reset();
      element.setPointerCapture(event.pointerId);
      setPhase("drag");
      onSyncScroll();
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;

      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      // Stops a touch drag from scrolling, without ever disabling scroll globally.
      if (event.cancelable) event.preventDefault();
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;

      pointerId.current = null;
      releaseCapture(event.pointerId);

      const view = viewportRef.current;
      const foldAngle = clamp(angle.current.value, Math.PI / 2, Math.PI);
      const dirX = Math.cos(foldAngle);
      const dirY = Math.sin(foldAngle);
      const fold = solveFold(Math.max(0, distance.current.value), dirX, dirY, view);

      const outcome = decideRelease(fold.progress, velocity.current.velocity());
      velocity.current.reset();

      if (outcome === "commit") {
        commitTarget.current =
          distanceToCoverViewport(dirX, dirY, view) * COMMIT_OVERSHOOT;
        // Carry the drag's momentum into the rest of the turn.
        distance.current.velocity = Math.max(distance.current.velocity, 0);
        setPhase("commit");
      } else {
        setPhase("hover");
      }

      wake();
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId.current) return;
      cancelInteraction();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove, { passive: false });
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("lostpointercapture", onPointerCancel);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("lostpointercapture", onPointerCancel);
    };
  }, [cancelInteraction, enabled, grabRef, onSyncScroll, releaseCapture, setPhase, wake]);

  /* ------------------------------------------------------------- interruptions */

  useEffect(() => {
    if (!enabled) return;

    const bail = () => {
      if (phaseRef.current === "drag") cancelInteraction();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") bail();
    };

    window.addEventListener("blur", bail);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("blur", bail);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cancelInteraction, enabled]);

  /** A resize mid-drag invalidates the geometry the gesture started from. */
  useEffect(() => {
    if (phaseRef.current === "drag") cancelInteraction();
    else wake();
  }, [cancelInteraction, viewport, wake]);

  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => onSyncScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, onSyncScroll]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  const isBusy = useCallback(
    () => phaseRef.current === "commit" || phaseRef.current === "settling",
    [],
  );

  return { viewport, grabRadius, phaseRef, wake, isBusy };
}
