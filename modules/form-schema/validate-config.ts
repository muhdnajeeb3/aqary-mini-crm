import { z } from "zod";
import {
  CORE_FIELD_ID_LIST,
  CORE_FIELD_TYPES,
  FIELD_ID_PATTERN,
  FIELD_TYPES,
  LEAD_STATUS_OPTIONS,
  type FormConfigValidationResult,
  type FormField,
  type FormSchema,
} from "@/modules/form-schema/types";

const fieldTypeSchema = z.enum(FIELD_TYPES);

const visibilityRuleSchema = z.object({
  fieldId: z.string().min(1),
  equals: z.string().min(1),
});

const formFieldSchema = z.object({
  id: z.string().min(1),
  type: fieldTypeSchema,
  label: z.string().trim().min(1, "Label is required"),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  visibility: visibilityRuleSchema.optional(),
  protected: z.boolean(),
});

const formSchemaShape = z.object({
  fields: z.array(formFieldSchema).min(1, "Form must include at least one field"),
});

function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function normalizeOptions(options: string[] | undefined): string[] | undefined {
  if (options === undefined) {
    return undefined;
  }
  return options.map((option) => option.trim());
}

/**
 * Validates a form configuration before persistence.
 * Shared for Admin Save (API) and future builder client checks.
 */
export function validateFormConfig(
  input: unknown,
): FormConfigValidationResult {
  const parsed = formSchemaShape.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid form configuration",
      details: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "schema"}: ${issue.message}`,
      ),
    };
  }

  const details: string[] = [];
  const fields: FormField[] = parsed.data.fields.map((field) => ({
    ...field,
    label: field.label.trim(),
    placeholder: field.placeholder?.trim() || undefined,
    options: normalizeOptions(field.options),
  }));

  const ids = fields.map((field) => field.id);
  if (!uniqueStrings(ids)) {
    details.push("Duplicate field IDs are not allowed");
  }

  for (const field of fields) {
    if (!FIELD_ID_PATTERN.test(field.id)) {
      details.push(
        `Field "${field.id}" has an invalid stable ID (use lowercase letters, digits, underscores)`,
      );
    }

    if (field.type === "dropdown") {
      if (!field.options || field.options.length === 0) {
        details.push(`Dropdown field "${field.id}" must include options`);
      } else {
        if (field.options.some((option) => option.length === 0)) {
          details.push(`Dropdown field "${field.id}" has an empty option`);
        }
        if (!uniqueStrings(field.options)) {
          details.push(`Dropdown field "${field.id}" has duplicate options`);
        }
      }
    } else if (field.options !== undefined && field.options.length > 0) {
      details.push(
        `Field "${field.id}" of type "${field.type}" must not define dropdown options`,
      );
    }

    if (field.visibility) {
      if (field.visibility.fieldId === field.id) {
        details.push(
          `Field "${field.id}" cannot control its own visibility`,
        );
      }
      const controller = fields.find((f) => f.id === field.visibility?.fieldId);
      if (!controller) {
        details.push(
          `Field "${field.id}" visibility references unknown field "${field.visibility.fieldId}"`,
        );
      } else if (controller.type !== "dropdown") {
        details.push(
          `Field "${field.id}" visibility must reference a dropdown field`,
        );
      } else if (
        !controller.options ||
        !controller.options.includes(field.visibility.equals)
      ) {
        details.push(
          `Field "${field.id}" visibility option "${field.visibility.equals}" is not in "${controller.id}" options`,
        );
      }
    }
  }

  for (const coreId of CORE_FIELD_ID_LIST) {
    const coreField = fields.find((field) => field.id === coreId);
    if (!coreField) {
      details.push(`Protected core field "${coreId}" cannot be removed`);
      continue;
    }

    if (coreField.type !== CORE_FIELD_TYPES[coreId]) {
      details.push(
        `Protected core field "${coreId}" type must remain "${CORE_FIELD_TYPES[coreId]}"`,
      );
    }

    if (!coreField.protected) {
      details.push(`Protected core field "${coreId}" must remain protected`);
    }

    if (coreId === "status") {
      const options = coreField.options ?? [];
      const expected = [...LEAD_STATUS_OPTIONS];
      const sameLength = options.length === expected.length;
      const sameValues =
        sameLength && expected.every((status) => options.includes(status));
      if (!sameValues) {
        details.push(
          'Status options must remain exactly "New", "Contacted", "Qualified", "Lost"',
        );
      }
    }
  }

  for (const field of fields) {
    const isCore = (CORE_FIELD_ID_LIST as readonly string[]).includes(field.id);
    if (!isCore && field.protected) {
      details.push(
        `Custom field "${field.id}" cannot be marked as protected`,
      );
    }
  }

  if (details.length > 0) {
    return {
      success: false,
      error: "Invalid form configuration",
      details,
    };
  }

  const schema: FormSchema = { fields };
  return { success: true, data: schema };
}

export function parseFormSchema(value: unknown): FormSchema {
  const result = validateFormConfig(value);
  if (!result.success) {
    throw new Error(
      `Stored form schema is invalid: ${result.details.join("; ")}`,
    );
  }
  return result.data;
}
