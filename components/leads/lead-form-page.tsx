"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DynamicLeadForm } from "@/components/dynamic-form/dynamic-lead-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/client";
import { useFormConfig } from "@/hooks/use-form-config";
import { useCreateLead, useLead, useUpdateLead } from "@/hooks/use-lead";
import {
  createEmptyLeadValues,
  leadValuesForForm,
} from "@/modules/form-schema/form-values";
import type { LeadValues } from "@/modules/form-schema/types";

export function CreateLeadFormPage() {
  const router = useRouter();
  const formConfig = useFormConfig();
  const createLead = useCreateLead();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultValues = useMemo(() => {
    if (!formConfig.data) {
      return null;
    }
    return createEmptyLeadValues(formConfig.data.schema);
  }, [formConfig.data]);

  if (formConfig.isLoading) {
    return <FormLoadingState label="Loading form…" />;
  }

  if (formConfig.isError || !formConfig.data || !defaultValues) {
    return (
      <ErrorPanel
        title="Could not load form"
        message={
          formConfig.error instanceof ApiClientError
            ? formConfig.error.message
            : "Please try again."
        }
        onRetry={() => formConfig.refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {successMessage ? (
        <Alert variant="success" aria-live="polite">
          {successMessage}
        </Alert>
      ) : null}
      <DynamicLeadForm
        schema={formConfig.data.schema}
        defaultValues={defaultValues}
        submitLabel="Create lead"
        cancelHref="/leads"
        formError={formError}
        onSubmit={async (values: LeadValues) => {
          setFormError(null);
          try {
            const lead = await createLead.mutateAsync(values);
            setSuccessMessage("Lead created successfully.");
            router.push(`/leads/${lead.id}`);
            router.refresh();
          } catch (error: unknown) {
            if (error instanceof ApiClientError) {
              if (!error.fieldErrors) {
                setFormError(error.message);
              }
              throw error;
            }
            setFormError("Could not create lead. Please try again.");
            throw error;
          }
        }}
      />
    </div>
  );
}

export function EditLeadFormPage({ leadId }: { leadId: string }) {
  const router = useRouter();
  const formConfig = useFormConfig();
  const leadQuery = useLead(leadId);
  const updateLead = useUpdateLead(leadId);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo(() => {
    if (!formConfig.data || !leadQuery.data) {
      return null;
    }
    return leadValuesForForm(formConfig.data.schema, leadQuery.data.values);
  }, [formConfig.data, leadQuery.data]);

  if (formConfig.isLoading || leadQuery.isLoading) {
    return <FormLoadingState label="Loading lead…" />;
  }

  if (
    leadQuery.error instanceof ApiClientError &&
    leadQuery.error.status === 404
  ) {
    return (
      <ErrorPanel
        title="Lead not found"
        message="This lead may have been removed."
      />
    );
  }

  if (
    formConfig.isError ||
    leadQuery.isError ||
    !formConfig.data ||
    !leadQuery.data ||
    !defaultValues
  ) {
    return (
      <ErrorPanel
        title="Could not load lead"
        message={
          leadQuery.error instanceof ApiClientError
            ? leadQuery.error.message
            : formConfig.error instanceof ApiClientError
              ? formConfig.error.message
              : "Please try again."
        }
        onRetry={() => {
          void formConfig.refetch();
          void leadQuery.refetch();
        }}
      />
    );
  }

  return (
    <DynamicLeadForm
      schema={formConfig.data.schema}
      defaultValues={defaultValues}
      submitLabel="Save changes"
      cancelHref={`/leads/${leadId}`}
      formError={formError}
      onSubmit={async (values: LeadValues) => {
        setFormError(null);
        try {
          // Send full current-schema values so omitted fields are never cleared.
          const lead = await updateLead.mutateAsync(values);
          router.push(`/leads/${lead.id}`);
          router.refresh();
        } catch (error: unknown) {
          if (error instanceof ApiClientError) {
            if (!error.fieldErrors) {
              setFormError(error.message);
            }
            throw error;
          }
          setFormError("Could not save lead. Please try again.");
          throw error;
        }
      }}
    />
  );
}

function FormLoadingState({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-text-muted">{label}</p>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

function ErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="mt-1 text-sm text-text-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
