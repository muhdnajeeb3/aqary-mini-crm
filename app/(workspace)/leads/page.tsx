import { AppShell } from "@/components/layout/app-shell";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

export default function LeadsPage() {
  return (
    <AppShell
      title="Leads"
      description="Manage your sales enquiries in one place."
    >
      <LeadsPageClient />
    </AppShell>
  );
}
