"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Minus, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Produit, Client, Vente } from "@/types/database";

interface VenteRow extends Vente {
  produit_nom?: string;
  client_nom?: string;
}

type Mode = "rapide" | "historique";

export default function VentesPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("rapide");
  const [ventes, setVentes] = useState<VenteRow[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Vente rapide : panier { produit_id: quantite }
  const [panier, setPanier] = useState<Record<string, number>>({});
  const [panierClientId, setPanierClientId] = useState("");
  const [validating, setValidating] = useState(false);

  // Vente détaillée (formulaire complet)
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

  // ---------- Vente rapide ----------

  function stockDisponible(produitId: string) {
    const p = produits.find((x) => x.id === produitId);
    if (!p) return 0;
    return p.quantite_stock - (panier[produitId] ?? 0);
  }

  function addToPanier(produitId: string) {
    if (stockDisponible(produitId) <= 0) return;
    setPanier((prev) => ({ ...prev, [produitId]: (prev[produitId] ?? 0) + 1 }));
  }

  function removeFromPanier(produitId: string) {
    setPanier((prev) => {
      const next = { ...prev };
      if (!next[produitId]) return prev;
      next[produitId] -= 1;
      if (next[produitId] <= 0) delete next[produitId];
      return next;
    });
  }

  const panierItems = useMemo(
    () =>
      Object.entries(panier)
        .map(([id, qty]) => ({ produit: produits.find((p) => p.id === id), qty }))
        .filter((x) => x.produit),
    [panier, produits]
  );

  const panierTotal = panierItems.reduce((sum, x) => sum + (x.produit?.prix_vente ?? 0) * x.qty, 0);
  const panierCount = panierItems.reduce((sum, x) => sum + x.qty, 0);

  async function validerPanier() {
    if (!userId || panierItems.length === 0) return;
    setValidating(true);

    const nouvellesVentes: VenteRow[] = [];

    for (const { produit, qty } of panierItems) {
      if (!produit) continue;
      const benefice = (produit.prix_vente - produit.prix_achat) * qty;
      const payload = {
        shop_id: userId,
        client_id: panierClientId || null,
        produit_id: produit.id,
        quantite: qty,
        prix_achat_unitaire: produit.prix_achat,
        prix_vente_unitaire: produit.prix_vente,
        benefice_calcule: benefice,
        created_at: new Date().toISOString(),
      };
      const id = await writeLocal("ventes", "insert", payload);
      nouvellesVentes.push({
        ...payload,
        id,
        produit_nom: produit.nom,
        client_nom: clients.find((c) => c.id === panierClientId)?.nom,
      } as VenteRow);
    }

    // Mise à jour optimiste du stock local
    setProduits((prev) =>
      prev.map((p) => (panier[p.id] ? { ...p, quantite_stock: p.quantite_stock - panier[p.id] } : p))
    );
    setVentes((prev) => [...nouvellesVentes, ...prev]);
    setPanier({});
    setPanierClientId("");
    setValidating(false);
    flushSyncQueue();
  }

  // ---------- Vente détaillée ----------

  function openDetailForm() {
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-medium text-ink">Ventes</h1>
        <button onClick={openDetailForm} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-[13px]">
          <Plus size={16} /> Vente détaillée
        </button>
      </div>

      {/* Bascule Vente rapide / Historique */}
      <div className="flex bg-surfacealt rounded-2xl p-1 mb-5 max-w-xs">
        <button
          onClick={() => setMode("rapide")}
          className={`flex-1 text-[13px] font-medium py-2 rounded-xl transition-colors ${
            mode === "rapide" ? "bg-white text-ink shadow-card" : "text-ink-faint"
          }`}
        >
          Vente rapide
        </button>
        <button
          onClick={() => setMode("historique")}
          className={`flex-1 text-[13px] font-medium py-2 rounded-xl transition-colors ${
            mode === "historique" ? "bg-white text-ink shadow-card" : "text-ink-faint"
          }`}
        >
          Historique
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : mode === "rapide" ? (
        <div className="pb-24">
          {produits.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-[14px] text-ink-soft">Ajoute d&apos;abord des produits pour vendre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {produits.map((p) => {
                const qtyInPanier = panier[p.id] ?? 0;
                const disponible = stockDisponible(p.id);
                const rupture = disponible <= 0 && qtyInPanier === 0;
                return (
                  <div
                    key={p.id}
                    className={`card p-3 flex flex-col ${rupture ? "opacity-40" : ""}`}
                  >
                    <p className="text-[13px] font-medium text-ink leading-tight mb-1">{p.nom}</p>
                    <p className="text-[12px] text-ink-faint mb-2">
                      {Math.round(p.prix_vente).toLocaleString("fr-FR")} FCFA
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      {qtyInPanier > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromPanier(p.id)}
                            className="h-7 w-7 rounded-full bg-surfacealt flex items-center justify-center active:scale-[0.9] transition-transform"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-[14px] font-medium text-ink w-4 text-center">{qtyInPanier}</span>
                          <button
                            onClick={() => addToPanier(p.id)}
                            disabled={disponible <= 0}
                            className="h-7 w-7 rounded-full bg-accent text-white flex items-center justify-center active:scale-[0.9] transition-transform disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToPanier(p.id)}
                          disabled={rupture}
                          className="btn-primary py-1.5 px-3 text-[13px] w-full text-center disabled:opacity-40"
                        >
                          {rupture ? "Rupture" : "Ajouter"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {panierCount > 0 && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed bottom-[64px] md:bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30"
              >
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={16} className="text-accent" />
                      <span className="text-[13px] text-ink-soft">{panierCount} article{panierCount > 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-[16px] font-medium text-ink">
                      {Math.round(panierTotal).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <select
                    value={panierClientId}
                    onChange={(e) => setPanierClientId(e.target.value)}
                    className="input-field py-2 text-[13px] mb-2"
                  >
                    <option value="">Client de passage</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  <button onClick={validerPanier} disabled={validating} className="btn-primary w-full">
                    {validating ? "Enregistrement…" : "Valider la vente"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
                <h2 className="text-[16px] font-medium text-ink">Vente détaillée</h2>
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
