import { AppShell } from "@/components/layout/app-shell";
import { EditLeadFormPage } from "@/components/leads/lead-form-page";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell title="Edit lead" description="Saved form layout">
      <EditLeadFormPage leadId={id} />
    </AppShell>
  );
}
