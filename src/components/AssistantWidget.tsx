"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * Bulle flottante visible sur tout l'espace commerçant. Un tap ouvre la page
 * plein écran /assistant (voir src/app/(app)/assistant/page.tsx).
 */
export default function AssistantWidget() {
  return (
    <Link href="/assistant" aria-label="Ouvrir l'assistant Boutik+">
      <motion.div
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full bg-accent text-white shadow-card flex items-center justify-center"
      >
        <Sparkles size={22} />
      </motion.div>
    </Link>
  );
}
