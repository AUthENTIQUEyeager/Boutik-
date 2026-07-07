import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/MetricCard";

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

  const [ventesJour, ventesMois, produits, dettes] = await Promise.all([
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
  ]);

  const beneficeJour = (ventesJour.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const beneficeMois = (ventesMois.data ?? []).reduce((sum, v) => sum + Number(v.benefice_calcule), 0);
  const stockTotal = (produits.data ?? []).reduce((sum, p) => sum + Number(p.quantite_stock), 0);
  const dettesEnCours = (dettes.data ?? []).reduce(
    (sum, d) => sum + (Number(d.montant) - Number(d.montant_paye)),
    0
  );

  return (
    <div>
      <h1 className="text-[20px] font-medium text-ink mb-5">Tableau de bord</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Bénéfice du jour" value={formatFcfa(beneficeJour)} accent />
        <MetricCard label="Bénéfice du mois" value={formatFcfa(beneficeMois)} accent />
        <MetricCard label="Stock total (unités)" value={stockTotal.toLocaleString("fr-FR")} />
        <MetricCard label="Dettes en cours" value={formatFcfa(dettesEnCours)} />
      </div>
    </div>
  );
}
