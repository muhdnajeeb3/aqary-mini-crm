import type {
  FormField,
  FormSchema,
  LeadFieldValue,
  LeadValues,
} from "@/modules/form-schema/types";

export function emptyValueForField(field: FormField): LeadFieldValue {
  switch (field.type) {
    case "checkbox":
      return false;
    case "number":
      return null;
    case "text":
    case "email":
    case "dropdown":
    case "date":
      return "";
    default: {
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}

/** Empty defaults for every field in the current schema. */
export function createEmptyLeadValues(schema: FormSchema): LeadValues {
  const values: LeadValues = {};
  for (const field of schema.fields) {
    values[field.id] = emptyValueForField(field);
  }
  return values;
}

/**
 * Populate form values from a lead DTO projected onto the current schema.
 * Missing / null values become type-appropriate empties.
 */
export function leadValuesForForm(
  schema: FormSchema,
  leadValues: LeadValues,
): LeadValues {
  const values: LeadValues = {};
  for (const field of schema.fields) {
    const raw = leadValues[field.id];
    if (raw === undefined || raw === null) {
      values[field.id] = emptyValueForField(field);
      continue;
    }
    values[field.id] = raw;
  }
  return values;
}

/**
 * Normalize form state for API submission.
 * Keeps hidden field values in the payload so they are not treated as cleared;
 * the server ignores hidden fields for validation and customValues updates.
 */
export function normalizeLeadValuesForSubmit(
  schema: FormSchema,
  values: LeadValues,
): LeadValues {
  const next: LeadValues = {};

  for (const field of schema.fields) {
    const raw = values[field.id];

    switch (field.type) {
      case "checkbox":
        next[field.id] = typeof raw === "boolean" ? raw : false;
        break;
      case "number":
        if (raw === null || raw === undefined || raw === "") {
          next[field.id] = null;
        } else if (typeof raw === "number") {
          next[field.id] = raw;
        } else if (typeof raw === "string" && raw.trim() !== "") {
          const numeric = Number(raw);
          next[field.id] = Number.isFinite(numeric) ? numeric : null;
        } else {
          next[field.id] = null;
        }
        break;
      case "text":
      case "email":
      case "dropdown":
      case "date":
        next[field.id] = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
        break;
      default: {
        const _exhaustive: never = field.type;
        return _exhaustive;
      }
    }
  }

  return next;
}

export function formatFieldDisplayValue(
  field: FormField,
  value: LeadFieldValue | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  switch (field.type) {
    case "checkbox":
      return value === true ? "Yes" : "No";
    case "number":
      if (typeof value !== "number") {
        return "—";
      }
      return new Intl.NumberFormat("en-AE", {
        maximumFractionDigits: 0,
      }).format(value);
    default:
      return String(value);
  }
}
