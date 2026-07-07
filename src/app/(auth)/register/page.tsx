"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function phoneToEmail(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  return `${cleaned}@boutikplus.local`;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 8) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: phoneToEmail(cleanedPhone),
      password,
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("already been registered")) {
        setError("Ce numéro est déjà utilisé. Essaie de te connecter.");
      } else {
        setError("Une erreur est survenue. Réessaie.");
      }
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Une erreur est survenue. Réessaie.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      phone: cleanedPhone,
      shop_name: shopName,
      role: "commercant",
      status: "actif",
    });

    setLoading(false);

    if (profileError) {
      setError("Ce numéro est déjà utilisé. Essaie de te connecter.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-surfacealt">
      <div className="max-w-sm w-full mx-auto">
        <h1 className="text-[22px] font-medium text-ink mb-1">Créer mon compte</h1>
        <p className="text-[14px] text-ink-soft mb-8">
          3000 FCFA par mois. Aucune carte bancaire nécessaire.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[13px] text-ink-soft mb-1 block">Nom de la boutique</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Boutique Awa"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-[13px] text-ink-soft mb-1 block">Numéro de téléphone</label>
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

          <div>
            <label className="text-[13px] text-ink-soft mb-1 block">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
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

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-[14px] text-ink-soft text-center mt-6">
          Déjà un compte ?{" "}
          <a href="/login" className="text-accent font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
