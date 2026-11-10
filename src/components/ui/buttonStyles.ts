export type ButtonVariant = "primary" | "secondary";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-text hover:text-background",
  secondary:
    "border border-text/30 bg-background/60 text-text hover:border-accent hover:text-accent",
};

export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}
