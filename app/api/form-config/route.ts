import { assertSameOrigin } from "@/lib/api/csrf";
import { jsonError, jsonOk, toErrorResponse } from "@/lib/api/http";
import { requireAdmin, requireAuth } from "@/modules/auth/guards";
import { getFormConfig, saveFormConfig } from "@/modules/form-schema/service";


export async function GET() {
  try {
    await requireAuth();
    const config = await getFormConfig();
    return jsonOk(config);
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    await requireAdmin();

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    if (
      raw === null ||
      typeof raw !== "object" ||
      Array.isArray(raw) ||
      !("schema" in raw)
    ) {
      return jsonError(400, "Body must include a schema object");
    }

    const body = raw as { schema: unknown };
    const config = await saveFormConfig(body.schema);
    return jsonOk(config);
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
