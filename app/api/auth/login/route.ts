import { assertSameOrigin } from "@/lib/api/csrf";
import { jsonError, jsonOk, toErrorResponse } from "@/lib/api/http";
import {
  authenticateWithPassword,
  loginBodySchema,
} from "@/modules/auth/login";
import { createSession } from "@/modules/auth/session";


export async function POST(request: Request) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return csrfError;
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const parsed = loginBodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "Invalid email or password");
    }

    const user = await authenticateWithPassword(
      parsed.data.email,
      parsed.data.password,
    );

    if (!user) {
      return jsonError(401, "Invalid email or password");
    }

    await createSession(user.id);

    return jsonOk({ user });
  } catch (error: unknown) {
    return toErrorResponse(error);
  }
}
