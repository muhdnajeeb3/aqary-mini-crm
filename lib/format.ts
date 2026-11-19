import type { LeadStatus } from "@prisma/client";

const budgetFormatter = new Intl.NumberFormat("en-AE", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Empty optional budget → em dash; genuine 0 → "0". */
export function formatBudgetAed(budget: number | null | undefined): string {
  if (budget === null || budget === undefined) {
    return "—";
  }
  return budgetFormatter.format(budget);
}

export function formatLeadDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function leadStatusLabel(status: LeadStatus): string {
  return status;
}
