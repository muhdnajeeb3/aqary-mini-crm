import { jsonError, type ApiErrorBody } from "@/lib/api/http";
import type { NextResponse } from "next/server";

/**
 * Same-origin check for cookie-authenticated (and login) state-changing requests.
 *
 * Defense in depth with SameSite=Lax session cookies:
 * - Browsers omit Lax cookies on cross-site POSTs, blocking classic CSRF.
 * - This also rejects mismatched Origin/Referer so forged cross-origin
 *   requests fail even if a cookie were present.
 *
 * Same-origin browser fetch always sends Origin. Tests must send Origin + Host.
 */
export function assertSameOrigin(
  request: Request,
): NextResponse<ApiErrorBody> | null {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!host) {
    return jsonError(403, "Forbidden");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return hostsMatch(origin, host)
      ? null
      : jsonError(403, "Forbidden");
  }

  const referer = request.headers.get("referer");
  if (referer) {
    return hostsMatch(referer, host)
      ? null
      : jsonError(403, "Forbidden");
  }

  return jsonError(403, "Forbidden");
}

function hostsMatch(urlValue: string, expectedHost: string): boolean {
  try {
    return new URL(urlValue).host === expectedHost;
  } catch {
    return false;
  }
}
