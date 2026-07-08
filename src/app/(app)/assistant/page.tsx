"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import AssistantChat from "@/components/AssistantChat";

export default function AssistantPage() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
    >
      <header className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] shrink-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="text-ink-soft"
          aria-label="Retour"
        >
          <ArrowLeft size={22} />
        </motion.button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <span className="text-[15px] font-medium text-ink">Assistant Boutik+</span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AssistantChat />
      </div>
    </motion.div>
  );
}
