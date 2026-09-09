import { pageCurlConfig } from "./page-curl-config";
import { clamp01 } from "./page-curl-math";

/**
 * Damped-spring integration and release heuristics.
 *
 * Nothing here touches the DOM or React; the interaction hook owns a couple of mutable
 * spring states and steps them from its animation loop.
 */

export type SpringParams = { stiffness: number; damping: number };

export type SpringState = { value: number; velocity: number };

export function makeSpring(value: number): SpringState {
  return { value, velocity: 0 };
}

/** Longest integration step taken, to keep stiff springs stable on slow frames. */
const MAX_SUBSTEP = 1 / 240;

/** Frames longer than this are treated as a hitch rather than real elapsed time. */
export const MAX_FRAME_DELTA = 1 / 30;

export function stepSpring(
  state: SpringState,
  target: number,
  params: SpringParams,
  dt: number,
): void {
  let remaining = Math.min(dt, MAX_FRAME_DELTA);

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_SUBSTEP);
    const acceleration =
      (target - state.value) * params.stiffness - state.velocity * params.damping;

    state.velocity += acceleration * step;
    state.value += state.velocity * step;
    remaining -= step;
  }
}

export function springAtRest(
  state: SpringState,
  target: number,
  valueEpsilon = 0.05,
  velocityEpsilon = 0.5,
): boolean {
  return (
    Math.abs(target - state.value) < valueEpsilon &&
    Math.abs(state.velocity) < velocityEpsilon
  );
}

export function settleSpring(state: SpringState, value: number): void {
  state.value = value;
  state.velocity = 0;
}

/**
 * Rolling pointer-speed estimate.
 *
 * Uses a short window rather than the last two samples so a single stuttered frame
 * cannot masquerade as a flick.
 */
export class VelocityTracker {
  private samples: { value: number; time: number }[] = [];
  private readonly window: number;

  constructor(windowMs = 90) {
    this.window = windowMs;
  }

  reset(): void {
    this.samples.length = 0;
  }

  add(value: number, time: number): void {
    this.samples.push({ value, time });
    while (this.samples.length > 2 && time - this.samples[0].time > this.window) {
      this.samples.shift();
    }
  }

  /** Signed rate of change, in units per second. */
  velocity(): number {
    if (this.samples.length < 2) return 0;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const elapsed = (last.time - first.time) / 1000;

    if (elapsed <= 0) return 0;
    return (last.value - first.value) / elapsed;
  }
}

export type ReleaseOutcome = "commit" | "return";

/**
 * Whether letting go should finish the turn or spring back.
 *
 * Distance is the main signal, but a deliberate flick inward can finish a turn that is
 * slightly short, and a decisive pull back always cancels. That keeps the threshold from
 * feeling like an arbitrary tripwire.
 */
export function decideRelease(progress: number, distanceVelocity: number): ReleaseOutcome {
  const { completionThreshold, flick } = pageCurlConfig;

  if (distanceVelocity < -flick.velocity * 0.5) return "return";

  const assist =
    flick.maxAssist * clamp01(Math.max(distanceVelocity, 0) / flick.velocity);

  return progress >= completionThreshold - assist ? "commit" : "return";
}
