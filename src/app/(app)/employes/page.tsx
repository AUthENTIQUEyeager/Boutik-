"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUserId } from "@/lib/useUser";
import type { Employe, EmployeRole } from "@/types/database";

const ROLES: { value: EmployeRole; label: string }[] = [
  { value: "vendeur", label: "Vendeur" },
  { value: "gerant", label: "Gérant" },
  { value: "livreur", label: "Livreur" },
  { value: "autre", label: "Autre" },
];

export default function EmployesPage() {
  const userId = useUserId();
  const supabase = createClient();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employe | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<EmployeRole>("vendeur");
  const [salaire, setSalaire] = useState("");
  const [dateEmbauche, setDateEmbauche] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employes")
      .select("*")
      .eq("shop_id", userId)
      .order("actif", { ascending: false })
      .order("nom", { ascending: true });
    setEmployes((data as Employe[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setNom("");
    setTelephone("");
    setRole("vendeur");
    setSalaire("");
    setDateEmbauche("");
    setShowForm(true);
  }

  function openEdit(emp: Employe) {
    setEditing(emp);
    setNom(emp.nom);
    setTelephone(emp.telephone ?? "");
    setRole(emp.role);
    setSalaire(emp.salaire ? String(emp.salaire) : "");
    setDateEmbauche(emp.date_embauche ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !nom.trim()) return;

    const payload = {
      shop_id: userId,
      nom: nom.trim(),
      telephone: telephone.trim() || null,
      role,
      salaire: salaire ? Number(salaire) : null,
      date_embauche: dateEmbauche || null,
    };

    if (editing) {
      const { error } = await supabase.from("employes").update(payload).eq("id", editing.id);
      if (!error) {
        setEmployes((prev) => prev.map((emp) => (emp.id === editing.id ? { ...emp, ...payload } : emp)));
      }
    } else {
      const { data, error } = await supabase
        .from("employes")
        .insert({ ...payload, actif: true })
        .select()
        .single();
      if (!error && data) setEmployes((prev) => [data as Employe, ...prev]);
    }

    setShowForm(false);
  }

  async function toggleActif(emp: Employe) {
    const { error } = await supabase.from("employes").update({ actif: !emp.actif }).eq("id", emp.id);
    if (!error) {
      setEmployes((prev) => prev.map((e) => (e.id === emp.id ? { ...e, actif: !e.actif } : e)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet employé ?")) return;
    const { error } = await supabase.from("employes").delete().eq("id", id);
    if (!error) setEmployes((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      <Link href="/plus" className="md:hidden flex items-center gap-1 text-ink-soft text-[14px] mb-4">
        <ArrowLeft size={18} /> Retour
      </Link>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-medium text-ink">Employés</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5 px-3 py-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : employes.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-[14px] text-ink-soft">Aucun employé pour le moment.</p>
        </div>
      ) : (
        <motion.ul className="flex flex-col gap-2">
          {employes.map((emp, i) => (
            <motion.li
              key={emp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between">
                <div onClick={() => openEdit(emp)} className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-[15px] font-medium ${emp.actif ? "text-ink" : "text-ink-faint line-through"}`}>
                      {emp.nom}
                    </p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surfacealt text-ink-soft">
                      {ROLES.find((r) => r.value === emp.role)?.label}
                    </span>
                  </div>
                  {emp.telephone && <p className="text-[13px] text-ink-faint mt-0.5">{emp.telephone}</p>}
                  {emp.salaire && (
                    <p className="text-[13px] text-ink-faint mt-0.5">
                      {Math.round(emp.salaire).toLocaleString("fr-FR")} FCFA / mois
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => toggleActif(emp)} className="text-[12px] text-accent font-medium">
                    {emp.actif ? "Désactiver" : "Réactiver"}
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="text-[11px] text-ink-faint">
                    Supprimer
                  </button>
                </div>
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
                <h2 className="text-[16px] font-medium text-ink">
                  {editing ? "Modifier l'employé" : "Nouvel employé"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X size={20} className="text-ink-faint" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de l'employé" className="input-field" />
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="input-field" />
                <select value={role} onChange={(e) => setRole(e.target.value as EmployeRole)} className="input-field">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <input type="number" min="0" value={salaire} onChange={(e) => setSalaire(e.target.value)} placeholder="Salaire mensuel (optionnel)" className="input-field" />
                <input type="date" value={dateEmbauche} onChange={(e) => setDateEmbauche(e.target.value)} className="input-field" />
                <button type="submit" className="btn-primary mt-1">Enregistrer</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
