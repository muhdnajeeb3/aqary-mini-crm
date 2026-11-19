import {
  CORE_FIELD_IDS,
  LEAD_STATUS_OPTIONS,
  LOSS_REASON_FIELD_ID,
  type FormSchema,
} from "@/modules/form-schema/types";

/** Initial saved form definition: four protected core fields + Loss reason. */
export const DEFAULT_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      id: CORE_FIELD_IDS.name,
      type: "text",
      label: "Name",
      placeholder: "Full name",
      required: true,
      protected: true,
    },
    {
      id: CORE_FIELD_IDS.email,
      type: "email",
      label: "Email",
      placeholder: "name@example.com",
      required: true,
      protected: true,
    },
    {
      id: CORE_FIELD_IDS.status,
      type: "dropdown",
      label: "Status",
      required: true,
      options: [...LEAD_STATUS_OPTIONS],
      protected: true,
    },
    {
      id: CORE_FIELD_IDS.budget,
      type: "number",
      label: "Budget (AED)",
      placeholder: "850000",
      required: false,
      protected: true,
    },
    {
      id: LOSS_REASON_FIELD_ID,
      type: "text",
      label: "Loss reason",
      placeholder: "Why was this lead lost?",
      required: true,
      protected: false,
      visibility: {
        fieldId: CORE_FIELD_IDS.status,
        equals: "Lost",
      },
    },
  ],
};
