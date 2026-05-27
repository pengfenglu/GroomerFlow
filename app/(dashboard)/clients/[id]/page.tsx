import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPetAction } from "@/app/actions/clients";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { id } = await params;
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase) return <SetupNotice />;

  const { data: client } = await supabase
    .from("clients")
    .select("*, pets(*)")
    .eq("id", id)
    .eq("groomer_id", groomerId)
    .single();

  if (!client) notFound();

  const pets = (client.pets ?? []) as Array<{
    id: string;
    name: string;
    breed: string | null;
    temperament: string | null;
    coat_notes: string | null;
  }>;

  return (
    <div className="space-y-6">
      <Link href="/clients" className="text-sm text-green-800 hover:underline">
        ← Back to clients
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{client.full_name}</h1>
        <p className="text-sm text-slate-600">
          {[client.phone, client.email].filter(Boolean).join(" · ") || "No contact info"}
        </p>
      </div>

      <Card>
        <CardTitle>Add pet</CardTitle>
        <CardContent className="mt-4">
          <form action={createPetAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="client_id" value={client.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Pet name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed (optional)</Label>
              <Input id="breed" name="breed" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperament">Temperament (optional)</Label>
              <Input id="temperament" name="temperament" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coat_notes">Coat notes (optional)</Label>
              <Input id="coat_notes" name="coat_notes" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="allergies">Allergies (optional)</Label>
              <Input id="allergies" name="allergies" />
            </div>
            <Button type="submit">Add pet</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Pets</h2>
        {!pets.length ? (
          <p className="text-sm text-slate-600">No pets yet.</p>
        ) : (
          pets.map((pet) => (
            <Card key={pet.id} className="p-4">
              <p className="font-medium">{pet.name}</p>
              <p className="text-sm text-slate-600">
                {[pet.breed, pet.temperament, pet.coat_notes]
                  .filter(Boolean)
                  .join(" · ") || "No details"}
              </p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
