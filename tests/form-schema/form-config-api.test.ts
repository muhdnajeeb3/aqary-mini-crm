import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import type { FormSchema } from "@/modules/form-schema/types";
import {
  cookieStoreMock,
  resetCookieJar,
} from "../helpers/cookie-jar";

vi.mock("next/headers", () => ({
  cookies: async () => cookieStoreMock,
}));

const FORM_DEFINITION_ID = "33333333-3333-4333-8333-333333333333";

function cloneSchema(): FormSchema {
  return structuredClone(DEFAULT_FORM_SCHEMA);
}

function sameOrigin(method: string, body?: unknown): Request {
  return new Request("http://localhost:3000/api/form-config", {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function loginAs(email: string): Promise<void> {
  const { POST } = await import("@/app/api/auth/login/route");
  const response = await POST(
    new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
      body: JSON.stringify({
        email,
        password: "AqaryDemo!2026",
      }),
    }),
  );
  expect(response.status).toBe(200);
}

describe("form-config API", () => {
  beforeEach(async () => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";

    await prisma.formDefinition.update({
      where: { id: FORM_DEFINITION_ID },
      data: {
        schemaJson: DEFAULT_FORM_SCHEMA,
        version: 1,
      },
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("allows Admin and Agent to GET the form configuration", async () => {
    await loginAs("agent@aqary.demo");
    const { GET } = await import("@/app/api/form-config/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      version: number;
      schema: FormSchema;
    };
    expect(data.version).toBe(1);
    expect(data.schema.fields.some((f) => f.id === "loss_reason")).toBe(true);
  });

  it("persists schema changes and increments version for Admin PUT", async () => {
    await loginAs("admin@aqary.demo");
    const schema = cloneSchema();
    schema.fields.push({
      id: "preferred_location",
      type: "text",
      label: "Preferred location",
      required: false,
      protected: false,
    });

    const { PUT, GET } = await import("@/app/api/form-config/route");
    const putResponse = await PUT(sameOrigin("PUT", { schema }));
    expect(putResponse.status).toBe(200);
    const putData = (await putResponse.json()) as {
      version: number;
      schema: FormSchema;
    };
    expect(putData.version).toBeGreaterThan(1);
    expect(
      putData.schema.fields.some((f) => f.id === "preferred_location"),
    ).toBe(true);

    const getResponse = await GET();
    const getData = (await getResponse.json()) as {
      version: number;
      schema: FormSchema;
    };
    expect(getData.version).toBe(putData.version);
    expect(
      getData.schema.fields.some((f) => f.id === "preferred_location"),
    ).toBe(true);

    // Removing a custom field from schema must not touch lead customValues.
    const leadBefore = await prisma.lead.findFirst({
      where: { status: "Lost" },
      select: { id: true, customValues: true },
    });
    expect(leadBefore).toBeTruthy();

    const withoutCustom = cloneSchema();
    const putRemove = await PUT(sameOrigin("PUT", { schema: withoutCustom }));
    expect(putRemove.status).toBe(200);

    const leadAfter = await prisma.lead.findUnique({
      where: { id: leadBefore!.id },
      select: { customValues: true },
    });
    expect(leadAfter?.customValues).toEqual(leadBefore?.customValues);
  });

  it("rejects Agent PUT with 403", async () => {
    await loginAs("agent@aqary.demo");
    const { PUT } = await import("@/app/api/form-config/route");
    const response = await PUT(
      sameOrigin("PUT", { schema: DEFAULT_FORM_SCHEMA }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated GET with 401", async () => {
    const { GET } = await import("@/app/api/form-config/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("rejects invalid configuration on Admin PUT", async () => {
    await loginAs("admin@aqary.demo");
    const schema = cloneSchema();
    schema.fields = schema.fields.filter((field) => field.id !== "budget");

    const { PUT } = await import("@/app/api/form-config/route");
    const response = await PUT(sameOrigin("PUT", { schema }));
    expect(response.status).toBe(400);
    const data = (await response.json()) as {
      error: string;
      details?: string[];
    };
    expect(data.details?.some((d) => d.includes("budget"))).toBe(true);
  });
});
