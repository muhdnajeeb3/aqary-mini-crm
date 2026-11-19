import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import { validateFormConfig } from "@/modules/form-schema/validate-config";
import type { FormSchema } from "@/modules/form-schema/types";

function cloneSchema(): FormSchema {
  return structuredClone(DEFAULT_FORM_SCHEMA);
}

describe("validateFormConfig", () => {
  it("accepts the default schema with all supported field types seeds", () => {
    const result = validateFormConfig(DEFAULT_FORM_SCHEMA);
    expect(result.success).toBe(true);
  });

  it("accepts adding custom fields of every supported type", () => {
    const schema = cloneSchema();
    schema.fields.push(
      {
        id: "preferred_location",
        type: "text",
        label: "Preferred location",
        required: false,
        protected: false,
      },
      {
        id: "viewing_date",
        type: "date",
        label: "Viewing date",
        required: false,
        protected: false,
      },
      {
        id: "newsletter",
        type: "checkbox",
        label: "Subscribe",
        required: false,
        protected: false,
      },
      {
        id: "priority",
        type: "dropdown",
        label: "Priority",
        required: false,
        protected: false,
        options: ["Low", "High"],
      },
    );

    const result = validateFormConfig(schema);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate field IDs", () => {
    const schema = cloneSchema();
    schema.fields.push({
      id: "name",
      type: "text",
      label: "Another name",
      required: false,
      protected: false,
    });

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.some((d) => d.includes("Duplicate"))).toBe(true);
    }
  });

  it("rejects removing a protected core field", () => {
    const schema = cloneSchema();
    schema.fields = schema.fields.filter((field) => field.id !== "email");

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.details.some((d) => d.includes('core field "email"')),
      ).toBe(true);
    }
  });

  it("rejects changing a core field type", () => {
    const schema = cloneSchema();
    const name = schema.fields.find((field) => field.id === "name");
    expect(name).toBeDefined();
    if (name) {
      name.type = "number";
    }

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.some((d) => d.includes('type must remain'))).toBe(
        true,
      );
    }
  });

  it("allows renaming and reordering core fields", () => {
    const schema = cloneSchema();
    const budget = schema.fields.find((field) => field.id === "budget");
    const name = schema.fields.find((field) => field.id === "name");
    expect(budget && name).toBeTruthy();
    if (budget && name) {
      budget.label = "Purchase budget";
      name.label = "Client name";
    }
    schema.fields = [
      schema.fields[3],
      schema.fields[0],
      schema.fields[1],
      schema.fields[2],
      schema.fields[4],
    ];

    const result = validateFormConfig(schema);
    expect(result.success).toBe(true);
  });

  it("rejects invalid or duplicate dropdown options", () => {
    const schema = cloneSchema();
    schema.fields.push({
      id: "source",
      type: "dropdown",
      label: "Source",
      required: false,
      protected: false,
      options: ["Web", "Web", ""],
    });

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.some((d) => d.includes("duplicate options"))).toBe(
        true,
      );
      expect(result.details.some((d) => d.includes("empty option"))).toBe(true);
    }
  });

  it("rejects changing fixed status options", () => {
    const schema = cloneSchema();
    const status = schema.fields.find((field) => field.id === "status");
    expect(status).toBeDefined();
    if (status) {
      status.options = ["New", "Contacted", "Won"];
    }

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.some((d) => d.includes("Status options"))).toBe(
        true,
      );
    }
  });

  it("rejects invalid visibility conditions", () => {
    const schema = cloneSchema();
    const loss = schema.fields.find((field) => field.id === "loss_reason");
    expect(loss).toBeDefined();
    if (loss) {
      loss.visibility = { fieldId: "status", equals: "Missing" };
    }

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.some((d) => d.includes("visibility option"))).toBe(
        true,
      );
    }
  });

  it("rejects a field controlling its own visibility", () => {
    const schema = cloneSchema();
    const status = schema.fields.find((field) => field.id === "status");
    expect(status).toBeDefined();
    if (status) {
      status.visibility = { fieldId: "status", equals: "Lost" };
    }

    const result = validateFormConfig(schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.details.some((d) =>
          d.includes("cannot control its own visibility"),
        ),
      ).toBe(true);
    }
  });

  it("accepts a valid visibility rule on a dropdown option", () => {
    const schema = cloneSchema();
    const loss = schema.fields.find((field) => field.id === "loss_reason");
    expect(loss?.visibility).toEqual({ fieldId: "status", equals: "Lost" });

    const result = validateFormConfig(schema);
    expect(result.success).toBe(true);
  });
});
