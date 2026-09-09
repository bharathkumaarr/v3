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

  /**
   * Resting affordance: how far the corner is lifted with no pointer nearby, and when the
   * pointer is on it. Quoted for a laptop-sized window and scaled by viewport from there,
   * so the dog-ear stays the same fraction of the page rather than eating a third of a
   * phone screen.
   */
  affordance: {
    idleCurl: 48,
    hoverCurl: 78,
    referenceDiagonal: 1160,
    minScale: 0.72,
    maxScale: 1.2,
  },

  /**
   * Shape of the fold.
   *
   * Seen head-on the roll is exactly one radius wide, because the sheet reaches its
   * furthest point past the crease a quarter turn in, while the strip of revealed page
   * behind it is `radius * (wrap - 1)`. Those two numbers are the whole look of the
   * curl, which is why the radius is chosen here and the wrap angle solved from it.
   */
  curl: {
    /**
     * Wrap angle the roll holds while it still has room to grow, which fixes its
     * proportions. Just over a quarter turn puts about three parts roll to two parts
     * revealed page, which is what a lifted poster corner looks like.
     */
    /**
     * Wrap angle the roll holds while it still has room to grow. Higher wraps keep the
     * roll as a thin curled edge instead of a wide blank bill of paper colour — the mesh
     * is painted flat, so a fat roll reads as empty space in front of the fold.
     */
    restWrap: 2.55,
    /**
     * Widest the roll gets. Kept tight on purpose: beyond this the flap stops looking
     * like a page edge and becomes a featureless slab covering the site.
     */
    radiusMaxPx: 58,
    radiusMaxRatio: 0.055,
    /** Hard stop so the sheet can never spiral into itself. */
    maxAngle: Math.PI * 1.15,
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
    strength: 0.44,
    /** Base blur radius, grows with how far the paper has lifted. */
    spread: 16,
    /** Ceiling on that blur, so a big roll softens its shadow without spreading it. */
    maxSpread: 110,
    /**
     * The roll also overhangs the untouched page just past the crease, and its shadow
     * there is what makes the fold sit on the page rather than float in a hole. Scaled
     * down from the reveal side, which is in shade rather than merely shadowed.
     */
    spill: 0.5,
    /**
     * How far that shadow reaches past the crease, before the lift-dependent part, and
     * its ceiling. Both kept tight: a shadow that reaches as far as the fold itself stops
     * reading as contact and starts washing the site out behind it.
     */
    spillReach: 16,
    maxSpillReach: 44,
    /**
     * Floor on the contact term, which fades as the paper separates from the page. Left
     * unbounded the shadow all but disappears at the point in the drag where the roll is
     * largest and most obviously needs to be sitting on something.
     */
    minContact: 0.55,
    /** Lift at which the contact term reaches that floor. */
    contactFade: 900,
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
    ambient: 0.74,
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

  /**
   * Motion-driven paper acoustics. Volumes stay low: this is a portfolio, not a game.
   * Generated in the Web Audio API so there are no sample files to fetch or license.
   */
  audio: {
    masterVolume: 0.9,
    /** Peak continuous rustle while dragging at `fullSpeed`. */
    rustleVolume: 0.045,
    /** Peak of a short crinkle burst. */
    crinkleVolume: 0.055,
    /** Fold speed (px/s) that maps to full rustle intensity. */
    fullSpeed: 1400,
    /** Minimum fold speed before a jerk can throw a crinkle. */
    crinkleMinSpeed: 180,
    /** Sudden speed change (px/s) that counts as a paper jerk. */
    crinkleJerk: 420,
    /** Shortest gap between crinkle bursts, so a noisy drag does not stutter. */
    crinkleCooldownMs: 70,
  },
} as const;

export type PageCurlConfig = typeof pageCurlConfig;

export function grabZoneRadius(width: number, height: number): number {
  const { min, max, viewportRatio } = pageCurlConfig.grabZone;
  return Math.min(max, Math.max(min, Math.min(width, height) * viewportRatio));
}

/** Resting lift of the corner, scaled to the viewport. */
export function affordanceCurl(diagonal: number, proximity: number): number {
  const { idleCurl, hoverCurl, referenceDiagonal, minScale, maxScale } =
    pageCurlConfig.affordance;

  const scale = Math.min(maxScale, Math.max(minScale, diagonal / referenceDiagonal));

  return (idleCurl + (hoverCurl - idleCurl) * proximity) * scale;
}
