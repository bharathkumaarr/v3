/**
 * Every tunable for the paper-curl theme switcher.
 *
 * Units are CSS pixels and seconds unless stated otherwise. Angles are radians.
 */
export const pageCurlConfig = {
  /** Radius around the top-right corner that accepts a press, clamped by viewport size. */
  grabZone: {
    min: 82,
    max: 138,
    viewportRatio: 0.11,
  },

  /** Extra radius beyond the grab zone where the corner starts lifting on approach. */
  hoverZone: {
    padding: 120,
  },

  /** Resting affordance. `idle` shows with no pointer nearby, `hover` when the pointer is on the corner. */
  affordance: {
    idleCurl: 15,
    hoverCurl: 34,
  },

  /**
   * Shape of the fold.
   *
   * `theta` is the total angle the paper wraps through. Low values give a wide, gentle
   * curl (the resting dog-ear); high values tighten the bend into something closer to a
   * crease, which is what a real page looks like once it is being turned over.
   */
  curl: {
    thetaMin: 1.92,
    thetaMax: 3.32,
    /** Hard stop so the sheet can never spiral into itself. */
    maxAngle: Math.PI * 1.06,
    /** How much looser the curl gets away from the grabbed corner (0 = pure cylinder). */
    cone: 0.55,
    /** Span over which the cone term ramps in, as a fraction of the viewport diagonal. */
    coneSpan: 0.55,
    /** Downward droop of the lifted tip, in pixels at full turn. */
    sag: 13,
  },

  /** Pointer displacement is multiplied by this before it becomes fold distance. */
  dragSensitivity: 1,

  /** Fraction of the sheet that must be turned for a release to complete the flip. */
  completionThreshold: 0.46,

  /** A deliberate flick can complete the turn earlier than the distance threshold. */
  flick: {
    /** Pointer speed (px/s) at which the full assist applies. */
    velocity: 1150,
    /** Most the threshold can be lowered by a fast flick. */
    maxAssist: 0.15,
  },

  /** Spring used while the pointer is down: stiff, so the paper stays glued to the cursor. */
  dragSpring: { stiffness: 1500, damping: 72 },
  /** Spring used when settling back to the resting affordance. */
  returnSpring: { stiffness: 205, damping: 26 },
  /** Spring that carries the page through the rest of the turn after a committed release. */
  commitSpring: { stiffness: 190, damping: 30 },
  /** Spring used for the small hover lift. */
  hoverSpring: { stiffness: 260, damping: 30 },

  shadow: {
    /** Peak opacity of the shadow the flap casts onto the revealed page. */
    strength: 0.34,
    /** Base blur radius, grows with how far the paper has lifted. */
    spread: 14,
  },

  paper: {
    /** Ambient term; the rest of the lighting comes from the key light. */
    ambient: 0.74,
    /** Direction the key light comes from, in view space. */
    lightDirection: [-0.42, 0.72, 0.55] as const,
    /** Matte paper, so this stays very low. */
    specular: 0.06,
    specularPower: 42,
    /** Tint of the reverse side before the opposite theme takes over. */
    reverseTint: "#e6eaee",
    /** Extra darkening in the tightest part of the bend. */
    creaseOcclusion: 0.16,
    /** Visual thickness of the sheet, communicated through edge shading. */
    edgeShade: 0.22,
  },

  mesh: {
    segments: 192,
    lowPowerSegments: 128,
    /**
     * Grid density is biased toward the grabbed corner with this exponent. A uniform
     * grid wastes vertices on the flat side of the sheet and leaves the curl faceted,
     * since the curl is small in screen terms but sweeps through ~180 degrees.
     */
    cornerBias: 2.2,
    /** Antialiasing feather at the crease, in pixels. */
    feather: 1.4,
  },

  /** Shallow perspective: the page should read as flat until it lifts. */
  fov: 27,

  /** Frames of stillness after which the render loop parks itself. */
  idleFramesBeforePark: 8,
} as const;

export type PageCurlConfig = typeof pageCurlConfig;

export function grabZoneRadius(width: number, height: number): number {
  const { min, max, viewportRatio } = pageCurlConfig.grabZone;
  return Math.min(max, Math.max(min, Math.min(width, height) * viewportRatio));
}
