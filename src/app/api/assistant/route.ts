import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

const QUOTA_MENSUELLE = 50;

function isSameMonth(dateIso: string) {
  const d = new Date(dateIso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { message } = await request.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "Message trop long (500 caractères max)." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_name, role, ai_credits_used, ai_credits_reset_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }
  if (profile.role !== "commercant") {
    return NextResponse.json({ error: "Assistant réservé aux comptes commerçants." }, { status: 403 });
  }

  // Réinitialisation automatique du compteur au changement de mois
  let creditsUsed = profile.ai_credits_used;
  if (!isSameMonth(profile.ai_credits_reset_at)) {
    creditsUsed = 0;
    await supabase
      .from("profiles")
      .update({ ai_credits_used: 0, ai_credits_reset_at: new Date().toISOString().slice(0, 10) })
      .eq("id", user.id);
  }

  if (creditsUsed >= QUOTA_MENSUELLE) {
    return NextResponse.json(
      {
        error: `Tu as atteint ton quota de ${QUOTA_MENSUELLE} questions ce mois-ci. Le compteur se réinitialise le mois prochain.`,
        creditsUsed,
        creditsLimit: QUOTA_MENSUELLE,
      },
      { status: 429 }
    );
  }

  // ---- Contexte métier agrégé (jamais de nom/téléphone de client) ----
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [ventesJour, ventesMois, produits, dettes] = await Promise.all([
    supabase.from("ventes").select("benefice_calcule").eq("shop_id", user.id).gte("created_at", startOfDay),
    supabase.from("ventes").select("benefice_calcule").eq("shop_id", user.id).gte("created_at", startOfMonth),
    supabase.from("produits").select("nom, quantite_stock, seuil_alerte_stock").eq("shop_id", user.id),
    supabase.from("dettes").select("montant, montant_paye").eq("shop_id", user.id).eq("statut", "en_cours"),
  ]);

  const beneficeJour = (ventesJour.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const beneficeMois = (ventesMois.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const stockTotal = (produits.data ?? []).reduce((sum, p) => sum + Number(p.quantite_stock), 0);
  const produitsBas = (produits.data ?? [])
    .filter((p) => p.quantite_stock <= p.seuil_alerte_stock)
    .map((p) => p.nom)
    .slice(0, 8);
  const dettesEnCours = (dettes.data ?? []).reduce(
    (sum, d) => sum + (Number(d.montant) - Number(d.montant_paye)),
    0
  );
  const nombreDettes = (dettes.data ?? []).length;

  const systemPrompt = `Tu es l'assistant intégré à Boutik+, une application de gestion pour petits commerçants d'Afrique de l'Ouest. Tu réponds en français, de façon brève (3-4 phrases maximum), simple et concrète, sans jargon technique. Tu t'adresses au commerçant de la boutique "${profile.shop_name}".

Voici les données actuelles de sa boutique (chiffres uniquement, aucune donnée personnelle de client) :
- Bénéfice du jour : ${Math.round(beneficeJour)} FCFA
- Bénéfice du mois : ${Math.round(beneficeMois)} FCFA
- Stock total : ${stockTotal} unités
- Produits en stock bas : ${produitsBas.length > 0 ? produitsBas.join(", ") : "aucun"}
- Dettes en cours : ${Math.round(dettesEnCours)} FCFA sur ${nombreDettes} dette(s)

Réponds uniquement à des questions liées à la gestion de sa boutique (ventes, stock, dépenses, dettes, conseils de gestion simples). Si la question sort de ce cadre, réponds poliment que tu es limité à la gestion de la boutique. N'invente jamais de chiffres qui ne sont pas dans les données ci-dessus.`;

  let reply: string;
  try {
    reply = await askGemini(systemPrompt, message.trim());
  } catch (err) {
    console.error("Erreur assistant IA:", err);
    return NextResponse.json(
      { error: "L'assistant est momentanément indisponible. Réessaie dans un instant." },
      { status: 502 }
    );
  }

  const newCreditsUsed = creditsUsed + 1;
  await supabase.from("profiles").update({ ai_credits_used: newCreditsUsed }).eq("id", user.id);

  return NextResponse.json({
    reply,
    creditsUsed: newCreditsUsed,
    creditsLimit: QUOTA_MENSUELLE,
  });
}
