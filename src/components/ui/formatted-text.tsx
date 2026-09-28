import type { ReactNode } from "react";

type FormattedTextProps = {
  children: ReactNode;
  className?: string;
};

export function FormattedText({ children, className }: FormattedTextProps) {
  if (typeof children !== "string") {
    return <span className={className}>{children}</span>;
  }

  const parts = children.split(/(\*[^*]+\*)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </span>
  );
}
