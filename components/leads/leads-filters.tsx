"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAD_STATUS_OPTIONS } from "@/modules/form-schema/types";
import type { LeadStatus } from "@prisma/client";

export function LeadsFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: LeadStatus | "ALL";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: LeadStatus | "ALL") => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <label htmlFor="leads-search" className="text-sm font-medium text-text">
          Search
        </label>
        <Input
          id="leads-search"
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="w-full space-y-2 sm:w-52">
        <label htmlFor="leads-status" className="text-sm font-medium text-text">
          Status
        </label>
        <Select
          id="leads-status"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as LeadStatus | "ALL")
          }
        >
          <option value="ALL">All statuses</option>
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
