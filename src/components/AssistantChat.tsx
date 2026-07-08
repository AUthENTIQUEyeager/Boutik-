"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Quel est mon bénéfice du mois ?",
  "Ai-je des produits en rupture ?",
  "Combien j'ai de dettes en cours ?",
];

/**
 * Logique + interface du chat, réutilisée par la page plein écran /assistant.
 * Ne contient aucune notion de "fenêtre" — c'est au composant parent de décider
 * comment l'afficher (plein écran, panneau, etc.).
 */
export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ used: number; limit: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <div className="flex flex-col h-full">
      {credits && (
        <p className="text-[11px] text-ink-faint text-center py-2 shrink-0">
          {credits.used}/{credits.limit} questions ce mois-ci
        </p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="h-14 w-14 rounded-full bg-accent-light flex items-center justify-center">
                <Sparkles size={26} className="text-accent" />
              </div>
              <p className="text-[14px] text-ink-soft max-w-xs">
                Pose-moi une question sur ta boutique : ventes, stock, dépenses ou dettes.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(s)}
                  className="text-left text-[13px] text-accent bg-accent-light rounded-xl px-4 py-3"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`max-w-[85%] text-[14px] leading-relaxed px-4 py-2.5 rounded-2xl ${
              m.role === "user"
                ? "self-end bg-accent text-white rounded-br-sm"
                : "self-start bg-surfacealt text-ink rounded-bl-sm"
            }`}
          >
            {m.text}
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="self-start flex items-center gap-2 text-ink-faint text-[13px] px-4 py-2.5"
          >
            <Loader2 size={14} className="animate-spin" /> Réflexion…
          </motion.div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-danger px-1">
            {error}
          </motion.p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-black/[0.06] flex items-center gap-2 shrink-0 max-w-2xl w-full mx-auto"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={quotaAtteint ? "Quota atteint pour ce mois-ci" : "Écris ta question…"}
          disabled={loading || quotaAtteint}
          className="input-field py-3 text-[14px] flex-1 disabled:opacity-50"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={loading || quotaAtteint || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send size={17} />
        </motion.button>
      </form>
    </div>
  );
}
