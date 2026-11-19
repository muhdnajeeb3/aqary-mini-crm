/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadDetail } from "@/components/leads/lead-detail";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LeadDetail leadId="lead-1" />
    </QueryClientProvider>,
  );
}

describe("LeadDetail", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("displays lead values and handles null budget", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/form-config")) {
        return new Response(
          JSON.stringify({
            id: "form-1",
            version: 1,
            schema: DEFAULT_FORM_SCHEMA,
            updatedAt: "2026-11-12T10:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          id: "lead-1",
          name: "Sara Ahmed",
          email: "sara@example.com",
          status: "New",
          budget: null,
          customValues: {},
          values: {
            name: "Sara Ahmed",
            email: "sara@example.com",
            status: "New",
            budget: null,
            loss_reason: null,
          },
          createdAt: "2026-11-12T10:00:00.000Z",
          updatedAt: "2026-11-12T11:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    renderDetail();

    expect(
      await screen.findByRole("heading", { name: "Sara Ahmed" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("sara@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/leads/lead-1/edit",
    );
  });

  it("shows not-found state", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/form-config")) {
        return new Response(
          JSON.stringify({
            id: "form-1",
            version: 1,
            schema: DEFAULT_FORM_SCHEMA,
            updatedAt: "2026-11-12T10:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    });

    renderDetail();
    expect(await screen.findByText(/lead not found/i)).toBeInTheDocument();
  });

  it("hides Loss reason on detail when Status is not Lost", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/form-config")) {
        return new Response(
          JSON.stringify({
            id: "form-1",
            version: 1,
            schema: DEFAULT_FORM_SCHEMA,
            updatedAt: "2026-11-12T10:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          id: "lead-1",
          name: "Stage6 Admin Lead",
          email: "stage6.admin@example.com",
          status: "New",
          budget: 750000,
          customValues: { loss_reason: "Budget no longer available" },
          values: {
            name: "Stage6 Admin Lead",
            email: "stage6.admin@example.com",
            status: "New",
            budget: 750000,
            loss_reason: "Budget no longer available",
          },
          createdAt: "2026-11-19T10:00:00.000Z",
          updatedAt: "2026-11-19T11:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Stage6 Admin Lead" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/loss reason/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Budget no longer available"),
    ).not.toBeInTheDocument();
  });

  it("does not show removed custom fields as active", async () => {
    const schemaWithoutLoss = {
      ...DEFAULT_FORM_SCHEMA,
      fields: DEFAULT_FORM_SCHEMA.fields.filter(
        (field) => field.id !== "loss_reason",
      ),
    };

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/form-config")) {
        return new Response(
          JSON.stringify({
            id: "form-1",
            version: 2,
            schema: schemaWithoutLoss,
            updatedAt: "2026-11-12T10:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          id: "lead-1",
          name: "Adam",
          email: "adam@example.com",
          status: "Lost",
          budget: 100,
          customValues: { loss_reason: "Old reason" },
          values: {
            name: "Adam",
            email: "adam@example.com",
            status: "Lost",
            budget: 100,
          },
          createdAt: "2026-11-12T10:00:00.000Z",
          updatedAt: "2026-11-12T10:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    renderDetail();
    expect(await screen.findByRole("heading", { name: "Adam" })).toBeInTheDocument();
    expect(screen.queryByText(/loss reason/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Old reason")).not.toBeInTheDocument();
  });
});
