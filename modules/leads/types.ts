import type { LeadStatus } from "@prisma/client";
import type {
  CustomFieldValues,
  LeadValues,
} from "@/modules/form-schema/types";

export type LeadDto = {
  id: string;
  name: string;
  email: string;
  status: LeadStatus;
  /** Null means the optional budget field was left empty (not a zero budget). */
  budget: number | null;
  customValues: CustomFieldValues;
  /**
   * Values for the current saved schema field IDs.
   * Newly added schema fields missing on older leads are `null`.
   */
  values: LeadValues;
  createdAt: string;
  updatedAt: string;
};

export type LeadListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type LeadListResult = {
  data: LeadDto[];
  pagination: LeadListPagination;
};

export type LeadListQuery = {
  search?: string;
  status?: LeadStatus;
  page: number;
  pageSize: number;
};
