import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import { cookieStoreMock, resetCookieJar } from "../helpers/cookie-jar";
import { loginAs } from "../helpers/auth-request";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

const FORM_DEFINITION_ID = "33333333-3333-4333-8333-333333333333";

describe("GET /api/leads", () => {
  beforeEach(async () => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";

    await prisma.formDefinition.update({
      where: { id: FORM_DEFINITION_ID },
      data: { schemaJson: DEFAULT_FORM_SCHEMA, version: 1 },
    });

    // Keep seeded lead set hermetic; remove ad-hoc rows from manual/E2E runs.
    await prisma.lead.deleteMany({
      where: {
        NOT: {
          id: {
            startsWith: "44444444-4444-4444-8444-",
          },
        },
      },
    });

    await prisma.lead.update({
      where: { id: "44444444-4444-4444-8444-000000000004" },
      data: {
        name: "Adam Noor",
        email: "adam@example.com",
        status: "Lost",
        budget: 650000,
        customValues: { loss_reason: "Budget no longer available" },
      },
    });

    await loginAs("admin@aqary.demo");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("searches by name case-insensitively", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(
      new Request("http://localhost:3000/api/leads?search=sara"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ name: string }>;
      pagination: { total: number };
    };
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.every((lead) => /sara/i.test(lead.name))).toBe(true);
  });

  it("searches by email case-insensitively", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(
      new Request("http://localhost:3000/api/leads?search=OMAR@EXAMPLE.COM"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ email: string }>;
      pagination: { total: number };
    };
    expect(body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(body.data.some((lead) => /omar@example.com/i.test(lead.email))).toBe(
      true,
    );
  });

  it("filters by status", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(
      new Request("http://localhost:3000/api/leads?status=Lost"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ status: string }>;
      pagination: { total: number };
    };
    expect(body.pagination.total).toBe(6);
    expect(body.data.every((lead) => lead.status === "Lost")).toBe(true);
  });

  it("combines search and status filters", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/leads?search=adam&status=Lost",
      ),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ name: string; status: string }>;
      pagination: { total: number };
    };
    expect(body.pagination.total).toBe(1);
    expect(body.data[0]?.name).toBe("Adam Noor");
    expect(body.data[0]?.status).toBe("Lost");
  });

  it("applies filters before pagination and returns accurate totals", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/leads?status=New&page=1&pageSize=2",
      ),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: unknown[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    };
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({
      page: 1,
      pageSize: 2,
      total: 6,
      totalPages: 3,
    });
  });

  it("rejects invalid pagination parameters with 400", async () => {
    const { GET } = await import("@/app/api/leads/route");
    const badPage = await GET(
      new Request("http://localhost:3000/api/leads?page=0"),
    );
    expect(badPage.status).toBe(400);

    const badSize = await GET(
      new Request("http://localhost:3000/api/leads?pageSize=1000"),
    );
    expect(badSize.status).toBe(400);

    const badStatus = await GET(
      new Request("http://localhost:3000/api/leads?status=Nope"),
    );
    expect(badStatus.status).toBe(400);
  });

  it("rejects unauthenticated list requests with 401", async () => {
    resetCookieJar();
    const { GET } = await import("@/app/api/leads/route");
    const response = await GET(new Request("http://localhost:3000/api/leads"));
    expect(response.status).toBe(401);
  });
});
