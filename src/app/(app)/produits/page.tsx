"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Produit } from "@/types/database";

export default function ProduitsPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);

  const [nom, setNom] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuil, setSeuil] = useState("5");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("produits")
      .select("*")
      .eq("shop_id", userId)
      .order("nom", { ascending: true });
    setProduits((data as Produit[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setNom("");
    setPrixAchat("");
    setPrixVente("");
    setQuantite("");
    setSeuil("5");
    setShowForm(true);
  }

  function openEdit(p: Produit) {
    setEditing(p);
    setNom(p.nom);
    setPrixAchat(String(p.prix_achat));
    setPrixVente(String(p.prix_vente));
    setQuantite(String(p.quantite_stock));
    setSeuil(String(p.seuil_alerte_stock));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nom.trim()) return;

    const payload = {
      shop_id: userId,
      nom: nom.trim(),
      prix_achat: Number(prixAchat) || 0,
      prix_vente: Number(prixVente) || 0,
      quantite_stock: Number(quantite) || 0,
      seuil_alerte_stock: Number(seuil) || 0,
      created_at: editing?.created_at ?? new Date().toISOString(),
    };

    if (editing) {
      await writeLocal("produits", "update", { ...payload, id: editing.id }, editing.id);
      setProduits((prev) =>
        prev
          .map((p) => (p.id === editing.id ? ({ ...payload, id: editing.id } as Produit) : p))
          .sort((a, b) => a.nom.localeCompare(b.nom))
      );
    } else {
      const id = await writeLocal("produits", "insert", payload);
      setProduits((prev) => [...prev, { ...payload, id } as Produit].sort((a, b) => a.nom.localeCompare(b.nom)));
    }

    setShowForm(false);
    flushSyncQueue();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await writeLocal("produits", "delete", { id }, id);
    setProduits((prev) => prev.filter((p) => p.id !== id));
    flushSyncQueue();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Produits &amp; stock</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : produits.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucun produit pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {produits.map((p, i) => {
            const lowStock = p.quantite_stock <= p.seuil_alerte_stock;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => openEdit(p)}
                className="card p-4 flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-medium text-ink">{p.nom}</p>
                    {lowStock && <AlertTriangle size={15} className="text-danger" />}
                  </div>
                  <p className="text-[13px] text-ink-faint mt-0.5">
                    Achat {Math.round(p.prix_achat).toLocaleString("fr-FR")} · Vente{" "}
                    {Math.round(p.prix_vente).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-medium ${lowStock ? "text-danger" : "text-ink"}`}>
                    {p.quantite_stock}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="text-[11px] text-ink-faint mt-1"
                  >
                    Supprimer
                  </button>
                </div>
              </motion.li>
            );
          })}
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
                <h2 className="text-[16px] font-medium text-ink">
                  {editing ? "Modifier le produit" : "Nouveau produit"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" className="input-field" />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="0" value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)} placeholder="Prix d'achat" className="input-field" />
                  <input required type="number" min="0" value={prixVente} onChange={(e) => setPrixVente(e.target.value)} placeholder="Prix de vente" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="0" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="Stock actuel" className="input-field" />
                  <input required type="number" min="0" value={seuil} onChange={(e) => setSeuil(e.target.value)} placeholder="Seuil d'alerte" className="input-field" />
                </div>
                <button type="submit" className="btn-primary mt-1">Enregistrer</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
