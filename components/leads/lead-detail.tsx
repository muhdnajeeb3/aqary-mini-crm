"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/client";
import { formatBudgetAed, formatLeadDate } from "@/lib/format";
import { useFormConfig } from "@/hooks/use-form-config";
import { useLead } from "@/hooks/use-lead";
import { formatFieldDisplayValue } from "@/modules/form-schema/form-values";
import { CORE_FIELD_IDS } from "@/modules/form-schema/types";
import { isFieldVisible } from "@/modules/form-schema/visibility";

export function LeadDetail({ leadId }: { leadId: string }) {
  const formConfig = useFormConfig();
  const leadQuery = useLead(leadId);

  if (formConfig.isLoading || leadQuery.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <p className="text-sm text-text-muted">Loading lead…</p>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (
    leadQuery.error instanceof ApiClientError &&
    leadQuery.error.status === 404
  ) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">Lead not found</h2>
        <p className="mt-1 text-sm text-text-muted">
          This lead may have been removed.
        </p>
        <Link
          href="/leads"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to leads
        </Link>
      </div>
    );
  }

  if (formConfig.isError || leadQuery.isError || !formConfig.data || !leadQuery.data) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">Could not load lead</h2>
        <p className="mt-1 text-sm text-text-muted">
          {leadQuery.error instanceof ApiClientError
            ? leadQuery.error.message
            : "Please try again."}
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            void formConfig.refetch();
            void leadQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const lead = leadQuery.data;
  const schema = formConfig.data.schema;
  const visibleFields = schema.fields.filter((field) =>
    isFieldVisible(field, lead.values),
  );
  const summaryFieldIds = new Set<string>([
    CORE_FIELD_IDS.name,
    CORE_FIELD_IDS.email,
    CORE_FIELD_IDS.status,
    CORE_FIELD_IDS.budget,
  ]);
  const customFields = visibleFields.filter(
    (field) => !summaryFieldIds.has(field.id),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">{lead.name}</h2>
          <p className="text-sm text-text-muted">{lead.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/leads"
            className="touch-target inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-page"
          >
            Back to leads
          </Link>
          <Link
            href={`/leads/${lead.id}/edit`}
            className="touch-target inline-flex items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:grid-cols-2">
        <DetailItem label="Status">
          <StatusBadge status={lead.status} />
        </DetailItem>
        <DetailItem label="Budget (AED)">
          {formatBudgetAed(lead.budget)}
        </DetailItem>
        <DetailItem label="Created">
          {formatLeadDate(lead.createdAt)}
        </DetailItem>
        <DetailItem label="Updated">
          {formatLeadDate(lead.updatedAt)}
        </DetailItem>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-base font-semibold text-text">Form fields</h3>
        <p className="mt-1 text-sm text-text-muted">
          Values from the current saved form configuration.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {visibleFields
            .filter((field) => summaryFieldIds.has(field.id))
            .map((field) => (
              <div key={field.id}>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm text-text">
                  {field.id === CORE_FIELD_IDS.budget
                    ? formatBudgetAed(
                        typeof lead.values.budget === "number" ||
                          lead.values.budget === null
                          ? lead.values.budget
                          : lead.budget,
                      )
                    : field.id === CORE_FIELD_IDS.status
                      ? lead.status
                      : formatFieldDisplayValue(field, lead.values[field.id])}
                </dd>
              </div>
            ))}
          {customFields.map((field) => (
            <div key={field.id}>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm text-text">
                {formatFieldDisplayValue(field, lead.values[field.id])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}
