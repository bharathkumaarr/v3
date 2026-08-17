"use client";

import { motion } from "motion/react";
import { buildFoldGeometry } from "@/lib/peel-math";

type PaperFoldProps = {
  peel: number;
  clipPeel: number;
  viewportW: number;
  viewportH: number;
  isDragging: boolean;
  reducedMotion?: boolean;
};

export function PaperFold({
  peel,
  clipPeel,
  viewportW,
  viewportH,
  isDragging,
  reducedMotion,
}: PaperFoldProps) {
  const geo = buildFoldGeometry(clipPeel, viewportW, viewportH, peel);
  const pad = 56;
  const svgW = geo.peel + pad;
  const svgH = geo.boxHeight + pad;

  return (
    <motion.div
      className="pointer-events-none absolute top-0 right-0"
      style={{ width: svgW, height: svgH }}
      animate={
        isDragging || reducedMotion
          ? { y: 0 }
          : { y: [0, 1.5, 0] }
      }
      transition={
        isDragging || reducedMotion
          ? { duration: 0.1 }
          : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-pad + 14} ${-18} ${svgW} ${svgH}`}
        className="overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="fold-paper-top" x1="90%" y1="0%" x2="10%" y2="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="56%" stopColor="#fbfcfd" />
            <stop offset="100%" stopColor="#eef2f5" />
          </linearGradient>
          <linearGradient id="fold-paper-back" x1="100%" y1="4%" x2="14%" y2="94%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="34%" stopColor="#f1f4f6" />
            <stop offset="70%" stopColor="#cbd2d8" />
            <stop offset="100%" stopColor="#f8fafb" />
          </linearGradient>
          <linearGradient id="fold-inner-shade" x1="100%" y1="12%" x2="18%" y2="88%">
            <stop offset="0%" stopColor="rgba(19,27,32,0)" />
            <stop offset="58%" stopColor="rgba(19,27,32,0.1)" />
            <stop offset="100%" stopColor="rgba(19,27,32,0.02)" />
          </linearGradient>
          <linearGradient id="fold-cast" x1="0%" y1="0%" x2="92%" y2="82%">
            <stop offset="0%" stopColor="rgba(19,27,32,0.12)" />
            <stop offset="58%" stopColor="rgba(19,27,32,0.045)" />
            <stop offset="100%" stopColor="rgba(19,27,32,0)" />
          </linearGradient>
          <linearGradient id="fold-contact" x1="96%" y1="8%" x2="24%" y2="88%">
            <stop offset="0%" stopColor="rgba(19,27,32,0.18)" />
            <stop offset="64%" stopColor="rgba(19,27,32,0.06)" />
            <stop offset="100%" stopColor="rgba(19,27,32,0)" />
          </linearGradient>
          <filter id="fold-cast-blur" x="-35%" y="-50%" width="190%" height="230%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="fold-contact-blur" x="-30%" y="-40%" width="180%" height="200%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id="fold-paper-shadow" x="-20%" y="-25%" width="150%" height="170%">
            <feDropShadow dx="-6" dy="9" stdDeviation="8" floodColor="#131b20" floodOpacity="0.1" />
            <feDropShadow dx="-1" dy="1.5" stdDeviation="1.8" floodColor="#131b20" floodOpacity="0.08" />
          </filter>
        </defs>

        <path
          d={geo.castShadowPath}
          fill="url(#fold-cast)"
          filter="url(#fold-cast-blur)"
        />

        <path
          d={geo.contactShadowPath}
          fill="url(#fold-contact)"
          filter="url(#fold-contact-blur)"
          opacity="0.92"
        />
        <path d={geo.flapPath} fill="url(#fold-paper-back)" filter="url(#fold-paper-shadow)" />
        <path d={geo.foldBackPath} fill="url(#fold-paper-back)" opacity="0.78" />
        <path d={geo.foldFacePath} fill="url(#fold-paper-top)" opacity="0.98" />
        <path d={geo.innerShadePath} fill="url(#fold-inner-shade)" opacity="0.72" />

        <path
          d={geo.creasePath}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <path
          d={geo.creasePath}
          fill="none"
          stroke="rgba(19,27,32,0.08)"
          strokeWidth={0.8}
          strokeLinecap="round"
          transform="translate(0, 1.2)"
        />
        <path
          d={geo.rimPath}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}
