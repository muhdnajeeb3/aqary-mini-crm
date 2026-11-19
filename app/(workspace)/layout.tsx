import { RequireAuth } from "@/components/auth/require-auth";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
