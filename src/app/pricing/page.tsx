"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'professional' | null>(null);

  const handleSelect = (plan: 'essential' | 'professional') => {
    setSelectedPlan(plan);
    // In a real implementation, you would redirect to MoneyFusion payment link here
    // For now, we just show a message
    alert(`Vous avez sélectionné le plan ${plan === 'essential' ? 'Essential (3000 FCFA)' : 'Professional (5000 FCFA)'}. \\
La fonctionnalité de paiement sera intégrée bientôt.`);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[28px] font-bold text-ink mb-8">
          Choisissez votre plan
        </h1>
        <p className="text-[18px] text-ink-soft mb-12">
          Boutik+ propose trois niveaux de service pour répondre aux besoins de votre boutique.
        </p>

        <div className="grid gap-6 mb-12 md:grid-cols-2">
          {/* Free Tier */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <h2 className="text-[22px] font-semibold text-ink mb-4">
              Gratuit
            </h2>
            <p className="text-[16px] text-ink mb-2">
              Pour démarrer et tester l'application
            </p>
            <ul className="list-disc list-inset space-y-3 text-[15px] text-ink mb-6">
              <li>Max 10 clients</li>
              <li>Max 20 ventes/mois</li>
              <li>5 questions IA/mois</li>
              <li>Mode hors-ligne basique</li>
              <li>Pas d'export de données</li>
              <li>Pas de rapports avancés</li>
            </ul>
            <p className="text-[18px] font-bold text-success mb-4">
              0 FCFA/mois
            </p>
            <button
              onClick={() => alert("Vous êtes déjà en mode gratuit si vous ne dépassez pas les limites.")}
              className="w-full btn-secondary"
            >
              Continuer en gratuit
            </button>
          </div>

          {/* Essential Tier */}
          <div className="border rounded-lg p-6 border-primary-200">
            <h2 className="text-[22px] font-semibold text-primary mb-4">
              Essential
            </h2>
            <p className="text-[16px] text-ink mb-2">
              Pour les boutiques qui veulent plus de fonctionnalités
            </p>
            <ul className="list-disc list-inset space-y-3 text-[15px] text-ink mb-6">
              <li>Clients illimités</li>
              <li>Ventes illimitées</li>
              <li>50 questions IA/mois</li>
              <li>Export CSV des ventes et dettes</li>
              <li>Support email prioritaire</li>
              <li>Tous les modules (produits, clients, ventes, dépenses, dettes)</li>
            </ul>
            <p className="text-[18px] font-bold text-primary mb-4">
              3000 FCFA/mois
            </p>
            <button
              onClick={() => handleSelect('essential')}
              className="w-full btn-primary"
            >
              Sélectionner ce plan
            </button>
            {selectedPlan === 'essential' && (
              <p className="mt-2 text-[14px] text-success">
                Plan sélectionné ! Le paiement sera intégré bientôt.
              </p>
            )}
          </div>

          {/* Professional Tier */}
          <div className="border rounded-lg p-6 border-primary-200">
            <h2 className="text-[22px] font-semibold text-primary mb-4">
              Professional
            </h2>
            <p className="text-[16px] text-ink mb-2">
              Pour les commerçants établis qui veulent tout
            </p>
            <ul className="list-disc list-inset space-y-3 text-[15px] text-ink mb-6">
              <li>Tout le Essential +</li>
              <li>Rapports de bénéfice avancés</li>
              <li>Gestion des fournisseurs</li>
              <li>Support WhatsApp business</li>
              <li>Historique illimité</li>
              <li>Prévisions de stock basiques</li>
            </ul>
            <p className="text-[18px] font-bold text-primary mb-4">
              5000 FCFA/mois
            </p>
            <button
              onClick={() => handleSelect('professional')}
              className="w-full btn-primary"
            >
              Sélectionner ce plan
            </button>
            {selectedPlan === 'professional' && (
              <p className="mt-2 text-[14px] text-success">
                Plan sélectionné ! Le paiement sera intégré bientôt.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t">
          <Link href="/" className="text-accent hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}