import { cn } from "@/lib/cn";
import type { LeadStatus } from "@prisma/client";
import type { HTMLAttributes } from "react";

const statusClasses: Record<LeadStatus, string> = {
  New: "bg-[#e8f6f5] text-[#0a6f69]",
  Contacted: "bg-[#eef3fb] text-[#2f4f8a]",
  Qualified: "bg-[#eef8ee] text-[#2f6b3a]",
  Lost: "bg-[#f8eeee] text-[#8a3a3a]",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: LeadStatus;
};

export function StatusBadge({ status, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium",
        statusClasses[status],
        className,
      )}
      {...props}
    >
      {status}
    </span>
  );
}
