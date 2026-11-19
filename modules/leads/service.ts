import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FieldValidationError, HttpError } from "@/lib/api/http";
import { getFormConfig } from "@/modules/form-schema/service";
import { validateLeadValues } from "@/modules/form-schema/validate-values";
import {
  leadRowToStoredValues,
  leadToDto,
  mergeLeadValues,
  parseCustomValues,
  sanitizeClientValues,
  validatedValuesToCreateInput,
  validatedValuesToUpdateInput,
} from "@/modules/leads/mappers";
import type {
  LeadDto,
  LeadListQuery,
  LeadListResult,
} from "@/modules/leads/types";

function buildListWhere(query: LeadListQuery): Prisma.LeadWhereInput {
  const filters: Prisma.LeadWhereInput[] = [];

  if (query.status) {
    filters.push({ status: query.status });
  }

  if (query.search) {
    filters.push({
      OR: [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ],
    });
  }

  if (filters.length === 0) {
    return {};
  }

  if (filters.length === 1) {
    return filters[0] ?? {};
  }

  return { AND: filters };
}

export async function listLeads(query: LeadListQuery): Promise<LeadListResult> {
  const { schema } = await getFormConfig();
  const where = buildListWhere(query);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: query.pageSize,
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);

  return {
    data: rows.map((row) => leadToDto(row, schema)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
    },
  };
}

export async function getLeadById(id: string): Promise<LeadDto> {
  const { schema } = await getFormConfig();
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new HttpError(404, "Lead not found");
  }

  return leadToDto(lead, schema);
}

function requireValuesObject(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Body must be a JSON object");
  }

  const record = body as Record<string, unknown>;

  if (
    "id" in record ||
    "createdAt" in record ||
    "updatedAt" in record ||
    "customValues" in record
  ) {
    // Server-managed fields must not be accepted at the top level.
    throw new HttpError(
      400,
      "Server-managed fields cannot be set by the client",
    );
  }

  if (!("values" in record)) {
    throw new HttpError(400, "Body must include a values object");
  }

  const values = record.values;
  if (values === null || typeof values !== "object" || Array.isArray(values)) {
    throw new HttpError(400, "values must be an object keyed by field ID");
  }

  return sanitizeClientValues(values as Record<string, unknown>);
}

export async function createLead(body: unknown): Promise<LeadDto> {
  const { schema } = await getFormConfig();
  const values = requireValuesObject(body);
  const validation = validateLeadValues(schema, values);

  if (!validation.success) {
    throw new FieldValidationError(validation.fieldErrors, validation.error);
  }

  const created = await prisma.lead.create({
    data: validatedValuesToCreateInput(validation.data, schema),
  });

  return leadToDto(created, schema);
}

/**
 * PATCH contract: `{ values: { [fieldId]: value } }` is a sparse update.
 * Only provided field IDs are overwritten. Omitted fields keep stored values.
 * The merged record is then validated against the current saved schema.
 */
export async function updateLead(id: string, body: unknown): Promise<LeadDto> {
  const { schema } = await getFormConfig();
  const existing = await prisma.lead.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError(404, "Lead not found");
  }

  const patchValues = requireValuesObject(body);
  const storedValues = leadRowToStoredValues(existing);
  const merged = mergeLeadValues(storedValues, patchValues);
  const validation = validateLeadValues(schema, merged);

  if (!validation.success) {
    throw new FieldValidationError(validation.fieldErrors, validation.error);
  }

  // Core fields always come from validation of the merged state.
  // Ensure validated includes core from merged when somehow missing.
  const validated = {
    ...validation.data,
    name: validation.data.name ?? storedValues.name,
    email: validation.data.email ?? storedValues.email,
    status: validation.data.status ?? storedValues.status,
    budget:
      validation.data.budget === undefined
        ? storedValues.budget
        : validation.data.budget,
  };

  const updated = await prisma.lead.update({
    where: { id },
    data: validatedValuesToUpdateInput(
      validated,
      schema,
      parseCustomValues(existing.customValues),
      merged,
    ),
  });

  return leadToDto(updated, schema);
}
