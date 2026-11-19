export const FIELD_TYPES = [
  "text",
  "email",
  "number",
  "dropdown",
  "date",
  "checkbox",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const LEAD_STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Qualified",
  "Lost",
] as const;

export type LeadStatusOption = (typeof LEAD_STATUS_OPTIONS)[number];

export const CORE_FIELD_IDS = {
  name: "name",
  email: "email",
  status: "status",
  budget: "budget",
} as const;

export type CoreFieldId = (typeof CORE_FIELD_IDS)[keyof typeof CORE_FIELD_IDS];

export const CORE_FIELD_ID_LIST: readonly CoreFieldId[] = [
  CORE_FIELD_IDS.name,
  CORE_FIELD_IDS.email,
  CORE_FIELD_IDS.status,
  CORE_FIELD_IDS.budget,
] as const;

export const CORE_FIELD_TYPES = {
  name: "text",
  email: "email",
  status: "dropdown",
  budget: "number",
} as const satisfies Record<CoreFieldId, FieldType>;

export const LOSS_REASON_FIELD_ID = "loss_reason" as const;

/** Stable field IDs: lowercase letter, then letters/digits/underscores. */
export const FIELD_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * Visibility rule: show this field when a controlling dropdown equals an option.
 * Assignment example: Loss reason when Status equals Lost.
 */
export type VisibilityRule = {
  fieldId: string;
  equals: string;
};

/** @deprecated Use VisibilityRule */
export type VisibilityCondition = VisibilityRule;

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  visibility?: VisibilityRule;
  /** Core fields cannot be removed or change type. */
  protected: boolean;
};

/** @deprecated Use FormField */
export type FormFieldDefinition = FormField;

export type FormSchema = {
  fields: FormField[];
};

export type LeadFieldValue = string | number | boolean | null;

export type LeadValues = Record<string, LeadFieldValue>;

export type CustomFieldValues = Record<string, LeadFieldValue>;

export type FieldErrors = Record<string, string>;

export type FormConfigValidationSuccess = {
  success: true;
  data: FormSchema;
};

export type FormConfigValidationFailure = {
  success: false;
  error: string;
  details: string[];
};

export type FormConfigValidationResult =
  | FormConfigValidationSuccess
  | FormConfigValidationFailure;

export type LeadValuesValidationSuccess = {
  success: true;
  data: LeadValues;
};

export type LeadValuesValidationFailure = {
  success: false;
  error: string;
  fieldErrors: FieldErrors;
};

export type LeadValuesValidationResult =
  | LeadValuesValidationSuccess
  | LeadValuesValidationFailure;
