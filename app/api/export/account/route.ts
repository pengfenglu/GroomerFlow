import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** GDPR-style portability: JSON export of groomer-owned data. */
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
  const [
    { data: profile },
    { data: clients },
    { data: pets },
    { data: services },
    { data: appointments },
    { data: serviceRecords },
    { data: availability },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", groomerId).single(),
    supabase.from("clients").select("*").eq("groomer_id", groomerId),
    supabase.from("pets").select("*").eq("groomer_id", groomerId),
    supabase.from("services").select("*").eq("groomer_id", groomerId),
    supabase.from("appointments").select("*").eq("groomer_id", groomerId),
    supabase.from("service_records").select("*").eq("groomer_id", groomerId),
    supabase.from("availability_rules").select("*").eq("groomer_id", groomerId),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    groomer_id: groomerId,
    profile,
    clients: clients ?? [],
    pets: pets ?? [],
    services: services ?? [],
    appointments: appointments ?? [],
    service_records: serviceRecords ?? [],
    availability_rules: availability ?? [],
  };

  const filename = `groomerflow-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
