"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Depense } from "@/types/database";
import MetricCard from "@/components/MetricCard";

const CATEGORIES = ["Transport", "Electricité", "Loyer", "Nettoyage", "Fournitures", "Autre"];

export default function DepensesPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("depenses")
      .select("*")
      .eq("shop_id", userId)
      .order("created_at", { ascending: false });
    setDepenses((data as Depense[]) ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !montant) return;

    const payload = {
      shop_id: userId,
      montant: Number(montant),
      categorie,
      description: description.trim() || null,
      created_at: new Date().toISOString(),
    };
    const id = await writeLocal("depenses", "insert", payload);
    setDepenses((prev) => [{ ...payload, id } as Depense, ...prev]);
    setMontant("");
    setDescription("");
    setShowForm(false);
    flushSyncQueue();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette dépense ?")) return;
    await writeLocal("depenses", "delete", { id }, id);
    setDepenses((prev) => prev.filter((d) => d.id !== id));
    flushSyncQueue();
  }

  const now = new Date();
  const totalMois = depenses
    .filter((d) => {
      const date = new Date(d.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + Number(d.montant), 0);

  return (
    <div>
      <Link href="/plus" className="md:hidden flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Dépenses</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="mb-5 max-w-[200px]">
        <MetricCard label="Total ce mois-ci" value={`${Math.round(totalMois).toLocaleString("fr-FR")} FCFA`} />
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : depenses.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucune dépense pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {depenses.map((d, i) => (
            <motion.li
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
              className="card p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">{d.categorie}</p>
                {d.description && <p className="text-[13px] text-ink-faint mt-0.5">{d.description}</p>}
                <p className="text-[12px] text-ink-faint mt-0.5">
                  {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[15px] font-medium text-ink">
                  {Math.round(d.montant).toLocaleString("fr-FR")} FCFA
                </p>
                <button onClick={() => handleDelete(d.id)} className="text-[11px] text-ink-faint">
                  Supprimer
                </button>
              </div>
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
                <h2 className="text-[16px] font-medium text-ink">Nouvelle dépense</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  required
                  type="number"
                  min="0"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Montant (FCFA)"
                  className="input-field"
                />
                <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="input-field">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  rows={2}
                  className="input-field"
                />
                <button type="submit" className="btn-primary mt-1">Enregistrer</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
