import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csvRow } from "@/lib/csv";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  const session = await auth();
  const groomerId = session?.user?.id;
  if (!groomerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("full_name, phone, email, notes, created_at, pets(name, breed, allergies)")
    .eq("groomer_id", groomerId)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lines = [
    csvRow([
      "client_name",
      "phone",
      "email",
      "pet_names",
      "pet_breeds",
      "allergies",
      "notes",
      "created_at",
    ]),
  ];

  for (const client of clients ?? []) {
    const pets = (client.pets as { name: string; breed: string | null; allergies: string | null }[]) ?? [];
    lines.push(
      csvRow([
        client.full_name,
        client.phone,
        client.email,
        pets.map((p) => p.name).join("; "),
        pets.map((p) => p.breed ?? "").join("; "),
        pets.map((p) => p.allergies ?? "").join("; "),
        client.notes,
        client.created_at,
      ]),
    );
  }

  const body = `\uFEFF${lines.join("\r\n")}`;
  const filename = `groomerflow-clients-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
