"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiClientError } from "@/lib/api/client";
import { useCurrentUser } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, isLoading, isFetching } = useCurrentUser();

  const unauthorized =
    error instanceof ApiClientError && error.status === 401;

  useEffect(() => {
    if (unauthorized) {
      router.replace("/login");
    }
  }, [unauthorized, router]);

  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <p className="text-sm text-text-muted">Checking session…</p>
        </div>
      </div>
    );
  }

  if (unauthorized || !data?.user) {
    return null;
  }

  return children;
}
