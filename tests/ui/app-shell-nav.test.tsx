/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/app-shell";
import type { PublicUser } from "@/modules/auth/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/leads",
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: vi.fn(),
  useLogout: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

import { useCurrentUser } from "@/hooks/use-auth";

function renderShell(user: PublicUser) {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: { user },
    error: null,
    isLoading: false,
    isFetching: false,
  } as ReturnType<typeof useCurrentUser>);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <AppShell title="Leads">
        <div>Content</div>
      </AppShell>
    </QueryClientProvider>,
  );
}

describe("AppShell navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Form Builder for Admin", () => {
    renderShell({
      id: "1",
      name: "Demo Admin",
      email: "admin@aqary.demo",
      role: "ADMIN",
    });

    expect(screen.getAllByRole("link", { name: "Leads" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole("link", { name: "Form Builder" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });

  it("hides Form Builder for Agent", () => {
    renderShell({
      id: "2",
      name: "Demo Agent",
      email: "agent@aqary.demo",
      role: "AGENT",
    });

    expect(screen.getAllByRole("link", { name: "Leads" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("link", { name: "Form Builder" }),
    ).toBeNull();
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });
});
