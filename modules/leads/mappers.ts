import type { Lead, LeadStatus, Prisma } from "@prisma/client";
import {
  CORE_FIELD_IDS,
  CORE_FIELD_ID_LIST,
  type CustomFieldValues,
  type FormSchema,
  type LeadFieldValue,
  type LeadValues,
} from "@/modules/form-schema/types";
import { isFieldVisible } from "@/modules/form-schema/visibility";
import type { LeadDto } from "@/modules/leads/types";

export function isCoreFieldId(fieldId: string): boolean {
  return (CORE_FIELD_ID_LIST as readonly string[]).includes(fieldId);
}

export function parseCustomValues(value: unknown): CustomFieldValues {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: CustomFieldValues = {};
  for (const [key, entry] of Object.entries(value)) {
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean" ||
      entry === null
    ) {
      result[key] = entry;
    }
  }
  return result;
}

export function leadRowToStoredValues(lead: Lead): LeadValues {
  const custom = parseCustomValues(lead.customValues);
  return {
    ...custom,
    [CORE_FIELD_IDS.name]: lead.name,
    [CORE_FIELD_IDS.email]: lead.email,
    [CORE_FIELD_IDS.status]: lead.status,
    [CORE_FIELD_IDS.budget]: lead.budget,
  };
}

/**
 * Project a lead onto the current form schema.
 * Missing custom fields (e.g. newly added) become null without a DB migration.
 */
export function leadToDto(lead: Lead, schema: FormSchema): LeadDto {
  const stored = leadRowToStoredValues(lead);
  const customValues = parseCustomValues(lead.customValues);
  const values: LeadValues = {};

  for (const field of schema.fields) {
    if (Object.prototype.hasOwnProperty.call(stored, field.id)) {
      values[field.id] = stored[field.id] ?? null;
    } else {
      values[field.id] = null;
    }
  }

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    status: lead.status,
    budget: lead.budget,
    customValues,
    values,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function budgetForPersistence(
  value: LeadFieldValue | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

export function statusForPersistence(value: LeadFieldValue): LeadStatus {
  return value as LeadStatus;
}

export function validatedValuesToCreateInput(
  validated: LeadValues,
  schema: FormSchema,
): Prisma.LeadCreateInput {
  const customValues: CustomFieldValues = {};

  for (const field of schema.fields) {
    if (isCoreFieldId(field.id)) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(validated, field.id)) {
      customValues[field.id] = validated[field.id] ?? null;
    }
  }

  return {
    name: String(validated[CORE_FIELD_IDS.name] ?? ""),
    email: String(validated[CORE_FIELD_IDS.email] ?? ""),
    status: statusForPersistence(validated[CORE_FIELD_IDS.status] ?? "New"),
    budget: budgetForPersistence(validated[CORE_FIELD_IDS.budget]),
    customValues,
  };
}

/**
 * Merge PATCH `values` onto stored lead values.
 * Omitted keys keep their existing values (never treated as empty).
 */
export function mergeLeadValues(
  existing: LeadValues,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...existing,
    ...patch,
  };
}

/**
 * Update customValues for currently visible schema fields only.
 * Hidden fields and removed-schema keys are preserved unchanged.
 */
export function mergeCustomValuesForUpdate(options: {
  existingCustomValues: CustomFieldValues;
  schema: FormSchema;
  validated: LeadValues;
  visibilityValues: Record<string, unknown>;
}): CustomFieldValues {
  const next: CustomFieldValues = { ...options.existingCustomValues };

  for (const field of options.schema.fields) {
    if (isCoreFieldId(field.id)) {
      continue;
    }

    if (!isFieldVisible(field, options.visibilityValues)) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(options.validated, field.id)) {
      next[field.id] = options.validated[field.id] ?? null;
    }
  }

  return next;
}

export function validatedValuesToUpdateInput(
  validated: LeadValues,
  schema: FormSchema,
  existingCustomValues: CustomFieldValues,
  visibilityValues: Record<string, unknown>,
): Prisma.LeadUpdateInput {
  return {
    name: String(validated[CORE_FIELD_IDS.name] ?? ""),
    email: String(validated[CORE_FIELD_IDS.email] ?? ""),
    status: statusForPersistence(validated[CORE_FIELD_IDS.status] ?? "New"),
    budget: budgetForPersistence(validated[CORE_FIELD_IDS.budget]),
    customValues: mergeCustomValuesForUpdate({
      existingCustomValues,
      schema,
      validated,
      visibilityValues,
    }),
  };
}

/** Strip client attempts to smuggle server-managed keys into `values`. */
export function sanitizeClientValues(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const forbidden = new Set([
    "id",
    "createdAt",
    "updatedAt",
    "customValues",
  ]);
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (forbidden.has(key)) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}
