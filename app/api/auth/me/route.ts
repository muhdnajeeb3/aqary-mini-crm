import { jsonOk, toErrorResponse } from "@/lib/api/http";
import { requireAuth } from "@/modules/auth/guards";


export async function GET() {
  try {
    const user = await requireAuth();
    return jsonOk({ user });
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
