import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/MetricCard";
import SalesChart, { type ChartPoint } from "@/components/SalesChart";

function formatFcfa(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOf14Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13).toISOString();

  const [ventesJour, ventesMois, produits, dettes, ventes14j, depenses14j] = await Promise.all([
    supabase
      .from("ventes")
      .select("benefice_calcule")
      .eq("shop_id", user.id)
      .gte("created_at", startOfDay),
    supabase
      .from("ventes")
      .select("benefice_calcule")
      .eq("shop_id", user.id)
      .gte("created_at", startOfMonth),
    supabase.from("produits").select("quantite_stock").eq("shop_id", user.id),
    supabase
      .from("dettes")
      .select("montant, montant_paye")
      .eq("shop_id", user.id)
      .eq("statut", "en_cours"),
    supabase
      .from("ventes")
      .select("created_at, benefice_calcule, prix_vente_unitaire, quantite")
      .eq("shop_id", user.id)
      .gte("created_at", startOf14Days),
    supabase
      .from("depenses")
      .select("created_at, montant")
      .eq("shop_id", user.id)
      .gte("created_at", startOf14Days),
  ]);

  const beneficeJour = (ventesJour.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const beneficeMois = (ventesMois.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const stockTotal = (produits.data ?? []).reduce((sum, p) => sum + Number(p.quantite_stock), 0);
  const dettesEnCours = (dettes.data ?? []).reduce(
    (sum, d) => sum + (Number(d.montant) - Number(d.montant_paye)),
    0
  );

  // Construction de la série des 14 derniers jours pour le graphique
  const days: ChartPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      benefice: 0,
      depenses: 0,
      ventes: 0,
    });
  }
  const dayIndex = (iso: string) => {
    const d = new Date(iso);
    const key = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    return days.findIndex((p) => p.date === key);
  };

  for (const v of ventes14j.data ?? []) {
    const idx = dayIndex(v.created_at);
    if (idx >= 0) {
      days[idx].benefice += Number(v.benefice_calcule);
      days[idx].ventes += Number(v.prix_vente_unitaire) * Number(v.quantite);
    }
  }
  for (const d of depenses14j.data ?? []) {
    const idx = dayIndex(d.created_at);
    if (idx >= 0) days[idx].depenses += Number(d.montant);
  }

  return (
    <div>
      <h1 className="text-[20px] font-medium text-ink mb-5">Tableau de bord</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Bénéfice du jour" value={formatFcfa(beneficeJour)} accent />
        <MetricCard label="Bénéfice du mois" value={formatFcfa(beneficeMois)} accent />
        <MetricCard label="Stock total (unités)" value={stockTotal.toLocaleString("fr-FR")} />
        <MetricCard label="Dettes en cours" value={formatFcfa(dettesEnCours)} />
      </div>

      <SalesChart data={days} />
    </div>
  );
}
