import type { AnchorHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "./buttonStyles";

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
};

/** An in-page or same-site link styled as a button (e.g. hero CTAs pointing at #projects). */
export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return <a className={buttonClasses(variant, className)} {...props} />;
}
