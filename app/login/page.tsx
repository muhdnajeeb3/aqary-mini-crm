import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary">
          AQARY
        </p>
        <p className="mt-1 text-sm text-text-muted">Mini CRM</p>
      </div>
      <LoginForm />
    </div>
  );
}
