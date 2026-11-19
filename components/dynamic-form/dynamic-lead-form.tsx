"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DynamicField } from "@/components/dynamic-form/dynamic-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/client";
import {
  normalizeLeadValuesForSubmit,
} from "@/modules/form-schema/form-values";
import type { FormSchema, LeadValues } from "@/modules/form-schema/types";
import { validateLeadValues } from "@/modules/form-schema/validate-values";

export type DynamicLeadFormProps = {
  schema: FormSchema;
  defaultValues: LeadValues;
  submitLabel: string;
  cancelHref?: string;
  onCancel?: () => void;
  onSubmit: (values: LeadValues) => Promise<void>;
  formError?: string | null;
};

export function DynamicLeadForm({
  schema,
  defaultValues,
  submitLabel,
  cancelHref = "/leads",
  onCancel,
  onSubmit,
  formError,
}: DynamicLeadFormProps) {
  const methods = useForm<LeadValues>({
    defaultValues,
    shouldUnregister: false,
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { isSubmitting, errors },
  } = methods;

  const defaultsKey = useMemo(
    () => JSON.stringify(defaultValues),
    [defaultValues],
  );
  const lastDefaultsKey = useRef(defaultsKey);

  useEffect(() => {
    if (lastDefaultsKey.current !== defaultsKey) {
      reset(defaultValues);
      lastDefaultsKey.current = defaultsKey;
    }
  }, [defaultValues, defaultsKey, reset]);

  async function submit(values: LeadValues) {
    const normalized = normalizeLeadValuesForSubmit(schema, values);
    const clientValidation = validateLeadValues(schema, normalized);

    if (!clientValidation.success) {
      for (const [fieldId, message] of Object.entries(
        clientValidation.fieldErrors,
      )) {
        if (fieldId === "_form") {
          continue;
        }
        setError(fieldId, { type: "manual", message });
      }
      const firstId = Object.keys(clientValidation.fieldErrors).find(
        (key) => key !== "_form",
      );
      if (firstId) {
        setFocus(firstId);
      }
      return;
    }

    try {
      await onSubmit(clientValidation.data);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.fieldErrors) {
        for (const [fieldId, message] of Object.entries(error.fieldErrors)) {
          if (fieldId === "_form") {
            continue;
          }
          setError(fieldId, { type: "server", message });
        }
        const firstId = Object.keys(error.fieldErrors).find(
          (key) => key !== "_form",
        );
        if (firstId) {
          setFocus(firstId);
        }
      }
      throw error;
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            await submit(values);
          } catch {
            // Field/form errors are applied above; keep values.
          }
        })}
        className="space-y-6"
        noValidate
      >
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <h2 className="text-base font-semibold text-text">Lead information</h2>
          <p className="mt-1 text-sm text-text-muted">
            Fields follow the saved form configuration.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5">
            {schema.fields.map((field) => (
              <DynamicField key={field.id} field={field} />
            ))}
          </div>

          {Object.keys(errors).length > 0 ? (
            <p className="mt-4 text-xs text-text-muted">* Required field</p>
          ) : (
            <p className="mt-4 text-xs text-text-muted">* Required field</p>
          )}
        </div>

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : (
            <Link
              href={cancelHref}
              className="touch-target inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-page"
            >
              Cancel
            </Link>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
