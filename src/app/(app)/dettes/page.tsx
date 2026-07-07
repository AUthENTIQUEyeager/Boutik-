"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { writeLocal } from "@/lib/dexie";
import { flushSyncQueue } from "@/lib/sync";
import { useUserId } from "@/lib/useUser";
import type { Dette, Client } from "@/types/database";

interface DetteRow extends Dette {
  client_nom?: string;
  client_telephone?: string | null;
}

function buildWhatsappLink(phone: string | null | undefined, nom: string, montantRestant: number) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Bonjour ${nom}, ceci est un rappel amical : il vous reste ${Math.round(
      montantRestant
    ).toLocaleString("fr-FR")} FCFA à régler. Merci de votre confiance !`
  );
  return `https://wa.me/${cleaned}?text=${message}`;
}

export default function DettesPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [dettes, setDettes] = useState<DetteRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [montantPaiement, setMontantPaiement] = useState("");

  const [clientId, setClientId] = useState("");
  const [montant, setMontant] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const [dettesRes, clientsRes] = await Promise.all([
      supabase
        .from("dettes")
        .select("*, clients(nom, telephone)")
        .eq("shop_id", userId)
        .order("date_echeance", { ascending: true }),
      supabase.from("clients").select("*").eq("shop_id", userId).order("nom"),
    ]);

    const rows =
      (dettesRes.data as (Dette & { clients: { nom: string; telephone: string | null } | null })[]) ?? [];
    setDettes(
      rows.map((d) => ({ ...d, client_nom: d.clients?.nom, client_telephone: d.clients?.telephone }))
    );
    setClients((clientsRes.data as Client[]) ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !clientId || !montant) return;

    const payload = {
      shop_id: userId,
      client_id: clientId,
      montant: Number(montant),
      montant_paye: 0,
      statut: "en_cours" as const,
      date_echeance: dateEcheance || null,
      created_at: new Date().toISOString(),
    };
    const id = await writeLocal("dettes", "insert", payload);
    setDettes((prev) => [
      { ...payload, id, client_nom: clients.find((c) => c.id === clientId)?.nom } as DetteRow,
      ...prev,
    ]);
    setClientId("");
    setMontant("");
    setDateEcheance("");
    setShowForm(false);
    flushSyncQueue();
  }

  async function handlePayment(dette: DetteRow, montantAjoute: number) {
    const nouveauPaye = Math.min(dette.montant, dette.montant_paye + montantAjoute);
    const statut = nouveauPaye >= dette.montant ? "soldee" : "en_cours";

    await writeLocal(
      "dettes",
      "update",
      { id: dette.id, shop_id: dette.shop_id, client_id: dette.client_id, montant: dette.montant, montant_paye: nouveauPaye, statut, date_echeance: dette.date_echeance, created_at: dette.created_at },
      dette.id
    );

    setDettes((prev) =>
      prev.map((d) => (d.id === dette.id ? { ...d, montant_paye: nouveauPaye, statut } : d))
    );
    setPayingId(null);
    setMontantPaiement("");
    flushSyncQueue();
  }

  const enRetard = (d: DetteRow) =>
    d.statut === "en_cours" && d.date_echeance && new Date(d.date_echeance) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Dettes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : dettes.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucune dette pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {dettes.map((d, i) => {
            const restant = d.montant - d.montant_paye;
            const link = buildWhatsappLink(d.client_telephone, d.client_nom ?? "cher client", restant);
            const late = enRetard(d);
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-ink">{d.client_nom ?? "Client"}</p>
                    <p className="text-[13px] text-ink-faint mt-0.5">
                      {Math.round(d.montant_paye).toLocaleString("fr-FR")} /{" "}
                      {Math.round(d.montant).toLocaleString("fr-FR")} FCFA payés
                    </p>
                    {d.date_echeance && (
                      <p className={`text-[12px] mt-0.5 ${late ? "text-danger" : "text-ink-faint"}`}>
                        Échéance : {new Date(d.date_echeance).toLocaleDateString("fr-FR")}
                        {late ? " (en retard)" : ""}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[12px] px-2 py-1 rounded-full whitespace-nowrap ${
                      d.statut === "soldee" ? "bg-accent-light text-accent" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {d.statut === "soldee" ? "Soldée" : "En cours"}
                  </span>
                </div>

                {d.statut === "en_cours" && (
                  <div className="flex items-center gap-2 mt-3">
                    {payingId === d.id ? (
                      <>
                        <input
                          type="number"
                          min="1"
                          max={restant}
                          autoFocus
                          value={montantPaiement}
                          onChange={(e) => setMontantPaiement(e.target.value)}
                          placeholder="Montant reçu"
                          className="input-field py-2 flex-1"
                        />
                        <button
                          onClick={() => handlePayment(d, Number(montantPaiement) || 0)}
                          className="btn-primary py-2 px-3"
                        >
                          OK
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setPayingId(d.id)} className="btn-secondary text-[13px] py-2 px-3">
                          Enregistrer un paiement
                        </button>
                        <button
                          onClick={() => handlePayment(d, restant)}
                          className="text-[13px] text-accent font-medium py-2 px-3"
                        >
                          Marquer soldée
                        </button>
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto flex items-center gap-1 text-[13px] text-accent"
                          >
                            <MessageCircle size={16} /> Rappel
                          </a>
                        )}
                      </>
                    )}
                  </div>
                )}
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
                <h2 className="text-[16px] font-medium text-ink">Nouvelle dette</h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="flex flex-col gap-3">
                <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-field">
                  <option value="" disabled>Choisir un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  min="1"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Montant dû (FCFA)"
                  className="input-field"
                />
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
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
