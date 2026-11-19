"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import type { FormField, LeadFieldValue } from "@/modules/form-schema/types";

export type FieldRendererProps = {
  field: FormField;
  value: LeadFieldValue;
  onChange: (value: LeadFieldValue) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
};

export function FieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
}: FieldRendererProps) {
  const common = {
    id: field.id,
    name: field.id,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    onBlur,
  };

  switch (field.type) {
    case "text":
    case "email":
    case "date":
      return (
        <Input
          {...common}
          type={field.type === "text" ? "text" : field.type}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "number":
      return (
        <Input
          {...common}
          type="number"
          inputMode="decimal"
          placeholder={field.placeholder}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const numeric = Number(raw);
            onChange(Number.isFinite(numeric) ? numeric : null);
          }}
        />
      );
    case "dropdown":
      return (
        <Select
          {...common}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    case "checkbox":
      return (
        <label className="touch-target inline-flex items-center gap-3 text-sm text-text">
          <input
            {...common}
            type="checkbox"
            className={cn(
              "h-5 w-5 rounded border-border text-primary",
              invalid ? "outline outline-2 outline-danger" : undefined,
            )}
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{field.placeholder ?? field.label}</span>
        </label>
      );
    default: {
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}
