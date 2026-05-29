import Link from "next/link";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction } from "@/app/actions/clients";
import { DownloadLinkButton } from "@/components/dashboard/download-link-button";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { q } = await searchParams;
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) return <SetupNotice />;

  const query = supabase
    .from("clients")
    .select("id, full_name, phone, email, pets(name)")
    .eq("groomer_id", groomerId)
    .order("full_name", { ascending: true });

  const { data: allClients } = await query;
  const needle = q?.trim().toLowerCase();
  const clients = needle
    ? (allClients ?? []).filter((c) => {
        const pets = (c.pets as { name: string }[] | null) ?? [];
        const petNames = pets.map((p) => p.name).join(" ");
        const hay = [c.full_name, c.phone, c.email, petNames]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
    : allClients;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600">Pet owners and their pets.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2" action="/clients" method="get">
          <Input
            name="q"
            placeholder="Search name, pet, phone, email"
            defaultValue={q}
            className="w-56"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <DownloadLinkButton href="/api/export/clients" label="Export CSV" />
        </form>
      </div>

      <Card>
        <CardTitle>Add client</CardTitle>
        <CardContent className="mt-4">
          <form action={createClientAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" autoComplete="email" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit">Add client</Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {!clients?.length ? (
          <p className="text-sm text-slate-600">No clients yet.</p>
        ) : (
          clients.map((client) => {
            const pets = client.pets as { name: string }[] | null;
            return (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`}>
                  <Card className="p-4 transition-shadow hover:shadow-md">
                    <p className="font-medium text-slate-900">{client.full_name}</p>
                    <p className="text-sm text-slate-600">
                      {pets?.map((p) => p.name).join(", ") || "No pets yet"}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
