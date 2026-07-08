"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Quel est mon bénéfice du mois ?",
  "Ai-je des produits en rupture ?",
  "Combien j'ai de dettes en cours ?",
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ used: number; limit: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        if (typeof data.creditsUsed === "number") {
          setCredits({ used: data.creditsUsed, limit: data.creditsLimit });
        }
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      setCredits({ used: data.creditsUsed, limit: data.creditsLimit });
    } catch {
      setError("Impossible de contacter l'assistant. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const quotaAtteint = credits ? credits.used >= credits.limit : false;

  return (
    <>
      {/* Bulle flottante */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full bg-accent text-white shadow-card flex items-center justify-center"
        aria-label="Assistant Boutik+"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panneau de discussion */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-40 bottom-36 md:bottom-24 right-4 md:right-6 left-4 md:left-auto md:w-96 max-h-[70vh] card p-0 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-black/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center">
                  <Sparkles size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink">Assistant Boutik+</p>
                  {credits && (
                    <p className="text-[11px] text-ink-faint">
                      {credits.used}/{credits.limit} questions ce mois-ci
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-faint">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-[220px]">
              {messages.length === 0 && (
                <div>
                  <p className="text-[13px] text-ink-soft mb-3">
                    Pose-moi une question sur ta boutique : ventes, stock, dépenses ou dettes.
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-[13px] text-accent bg-accent-light rounded-xl px-3 py-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`max-w-[85%] text-[13px] leading-relaxed px-3 py-2 rounded-2xl ${
                    m.role === "user"
                      ? "self-end bg-accent text-white rounded-br-sm"
                      : "self-start bg-surfacealt text-ink rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </motion.div>
              ))}

              {loading && (
                <div className="self-start flex items-center gap-2 text-ink-faint text-[13px] px-3 py-2">
                  <Loader2 size={14} className="animate-spin" /> Réflexion…
                </div>
              )}

              {error && <p className="text-[12px] text-danger px-1">{error}</p>}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-black/[0.06] flex items-center gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={quotaAtteint ? "Quota atteint pour ce mois-ci" : "Écris ta question…"}
                disabled={loading || quotaAtteint}
                className="input-field py-2.5 text-[13px] flex-1 disabled:opacity-50"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={loading || quotaAtteint || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40"
                aria-label="Envoyer"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
