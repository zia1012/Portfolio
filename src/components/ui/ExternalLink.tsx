import type { AnchorHTMLAttributes, ReactNode } from "react";
import { uiText } from "@/lib/ui-text";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  href: string;
  children: ReactNode;
};

export function ExternalLink({ children, className = "", ...props }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={className} {...props}>
      {children}
      <span className="sr-only"> {uiText.newTab}</span>
    </a>
  );
}
