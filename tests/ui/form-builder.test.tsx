/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FormBuilderPage from "@/app/(workspace)/form-builder/page";
import { FormBuilder } from "@/components/form-builder/form-builder";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";

vi.mock("next/navigation", () => ({
  usePathname: () => "/form-builder",
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-auth", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-auth")>(
    "@/hooks/use-auth",
  );
  return {
    ...actual,
    useCurrentUser: vi.fn(),
    useLogout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

import { useCurrentUser } from "@/hooks/use-auth";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("FormBuilder permissions and draft save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows forbidden state for Agent", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: "2",
          name: "Demo Agent",
          email: "agent@aqary.demo",
          role: "AGENT",
        },
      },
      isLoading: false,
    } as ReturnType<typeof useCurrentUser>);

    renderWithClient(<FormBuilderPage />);
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.queryByText(/field palette/i)).not.toBeInTheDocument();
  });

  it("allows Admin to open builder, edit draft, preview and save", async () => {
    const user = userEvent.setup();
    vi.mocked(useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Demo Admin",
          email: "admin@aqary.demo",
          role: "ADMIN",
        },
      },
      isLoading: false,
    } as ReturnType<typeof useCurrentUser>);

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/form-config") && (!init || init.method === "GET" || init.method === undefined)) {
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
      if (url.includes("/api/form-config") && init?.method === "PUT") {
        const body = JSON.parse(String(init.body)) as { schema: unknown };
        return new Response(
          JSON.stringify({
            id: "form-1",
            version: 2,
            schema: body.schema,
            updatedAt: "2026-11-12T11:00:00.000Z",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "Unexpected" }), {
        status: 500,
      });
    });

    renderWithClient(<FormBuilder />);

    expect(await screen.findByText(/field palette/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /\+ text/i }));
    expect(await screen.findByText(/text field/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^label$/i));
    await user.type(screen.getByLabelText(/^label$/i), "Preferred location");

    await user.click(screen.getByRole("button", { name: /^preview$/i }));
    expect(
      await screen.findByText(/preview uses the current draft/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to builder/i }));

    await user.click(screen.getByRole("button", { name: /save form/i }));
    expect(await screen.findByText(/form saved · version 2/i)).toBeInTheDocument();

    const putCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/api/form-config") &&
        call[1]?.method === "PUT",
    );
    expect(putCall).toBeTruthy();
    const putBody = JSON.parse(String(putCall?.[1]?.body)) as {
      schema: { fields: Array<{ label: string }> };
    };
    expect(
      putBody.schema.fields.some((field) => field.label === "Preferred location"),
    ).toBe(true);
  });

  it("preserves draft when save fails", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (!init || init.method === "GET" || init.method === undefined) {
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
          error: "Invalid form configuration",
          details: ["Duplicate field IDs are not allowed"],
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    });

    renderWithClient(<FormBuilder />);
    expect(await screen.findByText(/field palette/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /\+ text/i }));
    await user.clear(screen.getByLabelText(/^label$/i));
    await user.type(screen.getByLabelText(/^label$/i), "Keep me");
    await user.click(screen.getByRole("button", { name: /save form/i }));

    expect(await screen.findByText(/duplicate|invalid|could not save/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^label$/i)).toHaveValue("Keep me");
  });

  it("keeps edits local until save, supports move/discard, and protects core fields", async () => {
    const user = userEvent.setup();
    vi.mocked(useCurrentUser).mockReturnValue({
      data: {
        user: {
          id: "1",
          name: "Demo Admin",
          email: "admin@aqary.demo",
          role: "ADMIN",
        },
      },
      isLoading: false,
    } as ReturnType<typeof useCurrentUser>);

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (input, init) => {
      if (
        String(input).includes("/api/form-config") &&
        (!init || init.method === "GET" || init.method === undefined)
      ) {
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
      return new Response(JSON.stringify({ error: "Unexpected" }), {
        status: 500,
      });
    });

    renderWithClient(<FormBuilder />);
    expect(await screen.findByText(/field palette/i)).toBeInTheDocument();

    const nameSelect = screen.getByRole("button", { name: /^name/i });
    const nameCard = nameSelect.closest("li");
    expect(nameCard).toBeTruthy();
    expect(
      within(nameCard!).queryByRole("button", { name: /^remove$/i }),
    ).toBeNull();
    expect(screen.getByText(/visible when status = lost/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /\+ text/i }));
    expect(await screen.findByText(/text field/i)).toBeInTheDocument();

    const putCallsBeforeSave = fetchMock.mock.calls.filter(
      (call) =>
        String(call[0]).includes("/api/form-config") &&
        call[1]?.method === "PUT",
    );
    expect(putCallsBeforeSave).toHaveLength(0);

    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    await user.click(moveUpButtons[moveUpButtons.length - 1]!);
    await user.click(screen.getByRole("button", { name: /discard/i }));
    expect(screen.queryByText(/text field/i)).not.toBeInTheDocument();
  });
});
