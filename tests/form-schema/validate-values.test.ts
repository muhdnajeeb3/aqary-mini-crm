import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import { validateLeadValues } from "@/modules/form-schema/validate-values";
import type { FormSchema } from "@/modules/form-schema/types";

function schemaWithAllTypes(): FormSchema {
  return {
    fields: [
      ...DEFAULT_FORM_SCHEMA.fields,
      {
        id: "viewing_date",
        type: "date",
        label: "Viewing date",
        required: true,
        protected: false,
      },
      {
        id: "newsletter",
        type: "checkbox",
        label: "Newsletter",
        required: false,
        protected: false,
      },
    ],
  };
}

describe("validateLeadValues", () => {
  it("validates all supported visible field types", () => {
    const result = validateLeadValues(schemaWithAllTypes(), {
      name: "Sara Ahmed",
      email: "sara@example.com",
      status: "New",
      budget: 850000,
      viewing_date: "2026-11-20",
      newsletter: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Sara Ahmed");
      expect(result.data.email).toBe("sara@example.com");
      expect(result.data.status).toBe("New");
      expect(result.data.budget).toBe(850000);
      expect(result.data.viewing_date).toBe("2026-11-20");
      expect(result.data.newsletter).toBe(true);
      expect(result.data.loss_reason).toBeUndefined();
    }
  });

  it("requires loss_reason when status is Lost", () => {
    const result = validateLeadValues(DEFAULT_FORM_SCHEMA, {
      name: "Adam Noor",
      email: "adam@example.com",
      status: "Lost",
      budget: 650000,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.loss_reason).toMatch(/required/i);
    }
  });

  it("does not require loss_reason when status is not Lost", () => {
    const result = validateLeadValues(DEFAULT_FORM_SCHEMA, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      status: "New",
      budget: 850000,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("loss_reason");
    }
  });

  it("ignores a provided loss_reason when the field is hidden", () => {
    const result = validateLeadValues(DEFAULT_FORM_SCHEMA, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      status: "Contacted",
      budget: 850000,
      loss_reason: "Should be ignored",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loss_reason).toBeUndefined();
    }
  });

  it("accepts loss_reason when visible and provided", () => {
    const result = validateLeadValues(DEFAULT_FORM_SCHEMA, {
      name: "Adam Noor",
      email: "adam@example.com",
      status: "Lost",
      budget: 650000,
      loss_reason: "Budget no longer available",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loss_reason).toBe("Budget no longer available");
    }
  });

  it("rejects invalid email and dropdown values", () => {
    const result = validateLeadValues(DEFAULT_FORM_SCHEMA, {
      name: "Sara",
      email: "sara@",
      status: "Nope",
      budget: 100,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.email).toMatch(/email/i);
      expect(result.fieldErrors.status).toMatch(/allowed options/i);
    }
  });
});
