import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthConfigured } from "@/lib/auth/provision-oauth-groomer";

export default function LoginPage() {
  const showGoogleAuth = isGoogleAuthConfigured();

  return (
    <Suspense fallback={<p className="text-center text-sm text-slate-600">Loading…</p>}>
      <LoginForm showGoogleAuth={showGoogleAuth} />
    </Suspense>
  );
}
