import { assertSameOrigin } from "@/lib/api/csrf";
import { jsonOk, toErrorResponse } from "@/lib/api/http";
import { deleteSession } from "@/modules/auth/session";


export async function POST(request: Request) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    await deleteSession();
    return jsonOk({ ok: true as const });
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
