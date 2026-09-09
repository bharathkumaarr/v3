/**
 * Connected skill-pill outline: three (or fewer) rounded bubbles joined by concave
 * notches, sized from the labels rather than by warping a fixed reference path.
 *
 * Earlier this remapped frederic.ooo's 235×32 path. That path's pinch points and its
 * declared segment joints disagreed, so after remapping the middle outline ran wider
 * than the text box sitting inside it — "frontend" looked padded even when its
 * measured width was only a few pixels past "backend". Building the path from the
 * segment widths keeps the outline and the labels on the same geometry.
 */

const HEIGHT = 32;
const RADIUS = 16;
/** Half-width of the concave notch that joins two bubbles. */
const NOTCH = 10.5;
/**
 * Advance widths at 12px sans (matches `text-xs` + Geist). Tuned so each bubble hugs
 * its letters the way a CSS pill with `px-2.5` would, instead of charging every
 * character the same flat width.
 */
const CHAR_ADVANCE: Record<string, number> = {
  default: 6.7,
  i: 3.1,
  l: 3.1,
  f: 3.9,
  t: 3.9,
  r: 4.3,
  j: 3.5,
  " ": 3.2,
};
const SEGMENT_PAD = 18;

export type PillSegment = {
  label: string;
  x: number;
  width: number;
};

function segmentWidth(label: string) {
  let advance = 0;
  for (const char of label) {
    advance += CHAR_ADVANCE[char] ?? CHAR_ADVANCE.default;
  }
  return Math.ceil(advance + SEGMENT_PAD);
}

function format(n: number) {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * One continuous outline. Bubbles are full-height stadiums; where two meet, the top and
 * bottom edge dive into a circular notch centred on the joint so the chain reads as
 * linked pods rather than a single sausage.
 */
function buildPath(widths: number[]): string {
  if (widths.length === 0) return "";

  const total = widths.reduce((sum, w) => sum + w, 0);
  const joints: number[] = [];
  let cursor = 0;
  for (let i = 0; i < widths.length - 1; i++) {
    cursor += widths[i]!;
    joints.push(cursor);
  }

  const parts: string[] = [];

  // Left cap.
  parts.push(`M${format(0.5)} ${format(RADIUS)}`);
  parts.push(
    `C${format(0.5)} ${format(7.44)} ${format(7.44)} ${format(0.5)} ${format(RADIUS)} ${format(0.5)}`,
  );

  // Top edge, left → right, diving into a notch at every joint.
  let x = RADIUS;
  for (const joint of joints) {
    const flatEnd = joint - NOTCH;
    if (flatEnd > x) parts.push(`H${format(flatEnd)}`);
    parts.push(notch(joint, "top", "ltr"));
    x = joint + NOTCH;
  }
  parts.push(`H${format(total - RADIUS)}`);

  // Right cap.
  parts.push(
    `C${format(total - 7.44)} ${format(0.5)} ${format(total - 0.5)} ${format(7.44)} ${format(total - 0.5)} ${format(RADIUS)}`,
  );
  parts.push(
    `C${format(total - 0.5)} ${format(HEIGHT - 7.44)} ${format(total - 7.44)} ${format(HEIGHT - 0.5)} ${format(total - RADIUS)} ${format(HEIGHT - 0.5)}`,
  );

  // Bottom edge, right → left, mirroring the top notches.
  x = total - RADIUS;
  for (let i = joints.length - 1; i >= 0; i--) {
    const joint = joints[i]!;
    const flatEnd = joint + NOTCH;
    if (x > flatEnd) parts.push(`H${format(flatEnd)}`);
    parts.push(notch(joint, "bottom", "rtl"));
    x = joint - NOTCH;
  }
  parts.push(`H${format(RADIUS)}`);

  // Close on the left cap.
  parts.push(
    `C${format(7.44)} ${format(HEIGHT - 0.5)} ${format(0.5)} ${format(HEIGHT - 7.44)} ${format(0.5)} ${format(RADIUS)}`,
  );
  parts.push("Z");

  return parts.join("");
}

function notch(
  joint: number,
  side: "top" | "bottom",
  direction: "ltr" | "rtl",
): string {
  // Cubic approximation of a circular bite, matching the frederic.ooo notch so the
  // chain still reads as part of the same visual language.
  const yEdge = side === "top" ? 0.5 : HEIGHT - 0.5;
  const yPinch = side === "top" ? 10.5 : HEIGHT - 10.5;
  const yMid = side === "top" ? 3.64 : HEIGHT - 3.64;

  const left = joint - NOTCH;
  const right = joint + NOTCH;
  const leftIn = joint - 1.5;
  const rightIn = joint + 1.5;
  const leftCtrl = joint - NOTCH * 0.45;
  const rightCtrl = joint + NOTCH * 0.45;

  if (direction === "ltr") {
    return [
      `C${format(leftCtrl)} ${format(yEdge)} ${format(leftIn)} ${format(yMid)} ${format(joint)} ${format(yPinch)}`,
      `C${format(rightIn)} ${format(yMid)} ${format(rightCtrl)} ${format(yEdge)} ${format(right)} ${format(yEdge)}`,
    ].join("");
  }

  return [
    `C${format(rightCtrl)} ${format(yEdge)} ${format(rightIn)} ${format(yMid)} ${format(joint)} ${format(yPinch)}`,
    `C${format(leftIn)} ${format(yMid)} ${format(leftCtrl)} ${format(yEdge)} ${format(left)} ${format(yEdge)}`,
  ].join("");
}

export function buildSkillPill(labels: string[]) {
  const tags = labels.slice(0, 3).map((label) => label.toLowerCase());
  const widths = tags.map(segmentWidth);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);

  let offset = 0;
  const segments: PillSegment[] = tags.map((label, index) => {
    const width = widths[index]!;
    const segment = { label, x: offset, width };
    offset += width;
    return segment;
  });

  return {
    width: totalWidth,
    height: HEIGHT,
    path: buildPath(widths),
    segments,
  };
}
