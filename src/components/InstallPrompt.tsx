"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream);

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || (!deferredPrompt && !isIOS)) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40">
      <div className="card p-4 flex items-start gap-3">
        <div className="flex-1">
          {isIOS ? (
            <>
              <p className="text-[14px] font-medium text-ink mb-1">Installer Boutik+</p>
              <p className="text-[13px] text-ink-soft flex items-center gap-1 flex-wrap">
                Appuie sur <Share size={14} className="inline" /> Partager, puis « Sur l&apos;écran
                d&apos;accueil ».
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-ink mb-2">Installer l&apos;app Boutik+</p>
              <button onClick={handleInstall} className="btn-primary text-[13px] py-2 px-3">
                Installer l&apos;app
              </button>
            </>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-ink-faint" aria-label="Plus tard">
          <X size={18} />
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="w-full text-center text-[12px] text-ink-faint mt-2"
      >
        Plus tard
      </button>
    </div>
  );
}
