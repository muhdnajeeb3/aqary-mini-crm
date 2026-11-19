import { prisma } from "@/lib/db";
import { ConfigValidationError, HttpError } from "@/lib/api/http";
import {
  parseFormSchema,
  validateFormConfig,
} from "@/modules/form-schema/validate-config";
import type { FormSchema } from "@/modules/form-schema/types";

export type FormConfigDto = {
  id: string;
  version: number;
  schema: FormSchema;
  updatedAt: string;
};

async function getActiveDefinition() {
  const definition = await prisma.formDefinition.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!definition) {
    throw new HttpError(404, "Form configuration not found");
  }

  return definition;
}

export async function getFormConfig(): Promise<FormConfigDto> {
  const definition = await getActiveDefinition();
  const schema = parseFormSchema(definition.schemaJson);

  return {
    id: definition.id,
    version: definition.version,
    schema,
    updatedAt: definition.updatedAt.toISOString(),
  };
}

/**
 * Persists a validated schema and increments version.
 * Draft builder state must not call this until Admin Save.
 */
export async function saveFormConfig(input: unknown): Promise<FormConfigDto> {
  const validation = validateFormConfig(input);
  if (!validation.success) {
    throw new ConfigValidationError(validation.error, validation.details);
  }

  const definition = await getActiveDefinition();

  const updated = await prisma.formDefinition.update({
    where: { id: definition.id },
    data: {
      schemaJson: validation.data,
      version: { increment: 1 },
    },
  });

  return {
    id: updated.id,
    version: updated.version,
    schema: validation.data,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
