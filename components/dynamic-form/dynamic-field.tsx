"use client";

import { Controller, useFormContext } from "react-hook-form";
import { FieldRenderer } from "@/components/dynamic-form/field-renderer";
import type { FormField, LeadValues } from "@/modules/form-schema/types";
import { isFieldVisible } from "@/modules/form-schema/visibility";

export function DynamicField({ field }: { field: FormField }) {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<LeadValues>();

  const values = watch();
  const visible = isFieldVisible(field, values);

  if (!visible) {
    return null;
  }

  const errorMessage = errors[field.id]?.message;
  const errorId = errorMessage ? `${field.id}-error` : undefined;

  return (
    <div className="space-y-2">
      {field.type !== "checkbox" ? (
        <label htmlFor={field.id} className="block text-sm font-medium text-text">
          {field.label}
          {field.required ? (
            <span className="text-danger" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : (
        <p className="text-sm font-medium text-text">
          {field.label}
          {field.required ? (
            <span className="text-danger" aria-hidden="true">
              {" "}
              *
            </span>
          ) : null}
        </p>
      )}

      <Controller
        name={field.id}
        control={control}
        render={({ field: controllerField }) => (
          <FieldRenderer
            field={field}
            value={controllerField.value ?? (field.type === "checkbox" ? false : field.type === "number" ? null : "")}
            onChange={controllerField.onChange}
            onBlur={controllerField.onBlur}
            invalid={Boolean(errorMessage)}
            describedBy={errorId}
          />
        )}
      />

      {errorMessage ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {String(errorMessage)}
        </p>
      ) : null}
    </div>
  );
}
