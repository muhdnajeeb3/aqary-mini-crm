/** @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

function renderLeads() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LeadsPageClient />
    </QueryClientProvider>,
  );
}

describe("LeadsPageClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a loading state", () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise(() => undefined) as Promise<Response>,
    );
    renderLeads();
    expect(screen.getByText(/loading leads/i)).toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );

    renderLeads();
    expect(await screen.findByText(/could not load leads/i)).toBeInTheDocument();

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText(/no matching leads/i)).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    renderLeads();
    expect(await screen.findByText(/no matching leads/i)).toBeInTheDocument();
  });

  it("resets to page 1 when status filter changes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      const page = Number(new URL(url, "http://localhost").searchParams.get("page") ?? "1");
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "1",
              name: "Sara Ahmed",
              email: "sara@example.com",
              status: "New",
              budget: 850000,
              customValues: {},
              values: {},
              createdAt: "2026-11-12T10:00:00.000Z",
              updatedAt: "2026-11-12T10:00:00.000Z",
            },
          ],
          pagination: {
            page,
            pageSize: 10,
            total: 12,
            totalPages: 2,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    renderLeads();
    expect(await screen.findByText("Sara Ahmed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => String(call[0]));
      expect(urls.some((url) => url.includes("page=2"))).toBe(true);
    });

    await user.selectOptions(screen.getByLabelText(/^status$/i), "Lost");

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => String(call[0]));
      const lastLost = [...urls]
        .reverse()
        .find((url) => url.includes("status=Lost"));
      expect(lastLost).toBeTruthy();
      expect(lastLost).toContain("page=1");
    });
  });
});
