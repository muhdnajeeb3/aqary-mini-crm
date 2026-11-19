"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { FormConfigDto } from "@/modules/form-schema/service";

export const formConfigQueryKey = ["form-config"] as const;

export function useFormConfig() {
  return useQuery({
    queryKey: formConfigQueryKey,
    queryFn: () => apiFetch<FormConfigDto>("/api/form-config"),
    staleTime: 30_000,
  });
}
