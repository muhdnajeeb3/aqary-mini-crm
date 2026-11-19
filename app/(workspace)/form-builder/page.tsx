"use client";

import { AppShell } from "@/components/layout/app-shell";
import { FormBuilder } from "@/components/form-builder/form-builder";
import { useCurrentUser } from "@/hooks/use-auth";
import Link from "next/link";

export default function FormBuilderPage() {
  const { data, isLoading } = useCurrentUser();
  const isAdmin = data?.user.role === "ADMIN";

  if (isLoading) {
    return (
      <AppShell title="Lead form builder" description="Loading…">
        <p className="text-sm text-text-muted">Checking permissions…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Lead form builder" description="Administrator only">
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Forbidden</h2>
          <p className="mt-2 text-sm text-text-muted">
            Only administrators can open the form builder. Lead create, view and
            edit remain available to agents.
          </p>
          <Link
            href="/leads"
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Back to leads
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Lead form builder"
      description="Draft changes stay local until you save."
    >
      <FormBuilder />
    </AppShell>
  );
}
