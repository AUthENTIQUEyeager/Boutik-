"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <>
      <button onClick={markAllRead} className="relative text-ink-soft" aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-ink/20 flex items-start justify-center px-4 pt-16"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="card p-2 w-full max-w-sm max-h-[70vh] overflow-y-auto"
            >
              <p className="text-[13px] font-medium text-ink px-3 py-2">Notifications</p>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
