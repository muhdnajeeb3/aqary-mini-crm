"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/client";
import { useLogin } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      await login.mutateAsync(parsed.data);
      router.replace("/leads");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        setFormError(
          error.status === 401
            ? "Invalid email or password"
            : error.message || "Unable to sign in",
        );
        return;
      }
      setFormError("Unable to sign in. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md space-y-5 rounded-[var(--radius-md)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]"
      noValidate
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Use your AQARY Mini CRM demo account.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-text">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          disabled={login.isPending}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-sm text-danger" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          disabled={login.isPending}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-sm text-danger" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-[var(--radius-sm)] bg-danger-muted px-3 py-2 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
