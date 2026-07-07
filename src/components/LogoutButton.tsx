"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      <button onClick={() => setConfirming(true)} className="text-[13px] text-ink-soft">
        Se déconnecter
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6"
            onClick={() => !loading && setConfirming(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-card p-5 max-w-xs w-full text-center"
            >
              <h2 className="text-[16px] font-medium text-ink mb-2">Se déconnecter ?</h2>
              <p className="text-[13px] text-ink-soft mb-5">
                Tu devras te reconnecter avec ton numéro et ton mot de passe.
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-danger text-white font-medium rounded-2xl px-4 py-3 disabled:opacity-60"
                >
                  {loading ? "…" : "Déconnexion"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
