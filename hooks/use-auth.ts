"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { PublicUser } from "@/modules/auth/types";

export const authQueryKey = ["auth", "me"] as const;

type MeResponse = { user: PublicUser };
type LoginBody = { email: string; password: string };

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: () => apiFetch<MeResponse>("/api/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginBody) =>
      apiFetch<MeResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKey, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null);
      queryClient.removeQueries({ queryKey: authQueryKey });
    },
  });
}
