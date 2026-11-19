/** @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DynamicLeadForm } from "@/components/dynamic-form/dynamic-lead-form";
import { DEFAULT_FORM_SCHEMA } from "@/modules/form-schema/defaults";
import { createEmptyLeadValues } from "@/modules/form-schema/form-values";
import { ApiClientError } from "@/lib/api/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

describe("DynamicLeadForm", () => {
  it("hides Loss Reason until Status is Lost and keeps entered values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DynamicLeadForm
        schema={DEFAULT_FORM_SCHEMA}
        defaultValues={createEmptyLeadValues(DEFAULT_FORM_SCHEMA)}
        submitLabel="Create lead"
        cancelHref="/leads"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText(/loss reason/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^status/i), "Lost");
    expect(await screen.findByLabelText(/loss reason/i)).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/loss reason/i),
      "Budget no longer available",
    );
    await user.selectOptions(screen.getByLabelText(/^status/i), "New");
    expect(screen.queryByLabelText(/loss reason/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^status/i), "Lost");
    expect(await screen.findByLabelText(/loss reason/i)).toHaveValue(
      "Budget no longer available",
    );
  });

  it("blocks submit when visible required Loss Reason is missing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DynamicLeadForm
        schema={DEFAULT_FORM_SCHEMA}
        defaultValues={createEmptyLeadValues(DEFAULT_FORM_SCHEMA)}
        submitLabel="Create lead"
        cancelHref="/leads"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^name/i), "Adam");
    await user.type(screen.getByLabelText(/^email/i), "adam@example.com");
    await user.selectOptions(screen.getByLabelText(/^status/i), "Lost");
    await user.click(screen.getByRole("button", { name: /create lead/i }));

    expect(await screen.findByText(/loss reason is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows submit when Loss Reason is hidden", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DynamicLeadForm
        schema={DEFAULT_FORM_SCHEMA}
        defaultValues={createEmptyLeadValues(DEFAULT_FORM_SCHEMA)}
        submitLabel="Create lead"
        cancelHref="/leads"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^name/i), "Sara");
    await user.type(screen.getByLabelText(/^email/i), "sara@example.com");
    await user.selectOptions(screen.getByLabelText(/^status/i), "New");
    await user.click(screen.getByRole("button", { name: /create lead/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.status).toBe("New");
    expect(payload).not.toHaveProperty("loss_reason");
  });

  it("shows API field errors and preserves entered values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiClientError(422, "Validation failed", {
        fieldErrors: { email: "Enter a valid email address." },
      }),
    );

    render(
      <DynamicLeadForm
        schema={DEFAULT_FORM_SCHEMA}
        defaultValues={createEmptyLeadValues(DEFAULT_FORM_SCHEMA)}
        submitLabel="Create lead"
        cancelHref="/leads"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^name/i), "Sara Ahmed");
    await user.type(screen.getByLabelText(/^email/i), "sara@");
    await user.selectOptions(screen.getByLabelText(/^status/i), "Qualified");
    await user.click(screen.getByRole("button", { name: /create lead/i }));

    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Sara Ahmed");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("sara@");
  });

  it("disables duplicate submits while saving", async () => {
    const user = userEvent.setup();
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <DynamicLeadForm
        schema={DEFAULT_FORM_SCHEMA}
        defaultValues={createEmptyLeadValues(DEFAULT_FORM_SCHEMA)}
        submitLabel="Create lead"
        cancelHref="/leads"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^name/i), "Sara");
    await user.type(screen.getByLabelText(/^email/i), "sara@example.com");
    await user.selectOptions(screen.getByLabelText(/^status/i), "New");
    await user.click(screen.getByRole("button", { name: /create lead/i }));

    expect(await screen.findByRole("button", { name: /saving/i })).toBeDisabled();
    resolveSubmit?.();
  });
});
