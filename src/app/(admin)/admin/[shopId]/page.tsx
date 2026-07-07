"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Vente } from "@/types/database";
import MetricCard from "@/components/MetricCard";

export default function AdminShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<Profile | null>(null);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryInput, setExpiryInput] = useState("");
  const [savingExpiry, setSavingExpiry] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function load() {
    setLoading(true);
    const [shopRes, ventesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", shopId).single(),
      supabase
        .from("ventes")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setShop(shopRes.data as Profile);
    setExpiryInput((shopRes.data as Profile)?.subscription_expires_at?.slice(0, 10) ?? "");
    setVentes((ventesRes.data as Vente[]) ?? []);
    setLoading(false);
  }

  async function handleSaveExpiry() {
    if (!expiryInput) return;
    setSavingExpiry(true);
    const res = await fetch("/api/admin/set-expiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, expiresAt: new Date(expiryInput).toISOString() }),
    });
    setSavingExpiry(false);
    if (res.ok) load();
  }

  if (loading) return <p className="text-ink-faint text-[14px]">Chargement…</p>;
  if (!shop) return <p className="text-ink-faint text-[14px]">Boutique introuvable.</p>;

  const totalVentes = ventes.reduce((sum, v) => sum + v.prix_vente_unitaire * v.quantite, 0);
  const totalBenefice = ventes.reduce((sum, v) => sum + Number(v.benefice_calcule), 0);

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="card p-4 mb-5">
        <h1 className="text-[18px] font-medium text-ink">{shop.shop_name}</h1>
        <p className="text-[14px] text-ink-soft mt-1">{shop.phone}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard label="Ventes totales (20 dernières)" value={`${Math.round(totalVentes).toLocaleString("fr-FR")} FCFA`} accent />
        <MetricCard label="Bénéfice (20 dernières)" value={`${Math.round(totalBenefice).toLocaleString("fr-FR")} FCFA`} />
      </div>

      <div className="card p-4 mb-5">
        <p className="text-[14px] font-medium text-ink mb-2">Abonnement</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={expiryInput}
            onChange={(e) => setExpiryInput(e.target.value)}
            className="input-field py-2"
          />
          <button onClick={handleSaveExpiry} disabled={savingExpiry} className="btn-primary py-2 px-4">
            {savingExpiry ? "…" : "Mettre à jour"}
          </button>
        </div>
      </div>

      <h2 className="text-[15px] font-medium text-ink mb-2">Activité récente</h2>
      {ventes.length === 0 ? (
        <p className="text-[13px] text-ink-faint">Aucune vente récente.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ventes.map((v) => (
            <li key={v.id} className="card p-3 flex items-center justify-between">
              <p className="text-[13px] text-ink-soft">
                {new Date(v.created_at).toLocaleString("fr-FR")}
              </p>
              <p className="text-[14px] text-ink">
                {Math.round(v.prix_vente_unitaire * v.quantite).toLocaleString("fr-FR")} FCFA
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
