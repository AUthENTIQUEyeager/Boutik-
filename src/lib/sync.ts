import { createClient } from "@/lib/supabase/client";
import { db, type SyncQueueItem } from "@/lib/dexie";

export type SyncStatus = "offline" | "online" | "syncing";

type Listener = (status: SyncStatus) => void;
const listeners = new Set<Listener>();

function notify(status: SyncStatus) {
  listeners.forEach((l) => l(status));
}

export function onSyncStatusChange(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let syncing = false;

/**
 * Vide la file de synchronisation vers Supabase, dans l'ordre chronologique.
 * Stratégie de conflit : dernière écriture gagne (upsert simple).
 */
export async function flushSyncQueue() {
  if (!db || syncing || typeof navigator === "undefined" || !navigator.onLine) return;
  syncing = true;
  notify("syncing");

  const supabase = createClient();

  try {
    const pending: SyncQueueItem[] = await db.sync_queue
      .filter((item) => !item.synced)
      .sortBy("created_at");

    for (const item of pending) {
      try {
        if (item.operation === "delete") {
          await supabase.from(item.table).delete().eq("id", item.local_id);
        } else {
          // upsert : couvre insert et update, "dernière écriture gagne"
          await supabase.from(item.table).upsert(item.payload, { onConflict: "id" });
        }
        if (item.id !== undefined) {
          await db.sync_queue.update(item.id, { synced: true });
        }
      } catch (err) {
        // On garde l'item en file pour réessayer plus tard ; on continue
        // avec les suivants pour ne pas bloquer toute la synchronisation.
        console.error("Erreur de synchronisation pour", item.table, err);
      }
    }

    // Nettoyage des items déjà synchronisés
    await db.sync_queue.filter((item) => item.synced).delete();

    notify(navigator.onLine ? "online" : "offline");
  } finally {
    syncing = false;
  }
}

export function initSyncListeners() {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    notify("online");
    flushSyncQueue();
  };
  const handleOffline = () => notify("offline");

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Tentative de synchronisation initiale + toutes les 30s si en ligne
  flushSyncQueue();
  const interval = setInterval(() => {
    if (navigator.onLine) flushSyncQueue();
  }, 30000);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(interval);
  };
}
