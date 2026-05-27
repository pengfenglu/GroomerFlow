import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createServiceRecordAction } from "@/app/actions/records";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { formatInProfileTimezone, formatPriceCents } from "@/lib/timezone";
import { getProfileForGroomer } from "@/lib/data/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { one } from "@/lib/supabase/relations";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const profile = await getProfileForGroomer();
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase || !profile) return <SetupNotice />;

  const [{ data: records }, { data: pets }, { data: services }] = await Promise.all([
    supabase
      .from("service_records")
      .select("*, pets(name), services(name)")
      .eq("groomer_id", groomerId)
      .order("performed_at", { ascending: false })
      .limit(50),
    supabase
      .from("pets")
      .select("id, name")
      .eq("groomer_id", groomerId)
      .order("name"),
    supabase
      .from("services")
      .select("id, name")
      .eq("groomer_id", groomerId)
      .eq("is_active", true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Service records</h1>
        <p className="text-sm text-slate-600">Grooming history and notes.</p>
      </div>

      <Card>
        <CardTitle>Add record</CardTitle>
        <CardContent className="mt-4">
          <form action={createServiceRecordAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pet_id">Pet *</Label>
              <select
                id="pet_id"
                name="pet_id"
                required
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">Select pet</option>
                {pets?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_id">Service (optional)</Label>
              <select
                id="service_id"
                name="service_id"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="">—</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_dollars">Amount (USD)</Label>
              <Input
                id="price_dollars"
                name="price_dollars"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performed_at">Date (optional)</Label>
              <Input id="performed_at" name="performed_at" type="datetime-local" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit">Save record</Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {!records?.length ? (
          <p className="text-sm text-slate-600">No service records yet.</p>
        ) : (
          records.map((rec) => {
            const pet = one(rec.pets as { name: string } | { name: string }[]);
            const service = one(
              rec.services as { name: string } | { name: string }[],
            );
            return (
              <li key={rec.id}>
                <Card className="p-4">
                  <p className="font-medium text-slate-900">
                    {pet?.name} · {formatPriceCents(rec.amount_cents)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatInProfileTimezone(rec.performed_at, profile.timezone)}
                    {service?.name ? ` · ${service.name}` : ""}
                  </p>
                  {rec.notes ? (
                    <p className="mt-1 text-sm text-slate-600">{rec.notes}</p>
                  ) : null}
                </Card>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
