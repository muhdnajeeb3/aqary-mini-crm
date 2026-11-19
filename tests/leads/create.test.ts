import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import { cookieStoreMock, resetCookieJar } from "../helpers/cookie-jar";
import {
  crossOriginRequest,
  loginAs,
  sameOriginRequest,
} from "../helpers/auth-request";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

const FORM_DEFINITION_ID = "33333333-3333-4333-8333-333333333333";

describe("POST /api/leads", () => {
  beforeEach(async () => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";

    await prisma.formDefinition.update({
      where: { id: FORM_DEFINITION_ID },
      data: { schemaJson: DEFAULT_FORM_SCHEMA, version: 1 },
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("allows Admin to create a lead", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Admin Created",
          email: "admin-created@example.com",
          status: "New",
          budget: 500000,
        },
      }),
    );
    expect(response.status).toBe(201);
    const lead = (await response.json()) as {
      id: string;
      name: string;
      values: Record<string, unknown>;
    };
    expect(lead.name).toBe("Admin Created");
    expect(lead.values.loss_reason).toBeNull();

    await prisma.lead.delete({ where: { id: lead.id } });
  });

  it("allows Agent to create a lead", async () => {
    await loginAs("agent@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Agent Created",
          email: "agent-created@example.com",
          status: "Contacted",
          budget: 750000,
        },
      }),
    );
    expect(response.status).toBe(201);
    const lead = (await response.json()) as { id: string; name: string };
    expect(lead.name).toBe("Agent Created");
    await prisma.lead.delete({ where: { id: lead.id } });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Nope",
          email: "nope@example.com",
          status: "New",
          budget: 1,
        },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 422 for invalid core fields", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "",
          email: "bad@",
          status: "New",
          budget: 100,
        },
      }),
    );
    expect(response.status).toBe(422);
    const body = (await response.json()) as {
      fieldErrors: Record<string, string>;
    };
    expect(body.fieldErrors.name).toBeTruthy();
    expect(body.fieldErrors.email).toBeTruthy();
  });

  it("returns 422 for invalid custom fields when visible", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Lost Lead",
          email: "lost-lead@example.com",
          status: "Lost",
          budget: 100,
          loss_reason: "",
        },
      }),
    );
    expect(response.status).toBe(422);
    const body = (await response.json()) as {
      fieldErrors: Record<string, string>;
    };
    expect(body.fieldErrors.loss_reason).toMatch(/required/i);
  });

  it("does not block creation when a hidden required field is omitted", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Hidden OK",
          email: "hidden-ok@example.com",
          status: "Qualified",
          budget: 900000,
        },
      }),
    );
    expect(response.status).toBe(201);
    const lead = (await response.json()) as { id: string };
    await prisma.lead.delete({ where: { id: lead.id } });
  });

  it("enforces visible required custom fields", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "Needs Reason",
          email: "needs-reason@example.com",
          status: "Lost",
          budget: 100,
        },
      }),
    );
    expect(response.status).toBe(422);
    const body = (await response.json()) as {
      fieldErrors: Record<string, string>;
    };
    expect(body.fieldErrors.loss_reason).toBeTruthy();
  });

  it("rejects client-provided server-managed fields", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      sameOriginRequest("http://localhost:3000/api/leads", "POST", {
        id: "client-id",
        createdAt: "2000-01-01T00:00:00.000Z",
        values: {
          name: "Managed",
          email: "managed@example.com",
          status: "New",
          budget: 1,
        },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects cross-origin POST (CSRF)", async () => {
    await loginAs("admin@aqary.demo");
    const { POST } = await import("@/app/api/leads/route");
    const response = await POST(
      crossOriginRequest("http://localhost:3000/api/leads", "POST", {
        values: {
          name: "CSRF",
          email: "csrf@example.com",
          status: "New",
          budget: 1,
        },
      }),
    );
    expect(response.status).toBe(403);
  });
});
