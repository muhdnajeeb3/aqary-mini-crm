import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cookieStoreMock,
  getCookieJarValue,
  resetCookieJar,
} from "../helpers/cookie-jar";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

describe("auth guards", () => {
  beforeEach(() => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("rejects unauthenticated access with 401", async () => {
    const { requireAuth } = await import("@/modules/auth/guards");
    const { HttpError } = await import("@/lib/api/http");

    await expect(requireAuth()).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    } satisfies Partial<InstanceType<typeof HttpError>>);
  });

  it("resolves the current user from Prisma for a valid session", async () => {
    const { createSession } = await import("@/modules/auth/session");
    const { requireAuth } = await import("@/modules/auth/guards");

    await createSession("11111111-1111-4111-8111-111111111111");
    expect(getCookieJarValue("aqary_session")).toBeTypeOf("string");

    const user = await requireAuth();
    expect(user).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Demo Admin",
      email: "admin@aqary.demo",
      role: "ADMIN",
    });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("allows Admin through requireAdmin", async () => {
    const { createSession } = await import("@/modules/auth/session");
    const { requireAdmin } = await import("@/modules/auth/guards");

    await createSession("11111111-1111-4111-8111-111111111111");
    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
  });

  it("rejects Agent on requireAdmin with 403", async () => {
    const { createSession } = await import("@/modules/auth/session");
    const { requireAdmin } = await import("@/modules/auth/guards");

    await createSession("22222222-2222-4222-8222-222222222222");

    await expect(requireAdmin()).rejects.toMatchObject({
      status: 403,
      message: "Forbidden",
    });
  });

  it("rejects expired sessions as unauthenticated", async () => {
    const { SignJWT } = await import("jose");
    const { SESSION_COOKIE_NAME } = await import("@/modules/auth/session");
    const { requireAuth } = await import("@/modules/auth/guards");

    const secret = new TextEncoder().encode(
      "test-session-secret-min-32-characters-long!!",
    );
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("11111111-1111-4111-8111-111111111111")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    cookieStoreMock.set(SESSION_COOKIE_NAME, expiredToken);

    await expect(requireAuth()).rejects.toMatchObject({ status: 401 });
  });
});
