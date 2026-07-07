"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface ShopRow extends Profile {
  user_count: number;
}

export default function AdminPage() {
  const supabase = createClient();
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "commercant")
      .order("created_at", { ascending: false });
    // Chaque boutique = un seul compte utilisateur commerçant dans ce MVP
    setShops(((data as Profile[]) ?? []).map((p) => ({ ...p, user_count: 1 })));
    setLoading(false);
  }

  async function toggleStatus(shop: ShopRow) {
    const newStatus = shop.status === "actif" ? "bloque" : "actif";
    const res = await fetch("/api/admin/toggle-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: shop.id, status: newStatus }),
    });
    if (res.ok) {
      setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, status: newStatus } : s)));
    }
  }

  return (
    <div>
      <h1 className="text-[20px] font-medium text-ink mb-5">Boutiques</h1>

      {loading ? (
        <p className="text-ink-faint text-[14px]">Chargement…</p>
      ) : shops.length === 0 ? (
        <p className="text-ink-faint text-[14px]">Aucune boutique inscrite.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[12px] text-ink-faint border-b border-black/[0.06]">
                <th className="px-4 py-3 font-normal">Boutique</th>
                <th className="px-4 py-3 font-normal">Téléphone</th>
                <th className="px-4 py-3 font-normal">Statut</th>
                <th className="px-4 py-3 font-normal">Abonnement expire</th>
                <th className="px-4 py-3 font-normal">Utilisateurs actifs</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-b border-black/[0.04] last:border-0 text-[14px]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/${s.id}`} className="text-ink hover:text-accent">
                      {s.shop_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{s.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[12px] px-2 py-1 rounded-full ${
                        s.status === "actif" ? "bg-accent-light text-accent" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {s.status === "actif" ? "Actif" : "Bloqué"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(s.subscription_expires_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{s.user_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(s)}
                      className={`text-[13px] font-medium ${
                        s.status === "actif" ? "text-danger" : "text-accent"
                      }`}
                    >
                      {s.status === "actif" ? "Bloquer" : "Débloquer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
