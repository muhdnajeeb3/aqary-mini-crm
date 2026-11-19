"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { LeadListPagination } from "@/modules/leads/types";

export function LeadsPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: LeadListPagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const { page, pageSize, total, totalPages } = pagination;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-muted">
        Showing {from}-{to} of {total} leads
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Page size
          <Select
            aria-label="Page size"
            className="w-24"
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="min-w-16 text-center text-sm text-text">
          {totalPages === 0 ? "0 / 0" : `${page} / ${totalPages}`}
        </span>
        <Button
          variant="secondary"
          disabled={totalPages === 0 || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
