import {
  CORE_FIELD_ID_LIST,
  FIELD_TYPES,
  type FieldType,
  type FormField,
  type FormSchema,
  type VisibilityRule,
} from "@/modules/form-schema/types";

const CORE_ID_SET = new Set<string>(CORE_FIELD_ID_LIST);

export const PALETTE_FIELD_TYPES: readonly FieldType[] = FIELD_TYPES;

export function cloneFormSchema(schema: FormSchema): FormSchema {
  return structuredClone(schema);
}

export function schemasEqual(a: FormSchema, b: FormSchema): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function generateUniqueFieldId(
  type: FieldType,
  existingIds: Iterable<string>,
): string {
  const used = new Set(existingIds);
  const base = type === "dropdown" ? "select" : type;
  if (!used.has(base) && !CORE_ID_SET.has(base)) {
    return base;
  }
  let index = 1;
  while (used.has(`${base}_${index}`) || CORE_ID_SET.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

export function createPaletteField(
  type: FieldType,
  existingIds: Iterable<string>,
): FormField {
  const id = generateUniqueFieldId(type, existingIds);
  const labels: Record<FieldType, string> = {
    text: "Text field",
    email: "Email field",
    number: "Number field",
    dropdown: "Dropdown field",
    date: "Date field",
    checkbox: "Checkbox field",
  };

  const field: FormField = {
    id,
    type,
    label: labels[type],
    required: false,
    protected: false,
  };

  if (type === "dropdown") {
    field.options = ["Option 1", "Option 2"];
  }

  if (type === "text" || type === "email" || type === "number" || type === "date") {
    field.placeholder = "";
  }

  return field;
}

export function addFieldToSchema(
  schema: FormSchema,
  type: FieldType,
): FormSchema {
  const next = cloneFormSchema(schema);
  const ids = next.fields.map((field) => field.id);
  next.fields.push(createPaletteField(type, ids));
  return next;
}

export function updateFieldInSchema(
  schema: FormSchema,
  fieldId: string,
  patch: Partial<
    Pick<
      FormField,
      "label" | "placeholder" | "required" | "options" | "visibility"
    >
  >,
): FormSchema {
  const next = cloneFormSchema(schema);
  const index = next.fields.findIndex((field) => field.id === fieldId);
  if (index < 0) {
    return schema;
  }

  const current = next.fields[index];
  if (!current) {
    return schema;
  }

  // Never allow ID/type/protected mutation through the builder patch API.
  next.fields[index] = {
    ...current,
    label: patch.label ?? current.label,
    placeholder:
      patch.placeholder === undefined ? current.placeholder : patch.placeholder,
    required: patch.required ?? current.required,
    options: patch.options === undefined ? current.options : patch.options,
    visibility:
      patch.visibility === undefined ? current.visibility : patch.visibility,
    id: current.id,
    type: current.type,
    protected: current.protected,
  };

  if (current.id === "status") {
    next.fields[index] = {
      ...next.fields[index],
      options: current.options,
    };
  }

  return next;
}

export function removeFieldFromSchema(
  schema: FormSchema,
  fieldId: string,
): FormSchema {
  if (CORE_ID_SET.has(fieldId)) {
    return schema;
  }
  return {
    fields: schema.fields.filter((field) => field.id !== fieldId),
  };
}

export function moveField(
  schema: FormSchema,
  fieldId: string,
  direction: "up" | "down",
): FormSchema {
  const index = schema.fields.findIndex((field) => field.id === fieldId);
  if (index < 0) {
    return schema;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= schema.fields.length) {
    return schema;
  }
  return reorderFields(schema, index, target);
}

export function reorderFields(
  schema: FormSchema,
  fromIndex: number,
  toIndex: number,
): FormSchema {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= schema.fields.length ||
    toIndex >= schema.fields.length
  ) {
    return schema;
  }
  const next = cloneFormSchema(schema);
  const [moved] = next.fields.splice(fromIndex, 1);
  if (!moved) {
    return schema;
  }
  next.fields.splice(toIndex, 0, moved);
  return next;
}

export function setFieldVisibility(
  schema: FormSchema,
  fieldId: string,
  visibility: VisibilityRule | undefined,
): FormSchema {
  return updateFieldInSchema(schema, fieldId, { visibility });
}

export function getDropdownControllers(
  schema: FormSchema,
  excludeFieldId?: string,
): FormField[] {
  return schema.fields.filter(
    (field) =>
      field.type === "dropdown" &&
      field.id !== excludeFieldId &&
      (field.options?.length ?? 0) > 0,
  );
}
