"use client";

import { useState } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { NotebookPen, Users, Calculator, Sparkles } from "lucide-react";

const slides = [
  {
    icon: NotebookPen,
    title: "Tu gères encore ton stock sur un cahier ?",
    text: "Les pages se perdent, les écritures s'effacent. Ton stock mérite mieux.",
  },
  {
    icon: Users,
    title: "Tu perds la trace de qui te doit de l'argent ?",
    text: "Chaque dette, chaque client, retrouvés en un instant.",
  },
  {
    icon: Calculator,
    title: "Tu calcules tes bénéfices à la main chaque soir ?",
    text: "Boutik+ calcule automatiquement ton bénéfice à chaque vente.",
  },
  {
    icon: Sparkles,
    title: "Boutik+, la boutique organisée",
    text: "Clients, ventes, stock, dépenses et dettes : tout au même endroit.",
    final: true,
  },
];

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
  const Icon = slide.icon;

  return (
    <div className="min-h-screen flex flex-col bg-surfacealt">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction > 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-accent-light flex items-center justify-center mb-8">
              <Icon size={36} className="text-accent" strokeWidth={1.8} />
            </div>
            <h1 className="text-[22px] font-medium text-ink max-w-xs mb-3">{slide.title}</h1>
            <p className="text-[14px] text-ink-soft max-w-xs">{slide.text}</p>

            {slide.final && (
              <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => router.push("/register")} className="btn-primary">
                  Créer mon compte
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="text-[14px] text-ink-soft py-2"
                >
                  J&apos;ai déjà un compte
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 pb-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Aller à l'écran ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-accent" : "w-2 bg-ink-faint/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
