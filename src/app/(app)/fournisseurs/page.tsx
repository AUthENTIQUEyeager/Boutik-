"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "@/lib/useUser";
import type { Fournisseur } from "@/types/database";

export default function FournisseursPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("fournisseurs")
      .select("*")
      .eq("shop_id", userId)
      .order("nom", { ascending: true });
    setFournisseurs((data as Fournisseur[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setNom("");
    setTelephone("");
    setAdresse("");
    setNotes("");
    setShowForm(true);
  }

  function openEdit(f: Fournisseur) {
    setEditing(f);
    setNom(f.nom);
    setTelephone(f.telephone ?? "");
    setAdresse(f.adresse ?? "");
    setNotes(f.notes ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nom.trim()) return;

    const payload = {
      shop_id: userId,
      nom: nom.trim(),
      telephone: telephone.trim() || null,
      adresse: adresse.trim() || null,
      notes: notes.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("fournisseurs").update(payload).eq("id", editing.id);
      if (!error) {
        setFournisseurs((prev) =>
          prev
            .map((f) => (f.id === editing.id ? { ...f, ...payload } : f))
            .sort((a, b) => a.nom.localeCompare(b.nom))
        );
      }
    } else {
      const { data, error } = await supabase.from("fournisseurs").insert(payload).select().single();
      if (!error && data) {
        setFournisseurs((prev) => [...prev, data as Fournisseur].sort((a, b) => a.nom.localeCompare(b.nom)));
      }
    }

    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
    if (!error) setFournisseurs((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div>
      <Link href="/plus" className="md:hidden flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Fournisseurs</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : fournisseurs.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucun fournisseur pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {fournisseurs.map((f, i) => (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => openEdit(f)}
              className="card p-4 flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">{f.nom}</p>
                {f.telephone && <p className="text-[13px] text-ink-faint mt-0.5">{f.telephone}</p>}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(f.id);
                }}
                className="text-[12px] text-ink-faint"
              >
                Supprimer
              </button>
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
                <h2 className="text-[16px] font-medium text-ink">
                  {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du fournisseur" className="input-field" />
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="input-field" />
                <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse (optionnel)" className="input-field" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optionnel)" rows={2} className="input-field" />
                <button type="submit" className="btn-primary mt-1">Enregistrer</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
