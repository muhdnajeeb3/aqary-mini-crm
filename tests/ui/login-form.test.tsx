/** @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
    push: vi.fn(),
  }),
}));

function renderLogin() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(),
    );
  });

  it("shows validation errors for empty credentials", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("navigates to leads on successful login", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "1",
            name: "Demo Admin",
            email: "admin@aqary.demo",
            role: "ADMIN",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    renderLogin();

    await user.type(screen.getByLabelText(/^email$/i), "admin@aqary.demo");
    await user.type(screen.getByLabelText(/^password$/i), "AqaryDemo!2026");
    await user.click(screen.getAllByRole("button", { name: /sign in/i })[0]!);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/leads");
    });
  });

  it("shows a generic error on invalid credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    renderLogin();

    await user.type(screen.getByLabelText(/^email$/i), "admin@aqary.demo");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getAllByRole("button", { name: /sign in/i })[0]!);

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
