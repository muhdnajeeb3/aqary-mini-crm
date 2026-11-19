import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookieStoreMock, resetCookieJar } from "../helpers/cookie-jar";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

describe("session tokens", () => {
  beforeEach(() => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("creates a verifiable session token containing the user id", async () => {
    const { createSessionToken, verifySessionToken } = await import(
      "@/modules/auth/session"
    );

    const userId = "11111111-1111-4111-8111-111111111111";
    const token = await createSessionToken(userId);
    const payload = await verifySessionToken(token);

    expect(payload).toEqual({ sub: userId });
  });

  it("rejects tokens with an invalid signature", async () => {
    const { createSessionToken, verifySessionToken } = await import(
      "@/modules/auth/session"
    );

    const token = await createSessionToken("user-1");
    process.env.SESSION_SECRET =
      "different-session-secret-min-32-characters!!";
    vi.resetModules();
    const { verifySessionToken: verifyWithOtherSecret } = await import(
      "@/modules/auth/session"
    );

    await expect(verifyWithOtherSecret(token)).resolves.toBeNull();
  });

  it("rejects expired session tokens", async () => {
    const secret = new TextEncoder().encode(
      "test-session-secret-min-32-characters-long!!",
    );
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-expired")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    const { verifySessionToken } = await import("@/modules/auth/session");
    await expect(verifySessionToken(expiredToken)).resolves.toBeNull();
  });

  it("stores and clears the session cookie", async () => {
    const {
      createSession,
      deleteSession,
      getSessionTokenFromCookies,
      SESSION_COOKIE_NAME,
    } = await import("@/modules/auth/session");

    await createSession("user-cookie");
    const stored = await getSessionTokenFromCookies();
    expect(stored).toBeTypeOf("string");
    expect(cookieStoreMock.get(SESSION_COOKIE_NAME)?.value).toBe(stored);

    await deleteSession();
    await expect(getSessionTokenFromCookies()).resolves.toBeUndefined();
  });
});
