import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardTitle className="text-amber-900">Finish setup to continue</CardTitle>
      <CardDescription className="text-amber-800">
        Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code className="text-xs">.env.local</code>, run the SQL migration in
        Supabase, then restart <code className="text-xs">npm run dev</code>. If you
        already did that, refresh this page or sign out and sign in again.
      </CardDescription>
      <CardContent className="mt-4 text-sm text-amber-900">
        <p>
          See{" "}
          <Link href="https://supabase.com/docs" className="underline">
            Supabase docs
          </Link>{" "}
          for creating a project and API keys.
        </p>
      </CardContent>
    </Card>
  );
}
