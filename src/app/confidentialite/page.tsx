import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[24px] font-bold text-ink mb-6">
          Politique de confidentialité
        </h1>
        <p className="text-[16px] text-ink-soft mb-4">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            1. Responsable du traitement des données
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Boutik+ est édité par [Nom de l'entreprise ou développeur], accessible
            via l'URL <a href="https://boutik-plus.vercel.app" className="underline">
              boutik-plus.vercel.app
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            2. Données collectées
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Nous collectons les informations suivantes dans le cadre de l'utilisation
            de l'application :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] text-ink">
            <li>
              Informations d'identification : numéro de téléphone, nom de la
              boutique.
            </li>
            <li>
              Données de transaction : historiques de ventes, achats, dettes,
              crédits.
            </li>
            <li>
              Données d'utilisation : fréquences d'utilisation, fonctionnalités
              consultées.
            </li>
            <li>
              Données techniques : adresse IP, type de dispositif, version de
              l'application (pour améliorer la sécurité et les performances).
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            3. Utilisation des données
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Vos données sont utilisées pour :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] text-ink">
            <li>
              Fournir, maintenir et améliorer les fonctionnalités de l'application.
            </li>
            <li>
              Personnaliser votre expérience (recommandations, rappels).
            </li>
            <li>
              Communiquer avec vous concernant votre compte, les mises à jour et
              le support.
            </li>
            <li>
              Générer des rapports agrégés pour l'assistant IA (sans informations
              personnelles identifiables).
            </li>
            <li>
              Prévenir la fraude et assurer la sécurité de l'application.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            4. Partage des données
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Nous ne vendons ni ne louons vos données personnelles à des tiers.
            Vos données peuvent être partagées avec :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] text-ink">
            <li>
              Nos prestataires de services hébergement (Vercel, Supabase) pour
              assurer le fonctionnement technique.
            </li>
            <li>
              Notre prestataire d'IA (Google Gemini) uniquement sous forme
              agrégée et anonymisée pour l'assistant IA.
            </li>
            <li>
              Nos partenaires de paiement (MoneyFusion) exclusivement pour le
              traitement des abonnements, dans le respect de leurs propres
              politiques de confidentialité.
            </li>
            <li>
              Les autorités légales lorsque requis par la loi ou pour protéger
              nos droits.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            5. Sécurité des données
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Nous mettons en œuvre des mesures de sécurité techniques et
            organisationnelles pour protéger vos données contre la perte, le
            vol ou l'accès non autorisé, incluant :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] text-ink">
            <li>
              Chiffrement des données en transit (HTTPS) et au repos (Supabase).
            </li>
            <li>
              Authentification forte et gestion des sessions sécurisées.
            </li>
            <li>
              Contrôles d'accès basés sur les rôles (RBAC) et principe du
              moindre privilège.
            </li>
            <li>
              Surveillance régulière et tests de pénétration.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            6. Conservation des données
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Nous conservons vos données tant que votre compte est actif. Vous
            pouvez demander la suppression de votre compte à tout moment via
            l'application ou en nous contactant. Après suppression, vos
            données seront définitivement supprimées de nos systèmes dans un
            délai raisonnable, sauf obligation légale contraire.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            7. Vos droits
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Conformément aux principes de protection des données, vous disposez
            des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] text-ink">
            <li>
              Droit d'accès : obtenir une copie de vos données personnelles.
            </li>
            <li>
              Droit de rectification : corriger des données inexactes.
            </li>
            <li>
              Droit à l'effacement (« droit à l'oubli ») dans les limites
              autorisées.
            </li>
            <li>
              Droit à la limitation du traitement de vos données.
            </li>
            <li>
              Droit à la portabilité : recevoir vos données dans un format
              structuré et couramment utilisé.
            </li>
            <li>
              Droit d'opposition : vous opposer à certains traitements.
            </li>
          </ul>
          <p className="text-[15px] text-ink mt-2">
            Pour exercer ces droits, veuillez nous contacter à
            <a href="mailto:authentique.studio.web@gmail.com" className="underline">
              authentique.studio.web@gmail.com
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            8. Transferts internationaux
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Vos données sont stockées dans des centres de données situés dans
            l'Union européenne (via Supabase), assurant un niveau de protection
            adéquat.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            9. Modifications de la politique
          </h2>
          <p className="text-[15px] text-ink mb-2">
            Nous nous réservons le droit de modifier cette politique de
            confidentialité à tout moment afin de l'adapter aux évolutions
            légales, techniques ou de notre offre. En cas de modification
            substantielle, nous vous en informerons par email ou via une
            notification dans l'application, et la date de mise à jour sera
            mentionnée en haut de ce document.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-ink mb-3">
            10. Contact
          </h2>
          <p className="text-[15px] text-ink">
            Pour toute question concernant cette politique ou vos données
            personnelles, contactez-nous :
          </p>
          <p className="text-[15px] text-ink mt-2">
            <strong>Email :</strong>
            <a href="mailto:privacy@boutik-plus.example" className="underline">
              privacy@boutik-plus.example
            </a>
          </p>
          <p className="text-[15px] text-ink">
            <strong>Adresse :</strong> [Votre adresse physique si applicable]
          </p>
        </section>

        <div className="mt-10 pt-6 border-t">
          <Link href="/" className="text-accent hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}