import { AppShell } from "@/components/layout/app-shell";
import { CreateLeadFormPage } from "@/components/leads/lead-form-page";

export default function CreateLeadPage() {
  return (
    <AppShell title="Create lead" description="Saved form layout">
      <CreateLeadFormPage />
    </AppShell>
  );
}
