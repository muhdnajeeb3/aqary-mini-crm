import { assertSameOrigin } from "@/lib/api/csrf";
import { jsonError, jsonOk, toErrorResponse } from "@/lib/api/http";
import { requireAuth } from "@/modules/auth/guards";
import { getLeadById, updateLead } from "@/modules/leads/service";


type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const lead = await getLeadById(id);
    return jsonOk(lead);
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    await requireAuth();
    const { id } = await context.params;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const lead = await updateLead(id, raw);
    return jsonOk(lead);
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
