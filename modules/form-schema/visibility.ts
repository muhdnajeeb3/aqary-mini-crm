import type { FormField, LeadValues } from "@/modules/form-schema/types";

/**
 * A field without a visibility rule is always visible.
 * Otherwise it is visible only when the controlling field equals the configured option.
 */
export function isFieldVisible(
  field: FormField,
  values: Partial<LeadValues> | Record<string, unknown>,
): boolean {
  if (!field.visibility) {
    return true;
  }

  const controllingValue = values[field.visibility.fieldId];
  return controllingValue === field.visibility.equals;
}
