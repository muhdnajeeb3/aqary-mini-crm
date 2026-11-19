"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBudgetAed, formatLeadDate } from "@/lib/format";
import type { LeadDto } from "@/modules/leads/types";

export function LeadsTableSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-text-muted">Loading leads…</p>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function LeadsTable({ leads }: { leads: LeadDto[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface shadow-[var(--shadow-sm)]">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead className="border-b border-border bg-page">
          <tr>
            <th className="px-4 py-3 font-medium text-text-muted">Name</th>
            <th className="px-4 py-3 font-medium text-text-muted">Email</th>
            <th className="px-4 py-3 font-medium text-text-muted">Status</th>
            <th className="px-4 py-3 font-medium text-text-muted">
              Budget (AED)
            </th>
            <th className="px-4 py-3 font-medium text-text-muted">Created</th>
            <th className="px-4 py-3 font-medium text-text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 font-medium text-text">{lead.name}</td>
              <td className="px-4 py-3 text-text-muted">{lead.email}</td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3 text-text">
                {formatBudgetAed(lead.budget)}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {formatLeadDate(lead.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="touch-target inline-flex items-center rounded-[var(--radius-sm)] px-2 text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/leads/${lead.id}/edit`}
                    className="touch-target inline-flex items-center rounded-[var(--radius-sm)] px-2 text-sm font-medium text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
