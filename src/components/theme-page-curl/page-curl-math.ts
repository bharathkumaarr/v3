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

/**
 * Fold direction the corner rests at when nothing is pulling it.
 *
 * Forty-five degrees inward rather than along the viewport diagonal. A dog-ear folds
 * about the bisector of the two edges that meet at the corner, so the roll comes off the
 * top and right edges by the same amount; aiming at the opposite corner instead skews
 * the roll flatter the wider the window gets, and it stops reading as a corner.
 */
export function defaultDirection(): Vec2 {
  return { x: -Math.SQRT1_2, y: Math.SQRT1_2 };
}

/**
 * Wrap angle that lifts the corner `x` radii away from the crease.
 *
 * Inverts `theta - sin(theta) = x`, which has no closed form. The function is monotonic
 * over the range we allow, so Newton converges in a handful of steps from the small-angle
 * seed `cbrt(6x)`, taken from `theta - sin(theta) ~= theta^3 / 6`.
 */
function wrapAngle(x: number, maxAngle: number): number {
  if (x <= 0) return 0;
  if (x >= maxAngle - Math.sin(maxAngle)) return maxAngle;

  let theta = Math.min(Math.cbrt(6 * x), maxAngle);

  for (let i = 0; i < 8; i++) {
    const slope = 1 - Math.cos(theta);
    if (slope < 1e-6) break;

    const next = theta - (theta - Math.sin(theta) - x) / slope;
    if (!Number.isFinite(next)) break;

    theta = clamp(next, 1e-4, maxAngle);
  }

  return theta;
}

/** Widest the roll is allowed to get, so it stays a band rather than a whole screen. */
function maxRadius(viewport: Viewport): number {
  const { radiusMaxPx, radiusMaxRatio } = pageCurlConfig.curl;
  return Math.min(radiusMaxPx, viewport.diagonal * radiusMaxRatio);
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

  const { restWrap, maxAngle } = pageCurlConfig.curl;
  const span = sheetSpan(dirX, dirY, viewport) || viewport.diagonal || 1;

  // Pick the radius and let the wrap angle follow, rather than the other way round. The
  // radius is the thing you actually see -- head-on, the roll is exactly one radius wide
  // -- so driving the angle instead lets a long pull inflate the roll without limit
  // until the curl stops being a roll of paper and becomes a gradient across the page.
  //
  // While the roll still has room it holds `restWrap`, which fixes its proportions: the
  // strip of revealed page behind it is `radius * (restWrap - 1)`. Once it hits its
  // ceiling it stops fattening and starts wrapping tighter instead, which is what a page
  // actually does as it is turned.
  const radius = Math.min(distance / (restWrap - Math.sin(restWrap)), maxRadius(viewport));
  const theta = wrapAngle(distance / radius, maxAngle);

  // Past the angle ceiling the roll cannot tighten any further, so the remaining lift is
  // taken up by a straight flap leaving the roll along the tangent. Without this the tip
  // would fall short of the pointer on a long drag.
  const wrapped = radius * (theta - Math.sin(theta));
  const tangent = 1 - Math.cos(theta);
  const overshoot = tangent > 1e-6 ? Math.max(distance - wrapped, 0) / tangent : 0;

  const creaseDistance = radius * theta + overshoot;

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
 * `creaseDistance` is close to affine in `distance`, so fixed-point iteration converges
 * quickly. Called once per interaction, never per frame.
 *
 * Note this is well beyond the viewport: once the roll stops fattening the crease
 * advances at roughly half the rate of the pull, which is also true of turning a real
 * page, where the corner travels about twice the width of the sheet. The committed turn
 * is animated rather than dragged, so the pointer never has to get there.
 */
export function distanceToCoverViewport(
  dirX: number,
  dirY: number,
  viewport: Viewport,
): number {
  const needed = sheetSpan(dirX, dirY, viewport);
  if (needed <= 0) return viewport.diagonal;

  let distance = needed;
  for (let i = 0; i < 10; i++) {
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
    const fallback = defaultDirection();
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
