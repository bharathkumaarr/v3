import { cn } from "@/lib/cn";
import { buildSkillPill } from "@/lib/skill-pill";

type SkillTagsProps = {
  tags: string[];
  className?: string;
};

export function SkillTags({ tags, className }: SkillTagsProps) {
  const pill = buildSkillPill(tags);

  return (
    <svg
      width={pill.width}
      height={pill.height}
      viewBox={`0 0 ${pill.width} ${pill.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("mt-2 block", className)}
      aria-hidden="true"
    >
      <path d={pill.path} className="stroke-neutral-3" strokeWidth="1" />
      {pill.segments.map((segment) => (
        <foreignObject
          key={segment.label}
          x={segment.x}
          y={0}
          width={segment.width}
          height={pill.height}
        >
          <div className="flex h-full items-center justify-center font-sans text-xs lowercase text-neutral-7">
            {segment.label}
          </div>
        </foreignObject>
      ))}
    </svg>
  );
}
