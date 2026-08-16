import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ItemIconProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ItemIcon({ src, alt, className }: ItemIconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={68}
      height={68}
      className={cn("size-[68px] shrink-0", className)}
    />
  );
}

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "-mx-2 -my-1 rounded-lg px-2 py-1 lowercase text-neutral-8 transition-colors",
        "hover:bg-neutral-2 active:bg-neutral-3",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-7",
        className,
      )}
    >
      {children}
      <span aria-hidden="true"> ↗</span>
    </Link>
  );
}

type PillLinkProps = {
  href: string;
  children: ReactNode;
};

export function PillLink({ href, children }: PillLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "rounded-full bg-neutral-2 px-3 py-2 text-sm lowercase text-neutral-8 transition-colors",
        "hover:bg-neutral-3 active:bg-neutral-4",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-7",
      )}
    >
      {children}
    </Link>
  );
}
