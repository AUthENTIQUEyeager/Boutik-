import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { shopId, status } = await request.json();
  if (!shopId || !["actif", "bloque"].includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ status }).eq("id", shopId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
