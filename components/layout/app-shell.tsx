"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

const navItems = [
  { href: "/leads", label: "Leads", adminOnly: false },
  { href: "/form-builder", label: "Form Builder", adminOnly: true },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useCurrentUser();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = data?.user;
  const isAdmin = user?.role === "ADMIN";

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-page text-text lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[240px] border-r border-border bg-surface p-4 transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Workspace navigation"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-primary">
              AQARY
            </p>
            <p className="text-sm text-text-muted">Workspace</p>
          </div>
          <Button
            variant="ghost"
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1">
          {visibleNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "touch-target flex items-center rounded-[var(--radius-md)] px-3 text-sm font-medium",
                  active
                    ? "bg-primary-muted text-primary"
                    : "text-text hover:bg-page",
                )}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-text/30 lg:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                className="lg:hidden"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  AQARY
                </p>
                <h1 className="truncate text-xl font-semibold text-text">
                  {title}
                </h1>
                {description ? (
                  <p className="truncate text-sm text-text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-text">{user.name}</p>
                  <p className="text-xs text-text-muted">
                    {user.role === "ADMIN" ? "Administrator" : "Agent"}
                  </p>
                </div>
              ) : null}
              <Button
                variant="secondary"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                {logout.isPending ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
