"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft, Trash2, PackageCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "@/lib/useUser";
import type { Livraison, LivraisonLigne, Fournisseur, Produit } from "@/types/database";

interface LivraisonRow extends Livraison {
  fournisseur_nom?: string;
  lignes: (LivraisonLigne & { produit_nom?: string })[];
}

interface DraftLigne {
  produit_id: string;
  quantite: string;
  prix_achat_unitaire: string;
}

export default function LivraisonsPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [livraisons, setLivraisons] = useState<LivraisonRow[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fournisseurId, setFournisseurId] = useState("");
  const [datePrevue, setDatePrevue] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<DraftLigne[]>([{ produit_id: "", quantite: "", prix_achat_unitaire: "" }]);

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const [livraisonsRes, fournisseursRes, produitsRes] = await Promise.all([
      supabase
        .from("livraisons")
        .select("*, fournisseurs(nom), livraison_lignes(*, produits(nom))")
        .eq("shop_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("fournisseurs").select("*").eq("shop_id", userId).order("nom"),
      supabase.from("produits").select("*").eq("shop_id", userId).order("nom"),
    ]);

    type Raw = Livraison & {
      fournisseurs: { nom: string } | null;
      livraison_lignes: (LivraisonLigne & { produits: { nom: string } | null })[];
    };
    const rows = (livraisonsRes.data as Raw[]) ?? [];
    setLivraisons(
      rows.map((r) => ({
        ...r,
        fournisseur_nom: r.fournisseurs?.nom,
        lignes: r.livraison_lignes.map((l) => ({ ...l, produit_nom: l.produits?.nom })),
      }))
    );
    setFournisseurs((fournisseursRes.data as Fournisseur[]) ?? []);
    setProduits((produitsRes.data as Produit[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setError(null);
    setFournisseurId("");
    setDatePrevue("");
    setNotes("");
    setLignes([{ produit_id: "", quantite: "", prix_achat_unitaire: "" }]);
    setShowForm(true);
  }

  function updateLigne(index: number, patch: Partial<DraftLigne>) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLigne() {
    setLignes((prev) => [...prev, { produit_id: "", quantite: "", prix_achat_unitaire: "" }]);
  }

  function removeLigne(index: number) {
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;

    const validLignes = lignes.filter((l) => l.produit_id && Number(l.quantite) > 0);
    if (validLignes.length === 0) {
      setError("Ajoute au moins un produit avec une quantité.");
      return;
    }

    const { data: livraison, error: livErr } = await supabase
      .from("livraisons")
      .insert({
        shop_id: userId,
        fournisseur_id: fournisseurId || null,
        statut: "attendue",
        date_prevue: datePrevue || null,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (livErr || !livraison) {
      setError("Une erreur est survenue.");
      return;
    }

    const lignesPayload = validLignes.map((l) => ({
      livraison_id: livraison.id,
      produit_id: l.produit_id,
      quantite: Number(l.quantite),
      prix_achat_unitaire: Number(l.prix_achat_unitaire) || 0,
    }));

    const { error: lignesErr } = await supabase.from("livraison_lignes").insert(lignesPayload);
    if (lignesErr) {
      setError("Une erreur est survenue lors de l'ajout des articles.");
      return;
    }

    setShowForm(false);
    load();
  }

  async function marquerRecue(livraison: LivraisonRow) {
    if (!confirm("Confirmer la réception ? Le stock des produits sera automatiquement mis à jour.")) return;
    const { error } = await supabase
      .from("livraisons")
      .update({ statut: "recue", date_reception: new Date().toISOString() })
      .eq("id", livraison.id);
    if (!error) load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette livraison ?")) return;
    const { error } = await supabase.from("livraisons").delete().eq("id", id);
    if (!error) setLivraisons((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <Link href="/plus" className="md:hidden flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Livraisons</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Nouvelle
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : livraisons.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucune livraison enregistrée.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {livraisons.map((l, i) => (
            <motion.li
              key={l.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-ink">
                    {l.fournisseur_nom ?? "Fournisseur non précisé"}
                  </p>
                  <p className="text-[13px] text-ink-faint mt-0.5">
                    {l.lignes.length} article{l.lignes.length > 1 ? "s" : ""}
                    {l.date_prevue ? ` · Prévue le ${new Date(l.date_prevue).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
                <span
                  className={`text-[12px] px-2 py-1 rounded-full whitespace-nowrap ${
                    l.statut === "recue"
                      ? "bg-accent-light text-accent"
                      : l.statut === "annulee"
                      ? "bg-black/5 text-ink-faint"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {l.statut === "recue" ? "Reçue" : l.statut === "annulee" ? "Annulée" : "Attendue"}
                </span>
              </div>

              <ul className="mt-2 flex flex-col gap-0.5">
                {l.lignes.map((ligne) => (
                  <li key={ligne.id} className="text-[13px] text-ink-soft">
                    {ligne.produit_nom ?? "Produit"} × {ligne.quantite}
                  </li>
                ))}
              </ul>

              {l.statut === "attendue" && (
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => marquerRecue(l)}
                    className="btn-secondary text-[13px] py-2 px-3 flex items-center gap-1.5"
                  >
                    <PackageCheck size={15} /> Marquer reçue
                  </button>
                  <button onClick={() => handleDelete(l.id)} className="text-[12px] text-ink-faint ml-auto">
                    Supprimer
                  </button>
                </div>
              )}
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
              className="bg-white rounded-t-card md:rounded-card p-5 w-full md:max-w-md max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-medium text-ink">Nouvelle livraison</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <select value={fournisseurId} onChange={(e) => setFournisseurId(e.target.value)} className="input-field">
                  <option value="">Fournisseur (optionnel)</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
                <input type="date" value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} className="input-field" />

                <p className="text-[13px] font-medium text-ink-soft mt-1">Articles</p>
                {lignes.map((ligne, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={ligne.produit_id}
                      onChange={(e) => updateLigne(i, { produit_id: e.target.value })}
                      className="input-field flex-[2]"
                    >
                      <option value="">Produit</option>
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(i, { quantite: e.target.value })}
                      placeholder="Qté"
                      className="input-field flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      value={ligne.prix_achat_unitaire}
                      onChange={(e) => updateLigne(i, { prix_achat_unitaire: e.target.value })}
                      placeholder="Prix"
                      className="input-field flex-1"
                    />
                    {lignes.length > 1 && (
                      <button type="button" onClick={() => removeLigne(i)} className="text-danger shrink-0">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addLigne} className="text-[13px] text-accent font-medium text-left">
                  + Ajouter un article
                </button>

                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optionnel)" rows={2} className="input-field" />

                {error && <p className="text-[13px] text-danger">{error}</p>}

                <button type="submit" className="btn-primary mt-1">Enregistrer la livraison</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
