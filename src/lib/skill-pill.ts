/** Original frederic.ooo connected pill path (viewBox 235×32) */
const REFERENCE_PATH =
  "M0.5 16C0.5 7.43959 7.43959 0.5 16 0.5H48C53.7589 0.5 58.785 3.64044 61.4579 8.30461C62.1776 9.56047 63.4774 10.5 65 10.5C66.5226 10.5 67.8224 9.56047 68.5421 8.30461C71.215 3.64044 76.2411 0.5 82 0.5H150C155.932 0.5 161.086 3.83189 163.692 8.72858C164.237 9.75252 165.282 10.5 166.5 10.5C167.718 10.5 168.763 9.75252 169.308 8.72858C171.914 3.83189 177.068 0.5 183 0.5H219C227.56 0.5 234.5 7.43959 234.5 16C234.5 24.5604 227.56 31.5 219 31.5H183C177.068 31.5 171.914 28.1681 169.308 23.2714C168.763 22.2475 167.718 21.5 166.5 21.5C165.282 21.5 164.237 22.2475 163.692 23.2714C161.086 28.1681 155.932 31.5 150 31.5H82C76.2411 31.5 71.215 28.3596 68.5421 23.6954C67.8224 22.4395 66.5226 21.5 65 21.5C63.4774 21.5 62.1776 22.4395 61.4579 23.6954C58.785 28.3596 53.7589 31.5 48 31.5H16C7.43959 31.5 0.5 24.5604 0.5 16Z";

const REF_JOINTS = [82, 150, 235] as const;
const CHAR_WIDTH = 6.4;
const SEGMENT_PAD = 12;

export type PillSegment = {
  label: string;
  x: number;
  width: number;
};

function segmentWidth(label: string) {
  return Math.ceil(label.length * CHAR_WIDTH + SEGMENT_PAD);
}

function mapX(x: number, targetJoints: [number, number, number]) {
  const [t1, t2, tEnd] = targetJoints;
  const [o1, o2, oEnd] = REF_JOINTS;

  if (x <= o1) return (x / o1) * t1;
  if (x <= o2) return t1 + ((x - o1) / (o2 - o1)) * (t2 - t1);
  return t2 + ((x - o2) / (oEnd - o2)) * (tEnd - t2);
}

function formatNum(n: number) {
  const rounded = Math.round(n * 10000) / 10000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function remapPath(path: string, targetJoints: [number, number, number]) {
  const tokens = path.match(/[A-Za-z]|-?\d+\.?\d*/g) ?? [];
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    out.push(cmd);

    if (cmd === "H") {
      out.push(formatNum(mapX(Number(tokens[i++]), targetJoints)));
    } else if (cmd === "V") {
      out.push(tokens[i++]);
    } else if (cmd === "Z") {
      continue;
    } else if ("MCL".includes(cmd)) {
      const coords: number[] = [];
      while (i < tokens.length && !/[A-Za-z]/.test(tokens[i]!)) {
        coords.push(Number(tokens[i++]));
      }
      for (let j = 0; j < coords.length; j += 2) {
        out.push(formatNum(mapX(coords[j]!, targetJoints)));
        out.push(formatNum(coords[j + 1]!));
      }
    }
  }

  let result = out[0] ?? "";
  for (let j = 1; j < out.length; j++) {
    result += (/[A-Za-z]/.test(out[j]!) ? "" : " ") + out[j];
  }
  return result;
}

export function buildSkillPill(labels: string[]) {
  const tags = labels.slice(0, 3).map((l) => l.toLowerCase());
  const widths = tags.map(segmentWidth);
  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  let offset = 0;
  const segments: PillSegment[] = tags.map((label, index) => {
    const seg = { label, x: offset, width: widths[index]! };
    offset += widths[index]!;
    return seg;
  });

  const joints: [number, number, number] = [
    widths[0] ?? 0,
    (widths[0] ?? 0) + (widths[1] ?? 0),
    totalWidth,
  ];

  return {
    width: totalWidth,
    height: 32,
    path: remapPath(REFERENCE_PATH, joints),
    segments,
  };
}
