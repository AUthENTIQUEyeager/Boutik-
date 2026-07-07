"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Vente, Dette } from "@/types/database";

interface VenteWithProduit extends Vente {
  produits: { nom: string } | null;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [ventes, setVentes] = useState<VenteWithProduit[]>([]);
  const [dettes, setDettes] = useState<Dette[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const [clientRes, ventesRes, dettesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase
        .from("ventes")
        .select("*, produits(nom)")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("dettes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    ]);
    setClient(clientRes.data as Client);
    setVentes((ventesRes.data as VenteWithProduit[]) ?? []);
    setDettes((dettesRes.data as Dette[]) ?? []);
    setLoading(false);
  }

  if (loading) return <p className="text-ink-faint text-[14px]">Chargement…</p>;
  if (!client) return <p className="text-ink-faint text-[14px]">Client introuvable.</p>;

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="card p-4 mb-5">
        <h1 className="text-[18px] font-medium text-ink">{client.nom}</h1>
        {client.telephone && <p className="text-[14px] text-ink-soft mt-1">{client.telephone}</p>}
        {client.notes && <p className="text-[13px] text-ink-faint mt-2">{client.notes}</p>}
      </div>

      <h2 className="text-[15px] font-medium text-ink mb-2">Historique d&apos;achats</h2>
      {ventes.length === 0 ? (
        <p className="text-[13px] text-ink-faint mb-5">Aucun achat enregistré.</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-5">
          {ventes.map((v) => (
            <li key={v.id} className="card p-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] text-ink">
                  {v.produits?.nom ?? "Produit"} × {v.quantite}
                </p>
                <p className="text-[12px] text-ink-faint">
                  {new Date(v.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="text-[14px] font-medium text-accent">
                {Math.round(v.prix_vente_unitaire * v.quantite).toLocaleString("fr-FR")} FCFA
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-[15px] font-medium text-ink mb-2">Dettes</h2>
      {dettes.length === 0 ? (
        <p className="text-[13px] text-ink-faint">Aucune dette.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dettes.map((d) => (
            <li key={d.id} className="card p-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] text-ink">
                  {Math.round(d.montant).toLocaleString("fr-FR")} FCFA (payé{" "}
                  {Math.round(d.montant_paye).toLocaleString("fr-FR")})
                </p>
                {d.date_echeance && (
                  <p className="text-[12px] text-ink-faint">
                    Échéance : {new Date(d.date_echeance).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <span
                className={`text-[12px] px-2 py-1 rounded-full ${
                  d.statut === "soldee" ? "bg-accent-light text-accent" : "bg-danger/10 text-danger"
                }`}
              >
                {d.statut === "soldee" ? "Soldée" : "En cours"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
