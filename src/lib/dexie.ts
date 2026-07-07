import Dexie, { type Table } from "dexie";

export type SyncOperation = "insert" | "update" | "delete";
export type SyncTable = "clients" | "produits" | "ventes" | "depenses" | "dettes";

export interface SyncQueueItem {
  id?: number;
  table: SyncTable;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  local_id: string; // uuid généré côté client, réutilisé côté serveur
  created_at: number;
  synced: boolean;
}

// Tables locales "miroir" pour permettre un affichage instantané hors-ligne
export interface LocalRecord {
  id: string; // uuid local (= id serveur une fois synchronisé)
  shop_id: string;
  data: Record<string, unknown>;
  updated_at: number;
  pending_delete?: boolean;
}

class BoutikDB extends Dexie {
  sync_queue!: Table<SyncQueueItem, number>;
  clients!: Table<LocalRecord, string>;
  produits!: Table<LocalRecord, string>;
  ventes!: Table<LocalRecord, string>;
  depenses!: Table<LocalRecord, string>;
  dettes!: Table<LocalRecord, string>;

  constructor() {
    super("boutik_plus_db");
    this.version(1).stores({
      sync_queue: "++id, table, synced, created_at",
      clients: "id, shop_id, updated_at",
      produits: "id, shop_id, updated_at",
      ventes: "id, shop_id, updated_at",
      depenses: "id, shop_id, updated_at",
      dettes: "id, shop_id, updated_at",
    });
  }
}

export const db = typeof window !== "undefined" ? new BoutikDB() : (null as unknown as BoutikDB);

function uuid() {
  return crypto.randomUUID();
}

/**
 * Écrit un enregistrement en local (Dexie) ET l'ajoute à la file de
 * synchronisation. À utiliser pour toute création/modification depuis les
 * écrans de l'app (ventes, clients, produits, dépenses, dettes).
 */
export async function writeLocal(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  existingId?: string
) {
  const id = existingId ?? (payload.id as string) ?? uuid();
  const record: LocalRecord = {
    id,
    shop_id: payload.shop_id as string,
    data: { ...payload, id },
    updated_at: Date.now(),
    pending_delete: operation === "delete",
  };

  if (operation === "delete") {
    await db.table<LocalRecord, string>(table).delete(id);
  } else {
    await db.table<LocalRecord, string>(table).put(record);
  }

  await db.sync_queue.add({
    table,
    operation,
    payload: { ...payload, id },
    local_id: id,
    created_at: Date.now(),
    synced: false,
  });

  return id;
}

export async function getPendingSyncCount() {
  if (!db) return 0;
  return db.sync_queue.filter((item) => !item.synced).count();
}
