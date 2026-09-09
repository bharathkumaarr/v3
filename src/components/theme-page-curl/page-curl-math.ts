import { pageCurlConfig } from "./page-curl-config";

/**
 * Fold geometry for a sheet grabbed at its top-right corner.
 *
 * The sheet is modelled as an inextensible cylinder roll. Paper between the crease and
 * the grabbed corner wraps around a cylinder of radius `radius`; everything past the
 * crease stays perfectly flat. Because arc length is preserved the paper bends without
 * stretching, which is what separates this from a rubbery transform.
 *
 * Solving for the radius:
 *
 *   the corner sits `creaseDistance = radius * theta` of arc away from the crease, and
 *   after wrapping it lands `radius * sin(theta)` back along the fold axis, so its
 *   distance from the original corner is
 *
 *     radius * theta - radius * sin(theta) = distance
 *
 *   which gives `radius = distance / (theta - sin(theta))`.
 *
 * `theta` is chosen from how far the drag has travelled, so a short drag produces a wide
 * gentle curl and a long drag tightens into a page-turn crease. Because the corner lands
 * exactly `distance` away along the drag axis, it stays pinned under the pointer.
 */

export type Vec2 = { x: number; y: number };

export type Viewport = {
  width: number;
  height: number;
  diagonal: number;
};

export type FoldSolution = {
  /** Unit vector from the corner toward the pointer. */
  dirX: number;
  dirY: number;
  /** Cylinder radius at the grabbed corner. */
  radius: number;
  /** Total wrap angle. */
  theta: number;
  /** Perpendicular distance from the corner to the crease line. */
  creaseDistance: number;
  /** How much of the sheet has been turned, 0 to 1. */
  progress: number;
  /** True when the fold is small enough to ignore entirely. */
  flat: boolean;
};

const EPSILON = 0.01;

/**
 * The reveal starts this far behind the crease rather than exactly on it.
 *
 * The paper's alpha feathers in across a pixel or two for antialiasing, and the revealed
 * page is dark, so a reveal that began exactly at the crease would show through that
 * feather as a hairline along the fold. The offset region is well inside the flap's own
 * silhouette, so nothing is lost by hiding it.
 */
const REVEAL_INSET = 3;

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function makeViewport(width: number, height: number): Viewport {
  return { width, height, diagonal: Math.hypot(width, height) };
}

/** The grabbed corner, in page pixels with the origin at the viewport's top-left. */
export function cornerOf(viewport: Viewport): Vec2 {
  return { x: viewport.width, y: 0 };
}

/** Default fold direction: straight down the diagonal toward the opposite corner. */
export function defaultDirection(viewport: Viewport): Vec2 {
  const length = viewport.diagonal || 1;
  return { x: -viewport.width / length, y: viewport.height / length };
}

export function solveFold(
  distance: number,
  dirX: number,
  dirY: number,
  viewport: Viewport,
): FoldSolution {
  if (distance <= EPSILON) {
    return {
      dirX,
      dirY,
      radius: 0,
      theta: 0,
      creaseDistance: 0,
      progress: 0,
      flat: true,
    };
  }

  const { thetaMin, thetaMax } = pageCurlConfig.curl;
  const span = sheetSpan(dirX, dirY, viewport) || viewport.diagonal || 1;

  // Pre-estimate of progress. `creaseDistance` tracks `distance` closely, so using the
  // raw drag length here avoids a circular dependency without a visible difference.
  const ramp = smoothstep(0, 1, distance / span);
  const theta = thetaMin + (thetaMax - thetaMin) * ramp;

  const radius = distance / (theta - Math.sin(theta));
  const creaseDistance = radius * theta;

  return {
    dirX,
    dirY,
    radius,
    theta,
    creaseDistance,
    // Measured against the span rather than the diagonal, so the threshold means the
    // same thing whether the corner is pulled straight down or across the diagonal.
    progress: clamp01(creaseDistance / span),
    flat: false,
  };
}

/** Signed distance of a page-space point past the corner, measured along the fold axis. */
function axisDistance(point: Vec2, corner: Vec2, dirX: number, dirY: number): number {
  return (point.x - corner.x) * dirX + (point.y - corner.y) * dirY;
}

/**
 * How far the crease has to travel for the fold to have swept the whole viewport.
 *
 * The grabbed corner sits at axis distance zero and the fold direction is confined to
 * the down-left quadrant, so the far corner is always the last point reached.
 */
export function sheetSpan(dirX: number, dirY: number, viewport: Viewport): number {
  return viewport.width * Math.max(-dirX, 0) + viewport.height * Math.max(dirY, 0);
}

/**
 * The part of the viewport the sheet no longer covers, as a `clip-path` polygon.
 *
 * This is the viewport rectangle clipped to the half-plane past the crease line
 * (Sutherland–Hodgman against a single edge).
 */
export function revealPolygon(fold: FoldSolution, viewport: Viewport): string {
  const reach = fold.creaseDistance - REVEAL_INSET;
  if (fold.flat || reach <= 0) return "polygon(0px 0px, 0px 0px, 0px 0px)";

  const corner = cornerOf(viewport);
  const rect: Vec2[] = [
    { x: 0, y: 0 },
    { x: viewport.width, y: 0 },
    { x: viewport.width, y: viewport.height },
    { x: 0, y: viewport.height },
  ];

  // The turned side of the crease is the one holding the grabbed corner, which sits at
  // axis distance zero, so points inside the reveal are *below* the crease distance.
  const inside = (p: Vec2) => reach - axisDistance(p, corner, fold.dirX, fold.dirY);

  const output: Vec2[] = [];

  for (let i = 0; i < rect.length; i++) {
    const current = rect[i];
    const next = rect[(i + 1) % rect.length];
    const dCurrent = inside(current);
    const dNext = inside(next);

    if (dCurrent >= 0) output.push(current);

    if (dCurrent >= 0 !== dNext >= 0) {
      const t = dCurrent / (dCurrent - dNext);
      output.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }

  if (output.length < 3) return "polygon(0px 0px, 0px 0px, 0px 0px)";

  const points = output
    .map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`)
    .join(", ");

  return `polygon(${points})`;
}

/** True once the crease has swept past every viewport corner. */
export function coversViewport(fold: FoldSolution, viewport: Viewport): boolean {
  if (fold.flat) return false;
  return (
    fold.creaseDistance - REVEAL_INSET >= sheetSpan(fold.dirX, fold.dirY, viewport)
  );
}

/**
 * Drag distance at which the fold just covers the whole viewport.
 *
 * `creaseDistance` is close to proportional to `distance`, so a few fixed-point
 * iterations converge immediately. Called once per interaction, never per frame.
 */
export function distanceToCoverViewport(
  dirX: number,
  dirY: number,
  viewport: Viewport,
): number {
  const needed = sheetSpan(dirX, dirY, viewport);
  if (needed <= 0) return viewport.diagonal;

  let distance = needed;
  for (let i = 0; i < 5; i++) {
    const fold = solveFold(distance, dirX, dirY, viewport);
    const ratio = fold.creaseDistance / distance;
    if (!Number.isFinite(ratio) || ratio <= 0) break;
    distance = (needed / ratio) * 1.02;
  }

  return distance;
}

/** Clamp the pointer so the fold can never be driven into an impossible shape. */
export function clampPointer(pointer: Vec2, viewport: Viewport): Vec2 {
  const margin = viewport.diagonal * 0.25;
  return {
    x: clamp(pointer.x, -margin, viewport.width + margin),
    y: clamp(pointer.y, -margin, viewport.height + margin),
  };
}

/**
 * Fold distance and direction implied by a pointer position.
 *
 * The direction is constrained to the down-left quadrant: a sheet grabbed at the
 * top-right can only be folded inward, never off the page.
 */
export function foldFromPointer(pointer: Vec2, viewport: Viewport) {
  const corner = cornerOf(viewport);
  const raw = clampPointer(pointer, viewport);

  let dx = Math.min(raw.x - corner.x, 0);
  let dy = Math.max(raw.y - corner.y, 0);

  const length = Math.hypot(dx, dy);
  if (length < EPSILON) {
    const fallback = defaultDirection(viewport);
    return { distance: 0, dirX: fallback.x, dirY: fallback.y };
  }

  dx /= length;
  dy /= length;

  return {
    distance: length * pageCurlConfig.dragSensitivity,
    dirX: dx,
    dirY: dy,
  };
}
