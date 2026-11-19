import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import {
  createEmptyLeadValues,
  leadValuesForForm,
  normalizeLeadValuesForSubmit,
} from "@/modules/form-schema/form-values";
import type { FormSchema } from "@/modules/form-schema/types";

describe("form values helpers", () => {
  it("creates empty defaults for every schema field", () => {
    const values = createEmptyLeadValues(DEFAULT_FORM_SCHEMA);
    expect(values.name).toBe("");
    expect(values.email).toBe("");
    expect(values.status).toBe("");
    expect(values.budget).toBeNull();
    expect(values.loss_reason).toBe("");
  });

  it("keeps empty budget as null and zero as zero on submit", () => {
    const emptyBudget = normalizeLeadValuesForSubmit(DEFAULT_FORM_SCHEMA, {
      ...createEmptyLeadValues(DEFAULT_FORM_SCHEMA),
      name: "Sara",
      email: "sara@example.com",
      status: "New",
      budget: null,
    });
    expect(emptyBudget.budget).toBeNull();

    const zeroBudget = normalizeLeadValuesForSubmit(DEFAULT_FORM_SCHEMA, {
      ...createEmptyLeadValues(DEFAULT_FORM_SCHEMA),
      name: "Sara",
      email: "sara@example.com",
      status: "New",
      budget: 0,
    });
    expect(zeroBudget.budget).toBe(0);
  });

  it("initializes newly added schema fields as empty for older leads", () => {
    const schema: FormSchema = {
      fields: [
        ...DEFAULT_FORM_SCHEMA.fields,
        {
          id: "preferred_location",
          type: "text",
          label: "Preferred location",
          required: false,
          protected: false,
        },
      ],
    };

    const values = leadValuesForForm(schema, {
      name: "Adam",
      email: "adam@example.com",
      status: "Lost",
      budget: 650000,
      loss_reason: "Budget",
    });

    expect(values.preferred_location).toBe("");
    expect(values.loss_reason).toBe("Budget");
  });
});
