import { assertSameOrigin } from "@/lib/api/csrf";
import { jsonError, jsonOk, toErrorResponse } from "@/lib/api/http";
import { requireAuth } from "@/modules/auth/guards";
import { parseLeadListQuery } from "@/modules/leads/query";
import { createLead, listLeads } from "@/modules/leads/service";


export async function GET(request: Request) {
  try {
    await requireAuth();

    const url = new URL(request.url);
    const parsed = parseLeadListQuery(url.searchParams);
    if (!parsed.success) {
      return jsonError(400, parsed.error);
    }

    const result = await listLeads(parsed.data);
    return jsonOk(result);
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    await requireAuth();

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const lead = await createLead(raw);
    return jsonOk(lead, { status: 201 });
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
