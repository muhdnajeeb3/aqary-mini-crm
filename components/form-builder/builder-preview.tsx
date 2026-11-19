"use client";

import { DynamicLeadForm } from "@/components/dynamic-form/dynamic-lead-form";
import { Alert } from "@/components/ui/alert";
import { createEmptyLeadValues } from "@/modules/form-schema/form-values";
import type { FormSchema } from "@/modules/form-schema/types";

export function BuilderPreview({
  schema,
  onClose,
}: {
  schema: FormSchema;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <Alert variant="info">
        Preview uses the current draft configuration. Submitting here does not
        create a lead.
      </Alert>
      <DynamicLeadForm
        schema={schema}
        defaultValues={createEmptyLeadValues(schema)}
        submitLabel="Preview only"
        onCancel={onClose}
        onSubmit={async () => {
          // Intentionally no API call — preview must not create a lead.
        }}
      />
    </div>
  );
}
