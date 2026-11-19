import { SignJWT, jwtVerify, errors as JoseErrors } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "@/modules/auth/types";

export const SESSION_COOKIE_NAME = "aqary_session";

/** 7 days */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 32 characters",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecretKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }

    return { sub: payload.sub };
  } catch (error: unknown) {
    if (
      error instanceof JoseErrors.JWTExpired ||
      error instanceof JoseErrors.JWSSignatureVerificationFailed ||
      error instanceof JoseErrors.JWTClaimValidationFailed ||
      error instanceof JoseErrors.JWTInvalid
    ) {
      return null;
    }
    return null;
  }
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
}

export async function getSessionTokenFromCookies(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value;
  } catch {
    // Next.js may reject cookies() during static prerender of Route Handlers.
    return undefined;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  await setSessionCookie(token);
}

export async function deleteSession(): Promise<void> {
  await clearSessionCookie();
}

export async function readVerifiedSessionUserId(): Promise<string | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}
