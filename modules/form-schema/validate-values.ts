import { z } from "zod";
import type {
  FieldErrors,
  FormField,
  FormSchema,
  LeadFieldValue,
  LeadValues,
  LeadValuesValidationResult,
} from "@/modules/form-schema/types";
import { isFieldVisible } from "@/modules/form-schema/visibility";

function isBlankString(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function isMissingValue(field: FormField, value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  switch (field.type) {
    case "checkbox":
      return typeof value !== "boolean";
    case "number":
      if (typeof value === "number") {
        return Number.isNaN(value);
      }
      if (typeof value === "string") {
        return value.trim() === "";
      }
      return true;
    case "text":
    case "email":
    case "dropdown":
    case "date":
      return isBlankString(value);
    default: {
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}

function validateFieldValue(
  field: FormField,
  value: unknown,
): { ok: true; value: LeadFieldValue } | { ok: false; message: string } {
  switch (field.type) {
    case "text": {
      if (typeof value !== "string") {
        return { ok: false, message: `${field.label} must be text` };
      }
      return { ok: true, value: value.trim() };
    }
    case "email": {
      if (typeof value !== "string") {
        return { ok: false, message: `${field.label} must be an email` };
      }
      const trimmed = value.trim();
      const emailResult = z.email().safeParse(trimmed);
      if (!emailResult.success) {
        return { ok: false, message: "Enter a valid email address." };
      }
      return { ok: true, value: trimmed };
    }
    case "number": {
      const numeric =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : Number.NaN;
      if (!Number.isFinite(numeric)) {
        return { ok: false, message: `${field.label} must be a number` };
      }
      return { ok: true, value: numeric };
    }
    case "dropdown": {
      if (typeof value !== "string") {
        return { ok: false, message: `${field.label} must be a selection` };
      }
      const trimmed = value.trim();
      if (!field.options?.includes(trimmed)) {
        return {
          ok: false,
          message: `${field.label} must be one of the allowed options`,
        };
      }
      return { ok: true, value: trimmed };
    }
    case "date": {
      if (typeof value !== "string") {
        return { ok: false, message: `${field.label} must be a date` };
      }
      const trimmed = value.trim();
      const isoDate = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
        .safeParse(trimmed);
      if (!isoDate.success || Number.isNaN(Date.parse(trimmed))) {
        return { ok: false, message: `${field.label} must be a valid date` };
      }
      return { ok: true, value: trimmed };
    }
    case "checkbox": {
      if (typeof value !== "boolean") {
        return { ok: false, message: `${field.label} must be true or false` };
      }
      return { ok: true, value };
    }
    default: {
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}

/**
 * Schema-driven lead value validation shared by API and future UI.
 * Hidden fields (including required ones) do not block submission.
 */
export function validateLeadValues(
  formSchema: FormSchema,
  rawValues: unknown,
): LeadValuesValidationResult {
  if (
    rawValues === null ||
    typeof rawValues !== "object" ||
    Array.isArray(rawValues)
  ) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { _form: "Values must be an object keyed by field ID" },
    };
  }

  const input = rawValues as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};
  const data: LeadValues = {};

  for (const field of formSchema.fields) {
    const visible = isFieldVisible(field, input);
    const raw = input[field.id];

    if (!visible) {
      continue;
    }

    if (isMissingValue(field, raw)) {
      if (field.required) {
        fieldErrors[field.id] = `${field.label} is required`;
      } else if (field.type === "checkbox") {
        data[field.id] = false;
      } else {
        data[field.id] = null;
      }
      continue;
    }

    if (field.type === "checkbox" && field.required && raw !== true) {
      fieldErrors[field.id] = `${field.label} is required`;
      continue;
    }

    const result = validateFieldValue(field, raw);
    if (!result.ok) {
      fieldErrors[field.id] = result.message;
      continue;
    }

    data[field.id] = result.value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors,
    };
  }

  return { success: true, data };
}

/**
 * Zod wrapper around validateLeadValues for resolvers that expect a Zod schema.
 */
export function buildLeadValuesZodSchema(formSchema: FormSchema) {
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    const result = validateLeadValues(formSchema, values);
    if (result.success) {
      return;
    }
    for (const [fieldId, message] of Object.entries(result.fieldErrors)) {
      ctx.addIssue({
        code: "custom",
        message,
        path: [fieldId],
      });
    }
  });
}
