"use client";

import { useEffect, useState } from "react";
import { initSyncListeners, onSyncStatusChange, type SyncStatus } from "@/lib/sync";

export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>("online");

  useEffect(() => {
    setStatus(navigator.onLine ? "online" : "offline");
    const cleanupListeners = initSyncListeners();
    const unsubscribe = onSyncStatusChange(setStatus);
    return () => {
      cleanupListeners();
      unsubscribe();
    };
  }, []);

  const color =
    status === "syncing" ? "bg-amber-500" : status === "online" ? "bg-accent" : "bg-ink-faint";

  const label =
    status === "syncing" ? "Synchronisation…" : status === "online" ? "En ligne" : "Hors-ligne";

  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className={`h-2 w-2 rounded-full ${color} ${status === "syncing" ? "animate-pulse" : ""}`} />
      <span className="hidden sm:inline text-[12px] text-ink-faint">{label}</span>
    </div>
  );
}
