import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import type { FormSchema } from "@/modules/form-schema/types";
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
const ADAM_ID = "44444444-4444-4444-8444-000000000004";

function cloneSchema(): FormSchema {
  return structuredClone(DEFAULT_FORM_SCHEMA);
}

describe("GET/PATCH /api/leads/[id]", () => {
  beforeEach(async () => {
    resetCookieJar();
    process.env.SESSION_SECRET =
      "test-session-secret-min-32-characters-long!!";

    await prisma.formDefinition.update({
      where: { id: FORM_DEFINITION_ID },
      data: { schemaJson: DEFAULT_FORM_SCHEMA, version: 1 },
    });

    await prisma.lead.update({
      where: { id: ADAM_ID },
      data: {
        name: "Adam Noor",
        email: "adam@example.com",
        status: "Lost",
        budget: 650000,
        customValues: { loss_reason: "Budget no longer available" },
      },
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("fetches an existing lead", async () => {
    await loginAs("admin@aqary.demo");
    const { GET } = await import("@/app/api/leads/[id]/route");
    const response = await GET(new Request("http://localhost:3000/api/leads/x"), {
      params: Promise.resolve({ id: ADAM_ID }),
    });
    expect(response.status).toBe(200);
    const lead = (await response.json()) as {
      id: string;
      values: Record<string, unknown>;
      customValues: Record<string, unknown>;
    };
    expect(lead.id).toBe(ADAM_ID);
    expect(lead.values.loss_reason).toBe("Budget no longer available");
    expect(lead.customValues.loss_reason).toBe("Budget no longer available");
  });

  it("returns 404 for a missing lead", async () => {
    await loginAs("admin@aqary.demo");
    const { GET } = await import("@/app/api/leads/[id]/route");
    const response = await GET(new Request("http://localhost:3000/api/leads/x"), {
      params: Promise.resolve({
        id: "00000000-0000-4000-8000-000000000000",
      }),
    });
    expect(response.status).toBe(404);
  });

  it("allows Admin and Agent to update", async () => {
    await loginAs("admin@aqary.demo");
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const adminResponse = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Adam Updated By Admin" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(adminResponse.status).toBe(200);

    resetCookieJar();
    await loginAs("agent@aqary.demo");
    const agentModules = await import("@/app/api/leads/[id]/route");
    const agentResponse = await agentModules.PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Adam Updated By Agent" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(agentResponse.status).toBe(200);
    const lead = (await agentResponse.json()) as { name: string };
    expect(lead.name).toBe("Adam Updated By Agent");
  });

  it("returns 401 when unauthenticated on PATCH", async () => {
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Nope" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(401);
  });

  it("enforces current schema validation on update", async () => {
    await loginAs("admin@aqary.demo");
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { email: "not-an-email" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(422);
    const body = (await response.json()) as {
      fieldErrors: Record<string, string>;
    };
    expect(body.fieldErrors.email).toBeTruthy();
  });

  it("does not block updates when a hidden required field is absent", async () => {
    await loginAs("admin@aqary.demo");
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: {
          status: "Contacted",
          name: "Adam Contacted",
        },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(200);
    const lead = (await response.json()) as {
      status: string;
      customValues: Record<string, unknown>;
    };
    expect(lead.status).toBe("Contacted");
    // Historical loss_reason preserved even though field is now hidden.
    expect(lead.customValues.loss_reason).toBe("Budget no longer available");
  });

  it("preserves historical values for removed custom fields", async () => {
    await loginAs("admin@aqary.demo");

    // Ensure loss_reason stored, then remove it from active schema.
    const schemaWithoutLoss = cloneSchema();
    schemaWithoutLoss.fields = schemaWithoutLoss.fields.filter(
      (field) => field.id !== "loss_reason",
    );

    const { PUT } = await import("@/app/api/form-config/route");
    const save = await PUT(
      sameOriginRequest("http://localhost:3000/api/form-config", "PUT", {
        schema: schemaWithoutLoss,
      }),
    );
    expect(save.status).toBe(200);

    const before = await prisma.lead.findUnique({
      where: { id: ADAM_ID },
      select: { customValues: true },
    });

    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Adam After Schema Change" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(200);

    const after = await prisma.lead.findUnique({
      where: { id: ADAM_ID },
      select: { customValues: true, name: true },
    });
    expect(after?.name).toBe("Adam After Schema Change");
    expect(after?.customValues).toEqual(before?.customValues);
  });

  it("exposes newly added schema fields as empty on older leads", async () => {
    await loginAs("admin@aqary.demo");
    const schema = cloneSchema();
    schema.fields.push({
      id: "preferred_location",
      type: "text",
      label: "Preferred location",
      required: false,
      protected: false,
    });

    const { PUT } = await import("@/app/api/form-config/route");
    const save = await PUT(
      sameOriginRequest("http://localhost:3000/api/form-config", "PUT", {
        schema,
      }),
    );
    expect(save.status).toBe(200);

    const { GET } = await import("@/app/api/leads/[id]/route");
    const response = await GET(new Request("http://localhost:3000/api/leads/x"), {
      params: Promise.resolve({ id: ADAM_ID }),
    });
    expect(response.status).toBe(200);
    const lead = (await response.json()) as {
      values: Record<string, unknown>;
    };
    expect(lead.values.preferred_location).toBeNull();
  });

  it("applies sparse PATCH without clearing omitted fields", async () => {
    await loginAs("admin@aqary.demo");
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      sameOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Only Name Changed" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(200);
    const lead = (await response.json()) as {
      name: string;
      email: string;
      status: string;
      budget: number | null;
      customValues: Record<string, unknown>;
    };
    expect(lead.name).toBe("Only Name Changed");
    expect(lead.email).toBe("adam@example.com");
    expect(lead.status).toBe("Lost");
    expect(lead.budget).toBe(650000);
    expect(lead.customValues.loss_reason).toBe("Budget no longer available");
  });

  it("rejects cross-origin PATCH (CSRF)", async () => {
    await loginAs("admin@aqary.demo");
    const { PATCH } = await import("@/app/api/leads/[id]/route");
    const response = await PATCH(
      crossOriginRequest(`http://localhost:3000/api/leads/${ADAM_ID}`, "PATCH", {
        values: { name: "Evil" },
      }),
      { params: Promise.resolve({ id: ADAM_ID }) },
    );
    expect(response.status).toBe(403);
  });
});
