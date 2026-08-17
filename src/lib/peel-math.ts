export const PEEL_REST = 178;
export const PEEL_MAX = 420;
export const PEEL_SNAP = 0.46;

const FOLD_K = 0.47;

export function peelProgress(value: number) {
  return Math.min(1, Math.max(0, value / PEEL_MAX));
}

export function peelFromPointerDelta(deltaX: number, deltaY: number, base: number) {
  const delta = Math.max(0, deltaX * 0.95 + deltaY * 0.58);
  return Math.min(PEEL_MAX, Math.max(0, base + delta));
}

export function visualPeelAmount(clipPeel: number) {
  return Math.max(PEEL_REST, clipPeel);
}

export type FoldGeometry = {
  peel: number;
  rightY: number;
  pagePath: string;
  flapPath: string;
  foldBackPath: string;
  foldFacePath: string;
  innerShadePath: string;
  creasePath: string;
  rimPath: string;
  castShadowPath: string;
  contactShadowPath: string;
  boxHeight: number;
};

function foldPaths(p: number) {
  const rightY = p * FOLD_K;
  const curl = p * 0.42;
  const lip = p * 0.18;
  const belly = p * 0.16;

  return {
    rightY,
    flapPath: [
      `M ${p} 0`,
      `C ${p - lip} ${p * 0.01} ${p - curl} ${p * 0.08} ${p - curl * 1.18} ${p * 0.2}`,
      `C ${p - curl * 1.76} ${p * 0.36} ${p - curl * 1.24} ${rightY - belly} ${p} ${rightY}`,
      `C ${p * 0.82} ${rightY - belly * 0.5} ${p * 0.46} ${p * 0.04} 0 0`,
      `C ${p * 0.25} ${-p * 0.018} ${p * 0.68} ${-p * 0.01} ${p} 0`,
      `Z`,
    ].join(" "),
    foldBackPath: [
      `M ${p} 0`,
      `C ${p - lip * 0.8} ${p * 0.012} ${p - curl * 0.8} ${p * 0.08} ${p - curl * 1.12} ${p * 0.2}`,
      `C ${p - curl * 1.58} ${p * 0.36} ${p - curl * 1.08} ${rightY - belly * 0.65} ${p} ${rightY}`,
      `C ${p * 0.9} ${rightY * 0.72} ${p * 0.78} ${rightY * 0.32} ${p * 0.58} 0`,
      `Z`,
    ].join(" "),
    foldFacePath: [
      `M 0 0`,
      `C ${p * 0.25} ${-p * 0.018} ${p * 0.68} ${-p * 0.01} ${p} 0`,
      `C ${p * 0.76} ${p * 0.08} ${p * 0.42} ${p * 0.08} 0 0`,
      `Z`,
    ].join(" "),
    innerShadePath: [
      `M ${p} ${rightY}`,
      `C ${p * 0.82} ${rightY - belly * 0.5} ${p * 0.5} ${p * 0.08} ${p * 0.12} ${p * 0.02}`,
      `C ${p * 0.42} ${p * 0.2} ${p * 0.76} ${rightY - belly * 0.12} ${p} ${rightY}`,
      `Z`,
    ].join(" "),
    creasePath: `M 0 0 C ${p * 0.22} ${-p * 0.02} ${p * 0.74} ${rightY - belly} ${p} ${rightY}`,
    rimPath: `M ${p - curl * 1.18} ${p * 0.2} C ${p - curl * 0.75} ${p * 0.07} ${p - lip * 0.7} ${p * 0.01} ${p} 0`,
    castShadowPath: [
      `M 0 7`,
      `C ${p * 0.34} ${p * 0.01} ${p * 0.74} ${rightY - belly * 0.7} ${p} ${rightY + 2}`,
      `L ${p} ${rightY + 30}`,
      `C ${p * 0.7} ${rightY + 16} ${p * 0.34} ${p * 0.15} 0 26`,
      `Z`,
    ].join(" "),
    contactShadowPath: [
      `M ${p * 0.6} 0`,
      `C ${p * 0.78} ${p * 0.02} ${p * 0.92} ${rightY * 0.26} ${p} ${rightY * 0.82}`,
      `L ${p} ${rightY + 4}`,
      `C ${p * 0.88} ${rightY * 0.58} ${p * 0.74} ${p * 0.08} ${p * 0.52} 0`,
      `Z`,
    ].join(" "),
    boxHeight: Math.ceil(rightY + 42),
  };
}

export function buildFoldGeometry(
  clipPeel: number,
  viewportW: number,
  viewportH: number,
  visualPeel = visualPeelAmount(clipPeel),
): FoldGeometry {
  const visual = foldPaths(visualPeel);
  const cut = clipPeel > 0 ? foldPaths(clipPeel) : null;

  const pagePath =
    !cut
      ? `M 0 0 H ${viewportW} V ${viewportH} H 0 Z`
      : [
          `M 0 0`,
          `H ${viewportW - clipPeel}`,
          `C ${viewportW - clipPeel * 0.72} ${-clipPeel * 0.02} ${viewportW - clipPeel * 0.2} ${cut.rightY * 0.52} ${viewportW} ${cut.rightY}`,
          `V ${viewportH}`,
          `H 0`,
          `Z`,
        ].join(" ");

  return {
    peel: visualPeel,
    rightY: visual.rightY,
    pagePath,
    flapPath: visual.flapPath,
    foldBackPath: visual.foldBackPath,
    foldFacePath: visual.foldFacePath,
    innerShadePath: visual.innerShadePath,
    creasePath: visual.creasePath,
    rimPath: visual.rimPath,
    castShadowPath: visual.castShadowPath,
    contactShadowPath: visual.contactShadowPath,
    boxHeight: visual.boxHeight,
  };
}
