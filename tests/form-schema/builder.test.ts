import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import {
  addFieldToSchema,
  createPaletteField,
  generateUniqueFieldId,
  getDropdownControllers,
  moveField,
  removeFieldFromSchema,
  reorderFields,
  updateFieldInSchema,
} from "@/modules/form-schema/builder";
import { validateFormConfig } from "@/modules/form-schema/validate-config";
import { FIELD_TYPES } from "@/modules/form-schema/types";

describe("form builder helpers", () => {
  it("adds all six field types with stable unique IDs", () => {
    let schema = structuredClone(DEFAULT_FORM_SCHEMA);
    for (const type of FIELD_TYPES) {
      schema = addFieldToSchema(schema, type);
    }
    const ids = schema.fields.map((field) => field.id);
    expect(new Set(ids).size).toBe(ids.length);

    const custom = schema.fields.filter((field) => !field.protected);
    expect(custom.length).toBeGreaterThanOrEqual(6);
    expect(validateFormConfig(schema).success).toBe(true);
  });

  it("keeps IDs stable when editing and reordering", () => {
    let schema = addFieldToSchema(DEFAULT_FORM_SCHEMA, "text");
    const custom = schema.fields[schema.fields.length - 1];
    expect(custom).toBeDefined();
    const stableId = custom!.id;

    schema = updateFieldInSchema(schema, stableId, {
      label: "Preferred location",
      placeholder: "Dubai Marina",
      required: true,
    });
    expect(schema.fields.find((field) => field.id === stableId)?.label).toBe(
      "Preferred location",
    );

    schema = moveField(schema, stableId, "up");
    expect(schema.fields.find((field) => field.id === stableId)?.id).toBe(
      stableId,
    );

    const from = schema.fields.findIndex((field) => field.id === stableId);
    schema = reorderFields(schema, from, 0);
    expect(schema.fields[0]?.id).toBe(stableId);
  });

  it("cannot remove core fields or change their type/id via helpers", () => {
    const afterRemove = removeFieldFromSchema(DEFAULT_FORM_SCHEMA, "email");
    expect(afterRemove.fields.some((field) => field.id === "email")).toBe(true);

    const patched = updateFieldInSchema(DEFAULT_FORM_SCHEMA, "name", {
      label: "Client name",
    });
    const name = patched.fields.find((field) => field.id === "name");
    expect(name?.type).toBe("text");
    expect(name?.id).toBe("name");
    expect(name?.protected).toBe(true);
  });

  it("rejects empty/duplicate dropdown options and fixed status options", () => {
    let schema = addFieldToSchema(DEFAULT_FORM_SCHEMA, "dropdown");
    const dropdown = schema.fields[schema.fields.length - 1]!;
    schema = updateFieldInSchema(schema, dropdown.id, {
      options: ["A", "A", ""],
    });
    const invalid = validateFormConfig(schema);
    expect(invalid.success).toBe(false);

    const statusBroken = updateFieldInSchema(DEFAULT_FORM_SCHEMA, "status", {
      options: ["New", "Won"],
    });
    // updateFieldInSchema preserves status options
    expect(
      statusBroken.fields.find((field) => field.id === "status")?.options,
    ).toEqual(["New", "Contacted", "Qualified", "Lost"]);
  });

  it("supports Status = Lost visibility and rejects self-control", () => {
    const withVisibility = updateFieldInSchema(
      DEFAULT_FORM_SCHEMA,
      "loss_reason",
      {
        visibility: { fieldId: "status", equals: "Lost" },
      },
    );
    expect(validateFormConfig(withVisibility).success).toBe(true);

    const selfControl = updateFieldInSchema(DEFAULT_FORM_SCHEMA, "status", {
      visibility: { fieldId: "status", equals: "Lost" },
    });
    const selfResult = validateFormConfig(selfControl);
    expect(selfResult.success).toBe(false);
    if (!selfResult.success) {
      expect(
        selfResult.details.some((detail) =>
          detail.includes("cannot control its own visibility"),
        ),
      ).toBe(true);
    }

    const controllers = getDropdownControllers(DEFAULT_FORM_SCHEMA, "status");
    expect(controllers.every((field) => field.id !== "status")).toBe(true);

    const ids = ["name", "email"];
    expect(generateUniqueFieldId("text", ids)).toBe("text");
    expect(createPaletteField("checkbox", ids).type).toBe("checkbox");

    const bad = updateFieldInSchema(DEFAULT_FORM_SCHEMA, "loss_reason", {
      visibility: { fieldId: "status", equals: "Nope" },
    });
    expect(validateFormConfig(bad).success).toBe(false);
  });

  it("removing a custom field only changes schema, not lead data concerns", () => {
    let schema = addFieldToSchema(DEFAULT_FORM_SCHEMA, "text");
    const id = schema.fields[schema.fields.length - 1]!.id;
    schema = removeFieldFromSchema(schema, id);
    expect(schema.fields.some((field) => field.id === id)).toBe(false);
    expect(schema.fields.some((field) => field.id === "name")).toBe(true);
  });
});
