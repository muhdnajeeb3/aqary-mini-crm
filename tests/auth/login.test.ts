import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cookieStoreMock,
  getCookieJarValue,
  resetCookieJar,
} from "../helpers/cookie-jar";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

function loginRequest(body: unknown, origin = "http://localhost:3000"): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("logs in with valid credentials and sets a session cookie", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      loginRequest({
        email: "admin@aqary.demo",
        password: "AqaryDemo!2026",
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      user: { email: string; role: string; passwordHash?: string };
    };
    expect(data.user.email).toBe("admin@aqary.demo");
    expect(data.user.role).toBe("ADMIN");
    expect(data.user.passwordHash).toBeUndefined();
    expect(getCookieJarValue("aqary_session")).toBeTypeOf("string");
  });

  it("returns a generic error for unknown email", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      loginRequest({
        email: "nobody@aqary.demo",
        password: "AqaryDemo!2026",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid email or password",
    });
    expect(getCookieJarValue("aqary_session")).toBeUndefined();
  });

  it("returns a generic error for wrong password", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      loginRequest({
        email: "admin@aqary.demo",
        password: "WrongPassword!",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid email or password",
    });
  });

  it("rejects cross-origin login attempts", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      loginRequest(
        {
          email: "admin@aqary.demo",
          password: "AqaryDemo!2026",
        },
        "https://evil.example",
      ),
    );

    expect(response.status).toBe(403);
  });
});

describe("GET /api/auth/me and Admin vs Agent", () => {
  beforeEach(() => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns the authenticated user without passwordHash", async () => {
    const { createSession } = await import("@/modules/auth/session");
    await createSession("22222222-2222-4222-8222-222222222222");

    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      user: Record<string, unknown>;
    };
    expect(data.user).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Demo Agent",
      email: "agent@aqary.demo",
      role: "AGENT",
    });
    expect(data.user).not.toHaveProperty("passwordHash");
  });
});
