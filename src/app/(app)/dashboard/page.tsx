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

  const [profileResult, ventesJour, ventesMois, produits, dettes, ventes14j, depenses14j] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
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
  const plan = profileResult.data?.plan ?? 'free';

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

      {plan === 'free' && (
        <div className="mb-5 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM9 13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm1.5-8a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Compte gratuit (très limité)
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Vous êtes limité à 10 clients, 20 ventes/mois et 5 questions IA/mois.
              </p>
              <div className="mt-2 flex space-x-2">
                <a
                  href="/pricing"
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-center text-yellow-800 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                >
                  Passer à Essential (3000 FCFA)
                </a>
                <a
                  href="/pricing"
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-center text-yellow-800 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                >
                  Passer à Professional (5000 FCFA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {plan === 'essential' && (
        <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.25a.75.75 0 000 1.5H9a.75.75 0 000 1.5h.253a.55.55 0 00.446.16l.348.695a.5.5 0 00.68.05l.384-.38a.5.5 0 10.47-.74l-.38-.38a.55.55 0 00-.16-.446H9a.75.75 0 00-1.5 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Compte Essential
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Vous bénéficiez de clients illimités, 50 questions IA/mois et l'export CSV.
              </p>
              <div className="mt-2">
                <a
                  href="/pricing"
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-center text-blue-800 bg-blue-100 rounded-lg hover:bg-blue-200"
                >
                  Passer à Professional (5000 FCFA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {plan === 'professional' && (
        <div className="mb-5 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.888 6.47c-.79-1.757-2.865-2.757-4.888-2.757s-4.097 1-4.888 2.757l-.782 1.83a1 1 0 00-.36 1.388l1.807.573a1 1 0 001.14.05l1.173-.655a1.001 1.001 0 00.894-.533l.273-1.795zM9 18a9 9 0 100-18 9 9 0 000 18z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Compte Professional
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Vous avez accès à toutes les fonctionnalités illimitées.
              </p>
            </div>
          </div>
        </div>
      )}

      <SalesChart data={days} />
    </div>
  );
}
