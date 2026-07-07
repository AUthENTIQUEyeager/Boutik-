"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Produit, Client, Vente } from "@/types/database";

interface VenteRow extends Vente {
  produit_nom?: string;
  client_nom?: string;
}

export default function VentesPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [ventes, setVentes] = useState<VenteRow[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [produitId, setProduitId] = useState("");
  const [clientId, setClientId] = useState("");
  const [quantite, setQuantite] = useState("1");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const [ventesRes, produitsRes, clientsRes] = await Promise.all([
      supabase
        .from("ventes")
        .select("*, produits(nom), clients(nom)")
        .eq("shop_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("produits").select("*").eq("shop_id", userId).order("nom"),
      supabase.from("clients").select("*").eq("shop_id", userId).order("nom"),
    ]);

    const rows =
      (ventesRes.data as (Vente & { produits: { nom: string } | null; clients: { nom: string } | null })[]) ?? [];

    setVentes(
      rows.map((v) => ({
        ...v,
        produit_nom: v.produits?.nom,
        client_nom: v.clients?.nom,
      }))
    );
    setProduits((produitsRes.data as Produit[]) ?? []);
    setClients((clientsRes.data as Client[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setError(null);
    setProduitId(produits[0]?.id ?? "");
    setClientId("");
    setQuantite("1");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;

    const produit = produits.find((p) => p.id === produitId);
    const qty = Number(quantite);

    if (!produit) {
      setError("Choisis un produit.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("Quantité invalide.");
      return;
    }
    if (qty > produit.quantite_stock) {
      setError(`Stock insuffisant (disponible : ${produit.quantite_stock}).`);
      return;
    }

    const benefice = (produit.prix_vente - produit.prix_achat) * qty;
    const payload = {
      shop_id: userId,
      client_id: clientId || null,
      produit_id: produit.id,
      quantite: qty,
      prix_achat_unitaire: produit.prix_achat,
      prix_vente_unitaire: produit.prix_vente,
      benefice_calcule: benefice,
      created_at: new Date().toISOString(),
    };

    const id = await writeLocal("ventes", "insert", payload);

    // Mise à jour optimiste : stock décrémenté localement, liste rafraîchie
    setProduits((prev) =>
      prev.map((p) => (p.id === produit.id ? { ...p, quantite_stock: p.quantite_stock - qty } : p))
    );
    setVentes((prev) => [
      {
        ...payload,
        id,
        produit_nom: produit.nom,
        client_nom: clients.find((c) => c.id === clientId)?.nom,
      } as VenteRow,
      ...prev,
    ]);

    setShowForm(false);
    flushSyncQueue();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Ventes</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Nouvelle vente
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : ventes.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucune vente enregistrée.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {ventes.map((v, i) => (
            <motion.li
              key={v.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              className="card p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {v.produit_nom ?? "Produit"} × {v.quantite}
                </p>
                <p className="text-[13px] text-ink-faint mt-0.5">
                  {v.client_nom ?? "Client de passage"} ·{" "}
                  {new Date(v.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="text-[15px] font-medium text-accent">
                +{Math.round(v.benefice_calcule).toLocaleString("fr-FR")} FCFA
              </p>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40 flex items-end md:items-center justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-card md:rounded-card p-5 w-full md:max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-medium text-ink">Nouvelle vente</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <select required value={produitId} onChange={(e) => setProduitId(e.target.value)} className="input-field">
                  <option value="" disabled>Choisir un produit</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (stock : {p.quantite_stock})
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  placeholder="Quantité"
                  className="input-field"
                />
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field">
                  <option value="">Client de passage</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>

                {error && <p className="text-[13px] text-danger">{error}</p>}

                <button type="submit" className="btn-primary mt-1">Enregistrer la vente</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
