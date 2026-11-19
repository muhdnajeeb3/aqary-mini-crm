"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { formConfigQueryKey } from "@/hooks/use-form-config";
import type { FormConfigDto } from "@/modules/form-schema/service";
import type { FormSchema } from "@/modules/form-schema/types";

export function useSaveFormConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schema: FormSchema) =>
      apiFetch<FormConfigDto>("/api/form-config", {
        method: "PUT",
        body: JSON.stringify({ schema }),
      }),
    onSuccess: (config) => {
      queryClient.setQueryData(formConfigQueryKey, config);
      void queryClient.invalidateQueries({ queryKey: formConfigQueryKey });
    },
  });
}
