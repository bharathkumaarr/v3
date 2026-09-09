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
    idleCurl: 30,
    hoverCurl: 58,
  },

  /**
   * Shape of the fold.
   *
   * `theta` is the total angle the paper wraps through. It sets two things at once.
   *
   * How far the fold runs: `crease = radius * theta` with
   * `radius = distance / (theta - sin theta)`. At exactly pi the crease lands on the
   * pointer, below pi it runs ahead, above pi it lags behind.
   *
   * And, more visibly, the proportion of the curl. Seen head-on the roll is exactly one
   * radius wide, because the sheet reaches its furthest point past the crease a quarter
   * turn in, while the strip of revealed page behind it is `radius * (theta - 1)`. So
   * theta alone decides whether the corner reads as a fat roll of paper with a sliver of
   * dark behind it, or as a dark wedge with a hairline of paper on its edge. Just over a
   * quarter turn puts roughly three parts roll to two parts reveal, which is what a
   * lifted poster corner actually looks like.
   */
  curl: {
    thetaMin: 1.62,
    thetaMax: 3.32,
    /** Hard stop so the sheet can never spiral into itself. */
    maxAngle: Math.PI * 1.06,
    /**
     * How much wider the roll gets toward the ends of the crease (0 = pure cylinder).
     * Real paper opens up where it runs off the edge of the sheet and stays tight at the
     * pinned corner, and that taper is most of what separates a roll of paper from a
     * rolled tube of plastic.
     */
    cone: 0.5,
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
    /** Peak opacity of the shadow the roll casts onto the revealed page. */
    strength: 0.34,
    /** Base blur radius, grows with how far the paper has lifted. */
    spread: 14,
    /**
     * The roll also overhangs the untouched page just past the crease, and its shadow
     * there is what makes the fold sit on the page rather than float in a hole. Scaled
     * down from the reveal side, which is in shade rather than merely shadowed.
     */
    spill: 0.3,
    /** How far that shadow reaches past the crease, before the lift-dependent part. */
    spillReach: 30,
    /**
     * Distance over which the spill ramps up from the crease. The paper is tangent to
     * the page at the crease and shaded identically, so anything but a gradual ramp here
     * steps the page darker right where the two surfaces are supposed to meet
     * seamlessly, and the fold grows a hard outline.
     */
    spillOnset: 16,
  },

  paper: {
    /**
     * Ambient term; the rest comes from the key light. Kept high because paper this
     * pale has very little falloff before it starts reading as grey plastic.
     */
    ambient: 0.82,
    /** Direction the key light comes from, in view space. */
    lightDirection: [-0.38, 0.66, 0.65] as const,
    /** Matte paper, so this stays very low. */
    specular: 0.035,
    specularPower: 46,
    /**
     * The reverse of a barely-turned corner is still this sheet's own stock, just a
     * shade off the printed side. Derived from the live theme rather than a fixed grey
     * so a dark sheet does not flash a pale underside.
     */
    reverseShade: 0.92,
    /** Extra darkening in the tightest part of the bend. */
    creaseOcclusion: 0.12,
    /**
     * Visual thickness of the sheet, communicated through edge shading rather than a
     * literal extrusion. This also softens the hand-off where the surface turns
     * edge-on and the printed side gives way to the reverse.
     */
    edgeShade: 0.34,
    /**
     * How wide, in normal-to-view terms, the edge shading ramps over. Generous, because
     * this gradient is standing in for the sliver of the sheet's underside that a curl
     * this open barely turns far enough to show.
     */
    edgeSpread: 0.7,
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
