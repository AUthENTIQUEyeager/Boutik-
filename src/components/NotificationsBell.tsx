"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/types/database";

export default function NotificationsBell({ shopId }: { shopId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled && data) setNotifications(data as AppNotification[]);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const unread = notifications.filter((n) => !n.lu).length;

  async function markAllRead() {
    setOpen((v) => !v);
    if (unread === 0) return;
    await supabase.from("notifications").update({ lu: true }).eq("shop_id", shopId).eq("lu", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  return (
    <div className="relative">
      <button onClick={markAllRead} className="relative text-ink-soft" aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 card p-2 max-h-80 overflow-y-auto z-30">
          {notifications.length === 0 ? (
            <p className="text-[13px] text-ink-faint p-3 text-center">Aucune notification.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-3 py-2 rounded-xl hover:bg-surfacealt">
                <p className="text-[13px] text-ink">{n.message}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
