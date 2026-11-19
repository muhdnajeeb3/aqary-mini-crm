import { AppShell } from "@/components/layout/app-shell";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell title="Lead details" description="View lead">
      <LeadDetail leadId={id} />
    </AppShell>
  );
}
