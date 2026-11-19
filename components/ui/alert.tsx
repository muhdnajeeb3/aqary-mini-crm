import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type AlertVariant = "success" | "error" | "info";

const variantClasses: Record<AlertVariant, string> = {
  success: "border-primary/30 bg-primary-muted text-primary",
  error: "border-danger/20 bg-danger-muted text-danger",
  info: "border-border bg-page text-text",
};

export function Alert({
  variant = "info",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
