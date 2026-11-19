"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldPalette } from "@/components/form-builder/field-palette";
import { FieldProperties } from "@/components/form-builder/field-properties";
import { FormCanvas } from "@/components/form-builder/form-canvas";
import { BuilderPreview } from "@/components/form-builder/builder-preview";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { useFormConfig } from "@/hooks/use-form-config";
import { useSaveFormConfig } from "@/hooks/use-save-form-config";
import {
  addFieldToSchema,
  cloneFormSchema,
  moveField,
  removeFieldFromSchema,
  schemasEqual,
  updateFieldInSchema,
} from "@/modules/form-schema/builder";
import { validateFormConfig } from "@/modules/form-schema/validate-config";
import type { FieldType, FormSchema } from "@/modules/form-schema/types";

type MobileTab = "palette" | "canvas" | "properties";

export function FormBuilder() {
  const formConfig = useFormConfig();
  const saveConfig = useSaveFormConfig();

  const [draft, setDraft] = useState<FormSchema | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (formConfig.data && !draft) {
      const cloned = cloneFormSchema(formConfig.data.schema);
      setDraft(cloned);
      setSelectedFieldId(cloned.fields[0]?.id ?? null);
    }
  }, [formConfig.data, draft]);

  const savedSchema = formConfig.data?.schema;
  const isDirty = useMemo(() => {
    if (!draft || !savedSchema) {
      return false;
    }
    return !schemasEqual(draft, savedSchema);
  }, [draft, savedSchema]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const selectedField =
    draft?.fields.find((field) => field.id === selectedFieldId) ?? null;

  function applyDraft(next: FormSchema) {
    setDraft(next);
    setSuccessMessage(null);
    setLocalError(null);
  }

  function handleAdd(type: FieldType) {
    if (!draft) {
      return;
    }
    const next = addFieldToSchema(draft, type);
    const added = next.fields[next.fields.length - 1];
    applyDraft(next);
    setSelectedFieldId(added?.id ?? null);
    setMobileTab("canvas");
  }

  function handleRemove(fieldId: string) {
    if (!draft) {
      return;
    }
    const field = draft.fields.find((item) => item.id === fieldId);
    if (!field || field.protected) {
      return;
    }
    const confirmed = window.confirm(
      `Remove “${field.label}”? Historical lead values for this field will be kept in the database but hidden from new forms.`,
    );
    if (!confirmed) {
      return;
    }
    const next = removeFieldFromSchema(draft, fieldId);
    applyDraft(next);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(next.fields[0]?.id ?? null);
    }
  }

  async function handleSave() {
    if (!draft) {
      return;
    }
    setLocalError(null);
    setSuccessMessage(null);

    const validation = validateFormConfig(draft);
    if (!validation.success) {
      setLocalError(validation.details[0] ?? validation.error);
      return;
    }

    try {
      const saved = await saveConfig.mutateAsync(validation.data);
      setDraft(cloneFormSchema(saved.schema));
      setSuccessMessage(`Form saved · version ${saved.version}`);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setLocalError(
          error.details?.[0] ?? error.message ?? "Could not save form",
        );
        return;
      }
      setLocalError("Could not save form. Please try again.");
    }
  }

  function handleDiscard() {
    if (!savedSchema) {
      return;
    }
    if (isDirty) {
      const confirmed = window.confirm(
        "Discard unsaved changes and reload the last saved form?",
      );
      if (!confirmed) {
        return;
      }
    }
    const cloned = cloneFormSchema(savedSchema);
    setDraft(cloned);
    setSelectedFieldId(cloned.fields[0]?.id ?? null);
    setLocalError(null);
    setSuccessMessage(null);
    setPreviewOpen(false);
  }

  if (formConfig.isLoading || !draft) {
    return (
      <div className="space-y-3" aria-busy="true">
        <p className="text-sm text-text-muted">Loading form builder…</p>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (formConfig.isError || !formConfig.data) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-text">
          Could not load form configuration
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {formConfig.error instanceof ApiClientError
            ? formConfig.error.message
            : "Please try again."}
        </p>
        <Button className="mt-4" onClick={() => formConfig.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (previewOpen) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Preview draft</h2>
            <p className="text-sm text-text-muted">
              Draft changes · Last saved version {formConfig.data.version}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
            Back to builder
          </Button>
        </div>
        <BuilderPreview schema={draft} onClose={() => setPreviewOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-text-muted">
            {isDirty ? "Draft changes" : "All changes saved"} · Last saved
            version {formConfig.data.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDiscard}
            disabled={!isDirty || saveConfig.isPending}
          >
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveConfig.isPending || !isDirty}
          >
            {saveConfig.isPending ? "Saving…" : "Save form"}
          </Button>
        </div>
      </div>

      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {localError ? <Alert variant="error">{localError}</Alert> : null}

      <div className="flex gap-2 lg:hidden" role="tablist" aria-label="Builder panels">
        {(
          [
            ["palette", "Fields"],
            ["canvas", "Canvas"],
            ["properties", "Properties"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mobileTab === id}
            className={cn(
              "touch-target flex-1 rounded-[var(--radius-md)] border px-3 text-sm font-medium",
              mobileTab === id
                ? "border-primary bg-primary-muted text-primary"
                : "border-border bg-surface text-text",
            )}
            onClick={() => setMobileTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <div className={cn(mobileTab === "palette" ? "block" : "hidden lg:block")}>
          <FieldPalette onAdd={handleAdd} disabled={saveConfig.isPending} />
        </div>

        <div className={cn(mobileTab === "canvas" ? "block" : "hidden lg:block")}>
          <FormCanvas
            schema={draft}
            selectedFieldId={selectedFieldId}
            onSelect={(fieldId) => {
              setSelectedFieldId(fieldId);
              setMobileTab("properties");
            }}
            onReorder={(fields) => applyDraft({ fields })}
            onMoveUp={(fieldId) => applyDraft(moveField(draft, fieldId, "up"))}
            onMoveDown={(fieldId) =>
              applyDraft(moveField(draft, fieldId, "down"))
            }
            onRemove={handleRemove}
          />
        </div>

        <div
          className={cn(mobileTab === "properties" ? "block" : "hidden lg:block")}
        >
          <FieldProperties
            schema={draft}
            field={selectedField}
            onChange={(fieldId, patch) =>
              applyDraft(updateFieldInSchema(draft, fieldId, patch))
            }
          />
        </div>
      </div>
    </div>
  );
}
