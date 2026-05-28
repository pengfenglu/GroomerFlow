import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthConfigured } from "@/lib/auth/provision-oauth-groomer";

export default function RegisterPage() {
  return <RegisterForm showGoogleAuth={isGoogleAuthConfigured()} />;
}
