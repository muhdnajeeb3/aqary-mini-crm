/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldRenderer } from "@/components/dynamic-form/field-renderer";
import type { FormField } from "@/modules/form-schema/types";

function field(partial: Partial<FormField> & Pick<FormField, "id" | "type">): FormField {
  return {
    label: partial.label ?? partial.id,
    required: partial.required ?? false,
    protected: partial.protected ?? false,
    placeholder: partial.placeholder,
    options: partial.options,
    visibility: partial.visibility,
    ...partial,
  };
}

describe("FieldRenderer", () => {
  it("renders all six field types from schema metadata", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <FieldRenderer
        field={field({
          id: "name",
          type: "text",
          label: "Name",
          placeholder: "Full name",
          required: true,
        })}
        value=""
        onChange={onChange}
      />,
    );
    expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();

    rerender(
      <FieldRenderer
        field={field({ id: "email", type: "email", label: "Email" })}
        value=""
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(
      <FieldRenderer
        field={field({ id: "budget", type: "number", label: "Budget" })}
        value={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("spinbutton")).toHaveValue(null);

    rerender(
      <FieldRenderer
        field={field({
          id: "status",
          type: "dropdown",
          label: "Status",
          options: ["New", "Lost"],
        })}
        value=""
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "New" })).toBeInTheDocument();

    rerender(
      <FieldRenderer
        field={field({ id: "viewing_date", type: "date", label: "Date" })}
        value=""
        onChange={onChange}
      />,
    );
    expect(document.getElementById("viewing_date")).toHaveAttribute(
      "type",
      "date",
    );

    rerender(
      <FieldRenderer
        field={field({ id: "newsletter", type: "checkbox", label: "News" })}
        value={false}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("keeps empty number inputs as null and zero as zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <FieldRenderer
        field={field({ id: "budget", type: "number", label: "Budget" })}
        value={null}
        onChange={onChange}
      />,
    );

    const input = screen.getByRole("spinbutton");
    await user.type(input, "0");
    expect(onChange).toHaveBeenCalledWith(0);

    onChange.mockClear();
    rerender(
      <FieldRenderer
        field={field({ id: "budget", type: "number", label: "Budget" })}
        value={0}
        onChange={onChange}
      />,
    );
    await user.clear(screen.getByRole("spinbutton"));
    expect(onChange.mock.calls.some((call) => call[0] === null)).toBe(true);
  });

  it("renders a newly added schema field without code changes", () => {
    render(
      <FieldRenderer
        field={field({
          id: "preferred_location",
          type: "text",
          label: "Preferred location",
          placeholder: "Dubai Marina",
        })}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText("Dubai Marina")).toHaveAttribute(
      "id",
      "preferred_location",
    );
  });
});
