"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { LeadDto } from "@/modules/leads/types";
import type { LeadValues } from "@/modules/form-schema/types";
export function leadQueryKey(id: string) {
  return ["leads", id] as const;
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: id ? leadQueryKey(id) : ["leads", "missing"],
    queryFn: () => apiFetch<LeadDto>(`/api/leads/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LeadValues) =>
      apiFetch<LeadDto>("/api/leads", {
        method: "POST",
        body: JSON.stringify({ values }),
      }),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadQueryKey(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LeadValues) =>
      apiFetch<LeadDto>(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ values }),
      }),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadQueryKey(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
