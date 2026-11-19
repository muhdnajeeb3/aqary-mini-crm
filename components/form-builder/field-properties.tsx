"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getDropdownControllers } from "@/modules/form-schema/builder";
import type { FormField, FormSchema, VisibilityRule } from "@/modules/form-schema/types";

export function FieldProperties({
  schema,
  field,
  onChange,
}: {
  schema: FormSchema;
  field: FormField | null;
  onChange: (
    fieldId: string,
    patch: Partial<
      Pick<FormField, "label" | "placeholder" | "required" | "options" | "visibility">
    >,
  ) => void;
}) {
  if (!field) {
    return (
      <section
        aria-label="Field properties"
        className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
      >
        <h2 className="text-sm font-semibold text-text">Field properties</h2>
        <p className="mt-2 text-sm text-text-muted">
          Select a field on the canvas to edit its properties.
        </p>
      </section>
    );
  }

  const selected = field;
  const controllers = getDropdownControllers(schema, selected.id);
  const controller = controllers.find(
    (item) => item.id === selected.visibility?.fieldId,
  );
  const isStatus = selected.id === "status";
  const supportsPlaceholder =
    selected.type === "text" ||
    selected.type === "email" ||
    selected.type === "number" ||
    selected.type === "date";

  function updateVisibility(next: Partial<VisibilityRule> | null) {
    if (next === null) {
      onChange(selected.id, { visibility: undefined });
      return;
    }
    const fieldId = next.fieldId ?? selected.visibility?.fieldId ?? "";
    const equals = next.equals ?? selected.visibility?.equals ?? "";
    if (!fieldId || !equals) {
      onChange(selected.id, {
        visibility: fieldId || equals ? { fieldId, equals } : undefined,
      });
      return;
    }
    onChange(selected.id, { visibility: { fieldId, equals } });
  }

  return (
    <section
      aria-label="Field properties"
      className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
    >
      <h2 className="text-sm font-semibold text-text">Field properties</h2>
      <p className="mt-1 text-xs text-text-muted">
        {field.type} / stable ID: <span className="font-mono">{field.id}</span>
      </p>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="prop-label" className="text-sm font-medium text-text">
            Label
          </label>
          <Input
            id="prop-label"
            value={field.label}
            onChange={(event) =>
              onChange(field.id, { label: event.target.value })
            }
          />
        </div>

        {supportsPlaceholder ? (
          <div className="space-y-2">
            <label
              htmlFor="prop-placeholder"
              className="text-sm font-medium text-text"
            >
              Placeholder
            </label>
            <Input
              id="prop-placeholder"
              value={field.placeholder ?? ""}
              onChange={(event) =>
                onChange(field.id, { placeholder: event.target.value })
              }
            />
          </div>
        ) : null}

        <label className="touch-target inline-flex items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-border text-primary"
            checked={field.required}
            onChange={(event) =>
              onChange(field.id, { required: event.target.checked })
            }
          />
          Required when visible
        </label>

        {field.type === "dropdown" ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text">Options</p>
            {isStatus ? (
              <p className="text-xs text-text-muted">
                Status options are fixed: New, Contacted, Qualified, Lost.
              </p>
            ) : null}
            {(field.options ?? []).map((option, index) => (
              <div key={`${field.id}-option-${index}`} className="flex gap-2">
                <Input
                  aria-label={`Option ${index + 1}`}
                  value={option}
                  disabled={isStatus}
                  onChange={(event) => {
                    const options = [...(field.options ?? [])];
                    options[index] = event.target.value;
                    onChange(field.id, { options });
                  }}
                />
                {!isStatus ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const options = (field.options ?? []).filter(
                        (_, optionIndex) => optionIndex !== index,
                      );
                      onChange(field.id, { options });
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
            {!isStatus ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onChange(field.id, {
                    options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`],
                  })
                }
              >
                Add option
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-text">Visibility condition</p>
          <p className="text-xs text-text-muted">
            Show this field when a dropdown equals an option. Hidden fields do
            not block submission.
          </p>

          <label htmlFor="visibility-field" className="text-sm text-text">
            Show this field when
          </label>
          <Select
            id="visibility-field"
            value={field.visibility?.fieldId ?? ""}
            onChange={(event) => {
              const fieldId = event.target.value;
              if (!fieldId) {
                updateVisibility(null);
                return;
              }
              const selected = controllers.find((item) => item.id === fieldId);
              updateVisibility({
                fieldId,
                equals: selected?.options?.[0] ?? "",
              });
            }}
          >
            <option value="">Always visible</option>
            {controllers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.id})
              </option>
            ))}
          </Select>

          {field.visibility?.fieldId ? (
            <>
              <label htmlFor="visibility-equals" className="text-sm text-text">
                equals
              </label>
              <Select
                id="visibility-equals"
                value={field.visibility.equals}
                onChange={(event) =>
                  updateVisibility({
                    fieldId: field.visibility?.fieldId,
                    equals: event.target.value,
                  })
                }
              >
                {(controller?.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
