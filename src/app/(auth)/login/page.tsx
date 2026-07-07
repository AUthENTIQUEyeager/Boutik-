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

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-surfacealt">
      <div className="max-w-sm w-full mx-auto">
        <h1 className="text-[22px] font-medium text-ink mb-1">Connexion</h1>
        <p className="text-[14px] text-ink-soft mb-8">Content de te revoir sur Boutik+.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-[14px] text-ink-soft text-center mt-6">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-accent font-medium">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}
