"use client";

import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  IllustrationCahier,
  IllustrationDettes,
  IllustrationCalcul,
  IllustrationAssistant,
  IllustrationBoutikPlus,
} from "./OnboardingIllustrations";

const slides = [
  {
    Illustration: IllustrationCahier,
    title: "Tu gères encore ton stock sur un cahier ?",
    text: "Les pages se perdent, les écritures s'effacent. Ton stock mérite mieux.",
  },
  {
    Illustration: IllustrationDettes,
    title: "Tu perds la trace de qui te doit de l'argent ?",
    text: "Chaque dette, chaque client, retrouvés en un instant.",
  },
  {
    Illustration: IllustrationCalcul,
    title: "Tu calcules tes bénéfices à la main chaque soir ?",
    text: "Boutik+ calcule automatiquement ton bénéfice à chaque vente.",
  },
  {
    Illustration: IllustrationAssistant,
    title: "Une question ? Demande à l'assistant.",
    text: "Bénéfices, stock, dettes : pose ta question, l'assistant IA de Boutik+ te répond en français.",
  },
  {
    Illustration: IllustrationBoutikPlus,
    title: "Boutik+, la boutique organisée",
    text: "Clients, ventes, stock, dépenses et dettes : tout au même endroit.",
    final: true,
  },
];

const transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

export default function OnboardingCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();

  function goTo(newIndex: number) {
    if (newIndex < 0 || newIndex >= slides.length) return;
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -80) goTo(index + 1);
    else if (info.offset.x > 80) goTo(index - 1);
  }

  const slide = slides[index];
  const { Illustration } = slide;
  const isFirst = index === 0;

  return (
    <div className="min-h-screen flex flex-col bg-surfacealt overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction > 0 ? 60 : -60, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction > 0 ? -60 : 60, opacity: 0, scale: 0.98 }}
            transition={transition}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.05 }}
              className="w-52 h-52 mb-8"
            >
              <Illustration />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.1 }}
              className="text-[22px] font-medium text-ink max-w-xs mb-3"
            >
              {slide.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: 0.15 }}
              className="text-[14px] text-ink-soft max-w-xs"
            >
              {slide.text}
            </motion.p>

            {slide.final && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.2 }}
                className="mt-8 flex flex-col gap-3 w-full max-w-xs"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/register")}
                  className="btn-primary"
                >
                  Créer mon compte
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className="text-[14px] text-ink-soft py-2"
                >
                  J&apos;ai déjà un compte
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Aller à l'écran ${i + 1}`}
            className="relative h-2 w-6"
          >
            <span className="absolute inset-0 rounded-full bg-ink-faint/20" />
            {i === index && (
              <motion.span
                layoutId="onboarding-dot"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Navigation précédent / suivant */}
      <div className="flex items-center justify-between px-6 pb-10">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => goTo(index - 1)}
          disabled={isFirst}
          className={`flex items-center gap-1.5 text-[14px] font-medium py-2 px-3 rounded-xl transition-opacity ${
            isFirst ? "opacity-0 pointer-events-none" : "text-ink-soft"
          }`}
        >
          <ArrowLeft size={17} /> Précédent
        </motion.button>

        {!slide.final && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => goTo(index + 1)}
            className="flex items-center gap-1.5 text-[14px] font-medium py-2 px-4 rounded-xl bg-accent-light text-accent"
          >
            Suivant <ArrowRight size={17} />
          </motion.button>
        )}
        {slide.final && <span className="w-[88px]" />}
      </div>
    </div>
  );
}
