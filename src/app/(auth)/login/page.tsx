"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function phoneToEmail(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  return `${cleaned}@boutikplus.local`;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: benefits, 1: phone, 2: password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Numéro ou mot de passe incorrect.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.role === "superadmin" ? "/admin" : "/dashboard");
  }

  const goNext = () => setStep((s) => Math.min(s + 1, 2));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-surfacealt">
      <div className="max-w-sm w-full mx-auto">
        <h1 className="text-[22px] font-medium text-ink mb-4">
          Connexion à Boutik+
        </h1>

        {/* Step indicator (dots) */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                step === i
                  ? "bg-primary-600"
                  : "bg-primary-200"
              }`}
            />
          ))}
        </div>

        {/* Swipe container (we simulate with step-based animation) */}
        <div className="relative">
          {/* Step 0: Benefits */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Gestion complète des clients</h3>
                    <p className="text-sm text-ink-soft">
                      Enregistrez, suivez et communiquez avec vos clients en quelques taps.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Suivi automatisé des dettes</h3>
                    <p className="text-sm text-ink-soft">
                      Relances programmées, historique clair et prévision de trésorerie.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Assistant IA intégré</h3>
                    <p className="text-sm text-ink-soft">
                      Obtenez des insights instantanés sur vos ventes, stock et bénéfices.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <button onClick={goNext} className="btn-primary w-full">
                  Commencer
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Phone input */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[13px] text-ink-soft mb-1 block">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="70 00 00 00"
                  className="input-field"
                />
              </div>
              <div className="flex items-start space-x-3">
                <p className="text-sm text-ink-soft">
                  Entrez votre numéro pour recevoir le code de connexion.
                </p>
              </div>
              <div className="flex justify-end">
                <button onClick={goPrev} className="mr-2 btn-outline">
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="btn-primary"
                >
                  {loading ? "Connexion…" : "Suivant"}
                </button>
              </div>
              {error && <p className="text-[13px] text-danger mt-2">{error}</p>}
            </form>
          )}

          {/* Step 2: Password input */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[13px] text-ink-soft mb-1 block">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <p className="text-sm text-ink-soft">
                  Votre mot de passe doit contenir au moins 6 caractères.
                </p>
              </div>
              <div className="flex justify-end">
                <button onClick={goPrev} className="mr-2 btn-outline">
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="btn-primary"
                >
                  {loading ? "Connexion…" : "Se connecter"}
                </button>
              </div>
              {error && <p className="text-[13px] text-danger mt-2">{error}</p>}
            </form>
          )}
        </div>

        <p className="text-[14px] text-ink-soft text-center mt-8">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-accent font-medium">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}