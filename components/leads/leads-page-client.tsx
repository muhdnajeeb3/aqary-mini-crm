"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import {
  LeadsTable,
  LeadsTableSkeleton,
} from "@/components/leads/leads-table";
import { useLeads } from "@/hooks/use-leads";
import { ApiClientError } from "@/lib/api/client";
import type { LeadStatus } from "@prisma/client";

const SEARCH_DEBOUNCE_MS = 300;

export function LeadsPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  const query = useLeads({
    search: debouncedSearch,
    status,
    page,
    pageSize,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LeadsFilters
          search={searchInput}
          status={status}
          onSearchChange={setSearchInput}
          onStatusChange={setStatus}
        />
        <Link
          href="/leads/new"
          className="touch-target inline-flex items-center justify-center self-stretch rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover sm:self-end"
        >
          + Create lead
        </Link>
      </div>

      {query.isLoading ? <LeadsTableSkeleton /> : null}

      {query.isError ? (
        <div
          className="rounded-[var(--radius-md)] border border-border bg-surface p-6"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-text">
            Could not load leads
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {query.error instanceof ApiClientError
              ? query.error.message
              : "Something went wrong. Please try again."}
          </p>
          <Button className="mt-4" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {query.isSuccess && query.data.data.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold text-text">
            No matching leads
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Try another search or clear the filters.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setSearchInput("");
              setDebouncedSearch("");
              setStatus("ALL");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : null}

      {query.isSuccess && query.data.data.length > 0 ? (
        <>
          <LeadsTable leads={query.data.data} />
          <LeadsPagination
            pagination={query.data.pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : null}
    </div>
  );
}
