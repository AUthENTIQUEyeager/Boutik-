"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Client } from "@/types/database";

export default function ClientsPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("shop_id", userId)
      .order("nom", { ascending: true });
    setClients((data as Client[]) ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nom.trim()) return;

    const payload = {
      shop_id: userId,
      nom: nom.trim(),
      telephone: telephone.trim() || null,
      notes: notes.trim() || null,
      created_at: new Date().toISOString(),
    };
    const id = await writeLocal("clients", "insert", payload);
    setClients((prev) => [...prev, { ...payload, id } as Client].sort((a, b) => a.nom.localeCompare(b.nom)));
    setNom("");
    setTelephone("");
    setNotes("");
    setShowForm(false);
    flushSyncQueue();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    await writeLocal("clients", "delete", { id }, id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    flushSyncQueue();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Clients</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : clients.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucun client pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {clients.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="card p-4 flex items-center justify-between"
            >
              <Link href={`/clients/${c.id}`} className="flex-1">
                <p className="text-[15px] font-medium text-ink">{c.nom}</p>
                {c.telephone && <p className="text-[13px] text-ink-faint mt-0.5">{c.telephone}</p>}
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(c.id)} className="text-ink-faint text-[12px] px-2">
                  Supprimer
                </button>
                <Link href={`/clients/${c.id}`}>
                  <ChevronRight size={18} className="text-ink-faint" />
                </Link>
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
                <h2 className="text-[16px] font-medium text-ink">Nouveau client</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <input
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom du client"
                  className="input-field"
                />
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Téléphone (optionnel)"
                  className="input-field"
                />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optionnel)"
                  className="input-field"
                  rows={2}
                />
                <button type="submit" className="btn-primary mt-1">
                  Enregistrer
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
