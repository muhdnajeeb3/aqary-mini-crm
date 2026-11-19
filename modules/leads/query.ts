import { z } from "zod";
import { LEAD_STATUS_OPTIONS } from "@/modules/form-schema/types";
import type { LeadListQuery } from "@/modules/leads/types";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

const leadStatusSchema = z.enum(LEAD_STATUS_OPTIONS);

export const leadListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  status: leadStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export function parseLeadListQuery(
  searchParams: URLSearchParams,
):
  | { success: true; data: LeadListQuery }
  | { success: false; error: string } {
  const raw = {
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  };

  const parsed = leadListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Invalid query parameters";
    return { success: false, error: message };
  }

  return {
    success: true,
    data: {
      search: parsed.data.search,
      status: parsed.data.status,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    },
  };
}
