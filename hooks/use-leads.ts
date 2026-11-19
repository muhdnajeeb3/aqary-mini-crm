"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { LeadListResult } from "@/modules/leads/types";
import type { LeadStatus } from "@prisma/client";

export type LeadsListParams = {
  search: string;
  status: LeadStatus | "ALL";
  page: number;
  pageSize: number;
};

export function leadsQueryKey(params: LeadsListParams) {
  return ["leads", params] as const;
}

function buildLeadsUrl(params: LeadsListParams): string {
  const searchParams = new URLSearchParams();
  if (params.search.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.status !== "ALL") {
    searchParams.set("status", params.status);
  }
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  return `/api/leads?${searchParams.toString()}`;
}

export function useLeads(params: LeadsListParams) {
  return useQuery({
    queryKey: leadsQueryKey(params),
    queryFn: () => apiFetch<LeadListResult>(buildLeadsUrl(params)),
    placeholderData: keepPreviousData,
  });
}
