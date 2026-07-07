"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CONTACT_PHONE = "70 00 00 00";

export default function BlockedGuard({ userId }: { userId: string }) {
  const [blocked, setBlocked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .single();
      if (!cancelled && data?.status === "bloque") {
        setBlocked(true);
      }
    }

    check();
    const interval = setInterval(check, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!blocked) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-6">
      <div className="bg-white rounded-card p-6 max-w-sm w-full text-center">
        <h2 className="text-[18px] font-medium text-ink mb-2">Compte suspendu</h2>
        <p className="text-[14px] text-ink-soft mb-6">
          Votre compte a été suspendu. Contactez-nous au {CONTACT_PHONE} pour régulariser votre
          situation.
        </p>
        <button onClick={handleLogout} className="btn-primary w-full">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
