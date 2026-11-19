"use client";

import { Button } from "@/components/ui/button";
import { PALETTE_FIELD_TYPES } from "@/modules/form-schema/builder";
import type { FieldType } from "@/modules/form-schema/types";

const LABELS: Record<FieldType, string> = {
  text: "Text",
  email: "Email",
  number: "Number",
  dropdown: "Dropdown",
  date: "Date",
  checkbox: "Checkbox",
};

export function FieldPalette({
  onAdd,
  disabled,
}: {
  onAdd: (type: FieldType) => void;
  disabled?: boolean;
}) {
  return (
    <section
      aria-label="Field palette"
      className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
    >
      <h2 className="text-sm font-semibold text-text">Field palette</h2>
      <p className="mt-1 text-xs text-text-muted">
        Add a field to the canvas
      </p>
      <div className="mt-4 grid gap-2">
        {PALETTE_FIELD_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="secondary"
            className="justify-start"
            disabled={disabled}
            onClick={() => onAdd(type)}
          >
            + {LABELS[type]}
          </Button>
        ))}
      </div>
    </section>
  );
}
