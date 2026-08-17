# Mise à jour de Boutik+ - Intégration des forfaits payants et de la politique de confidentialité

## Résumé des modifications

Cette mise à jour prépare Boutik+ pour le lancement des forfaits payants (3000 FCFA et 5000 FCFA/mois) tout en conservant un forfait gratuit très limité. Elle ajoute également une politique de confidentialité obligatoire à l'inscription.

### 1. Configuration Vercel
- **Nouveau fichier** : `vercel.ts` (remplace progressivement `vercel.json` pour une configuration typée et optimisée)
- **Optimisations** : Ajout de headers de cache pour améliorer les performances (statique 1 jour, assets Next.js 1 an)

### 2. Base de données (Supabase)
- **Migration** : `supabase/migrations/004_subscriptions.sql`
  - Ajout des colonnes `plan`, `plan_renews_at`, `plan_updated_at` à la table `profiles`
  - Création de la table `payments` pour suivre les transactions (optionnel pour l'instant)

### 3. Interface utilisateur
- **Page d'inscription** (`src/app/(auth)/register/page.tsx`)
  - Modification de la description tarifaire : "Commencez gratuitement (très limité) ou passez à 3000 ou 5000 FCFA/mois."
  - Ajout d'une case à cocher obligatoire pour la politique de confidentialité
- **Nouvelle page** : `/app/confidentialite/page.tsx` (politique de confidentialité complète)
- **Tableau de bord** (`src/app/(app)/dashboard/page.tsx`)
  - Récupération du plan utilisateur depuis la table `profiles`
  - Affichage d'une bannière contextuelle selon le plan :
    - Gratuit : rappelle les limites (10 clients, 20 ventes/mois, 5 IA) avec CTA vers la tarification
    - Essential : rappelle les avantages avec CTA pour passer à Professional
    - Professional : confirme l'accès illimité
- **Nouvelle page** : `/app/pricing/page.tsx`
  - Présentation des trois forfaits (Gratuit, Essential 3000 FCFA, Professional 5000 FCFA)
  - Boutons de sélection (actuellement en mode démonstration, à connecter à MoneyFusion)
- **Nouveaux API routes** :
  - `/app/api/payment/init/route.ts` : initialise un paiement (à connecter à l'API MoneyFusion)
  - `/app/api/payment/webhook/route.ts` : reçoit les webhooks de MoneyFusion pour mettre à jour le plan utilisateur

### 4. Variables d'environnement
- **Mise à jour** : `.env.example`
  - Ajout des variables MoneyFusion : `MONEYFUSION_SECRET_KEY` et `MONEYFUSION_WEBHOOK_SECRET`

## Prochaines étapes pour terminer l'intégration

### A. Configurer MoneyFusion
1. Créez un compte sur [MoneyFusion](https://moneyfusion.example) (ou votre prestataire de paiement mobile money préféré)
2. Obtenez vos clés API :
   - `MONEYFUSION_SECRET_KEY` (clé secrète pour les appels API)
   - `MONEYFUSION_WEBHOOK_SECRET` (pour vérifier la signature des webhooks)
3. Ajoutez-les à votre fichier `.env.local` :
   ```
   MONEYFUSION_SECRET_KEY=votre_cle_secrete_ici
   MONEYFUSION_WEBHOOK_SECRET=votre_cle_webhook_ici
   ```
4. Configurez ces mêmes variables dans les paramètres de votre projet Vercel (Section Environment Variables)

### B. Remplacer les implémentations factices par la vraie intégration MoneyFusion
1. Dans `/app/api/payment/init/route.ts` :
   - Remplacez la génération factice d'URL de paiement par un appel réel à l'API MoneyFusion pour créer une session de paiement/abonnement
   - Exemple de structure à implémenter :
     ```typescript
     const paymentSession = await moneyfusion.createPaymentSession({
       amount: plan === 'essential' ? 3000 : 5000,
       currency: 'XOF',
       customerId: shopId, // ou créez un client MoneyFusion si nécessaire
       successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
       cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
       metadata: { plan, shopId }
     });
     return NextResponse.json({ paymentUrl: paymentSession.url });
     ```

2. Dans `/app/api/payment/webhook/route.ts` :
   - Implémentez la vérification de la signature selon la documentation MoneyFusion
   - Exemple :
     ```typescript
     const signature = request.headers.get('x-moneyfusion-signature');
     const isValid = verifyMoneyfusionSignature(await request.text(), signature, process.env.MONEYFUSION_WEBHOOK_SECRET!);
     if (!isValid) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
     }
     ```
   - Après vérification, traitez le webhook comme actuellement (mise à jour du plan en cas de paiement réussi)

### C. Appliquer la migration Supabase
1. Allez dans votre projet Supabase → SQL Editor → New query
2. Copiez-collez le contenu de `supabase/migrations/004_subscriptions.sql`
3. Exécutez la requête
   - Ceci ajoutera les colonnes nécessaires à la table `profiles` et créera la table `payments`

### D. Tester le flux complet
1. **En développement local** :
   - `npm run dev`
   - Testez une nouvelle inscription (vérifiez que la case à cocher de confidentialité est requise)
   - Après connexion, vérifiez que le tableau de bord affiche la bannière du forfait gratuit
   - Allez sur `/pricing` et testez la sélection de forfait (devrait montrer une alerte pour l'instant)
   - Simulez un webhook réussi (en utilisant `curl` ou un outil comme Beekeeper Studio) pour mettre à jour le plan d'un utilisateur de test

2. **En préproduction sur Vercel** :
   - Déployez en preview : `vercel --prod=false`
   - Vérifiez que les variables d'environnement sont bien configurées dans Vercel
   - Répétez les tests ci-dessus sur l'URL de preview

### E. Passer en production
1. Lorsque tous les tests sont concluants :
   - Déployez en production : `vercel --prod`
   - Surveillez les logs d'erreur les premières heures (vous pouvez ajouter temporairement une route `/api/log-errors` qui écrit dans Supabase)
   - Vérifiez que votre utilisation Supabase et Vercel reste dans les limites gratuites

## Notes importantes
- **Zéro utilisateur actuel** : Comme vous avez indiqué avoir 0 utilisateurs sur l'application, ces changements peuvent être appliqués sans risque de perturber des utilisateurs existants.
- **Modèle économique** : Les forfaits proposés (0 FCFA, 3000 FCFA, 5000 FCFA/mois) sont réalistes pour le marché ouest-africain, avec des limites gratuites suffisamment restreintes pour encourager la mise à niveau quand l'activité augmente.
- **Conformité** : La politique de confidentialité intégrée couvre les bases du RGPD-like et peut être adaptée selon vos besoins juridiques spécifiques.
- **Extensibilité** : La structure des API de paiement est prête à être connectée à tout autre prestataire de paiement mobile money (Wave, Orange Money, MTN Mobile Money) en remplissant simplement les fonctions d'appel à leur API.

## Fichiers créés ou modifiés
```
Nouveaux fichiers:
- vercel.ts
- supabase/migrations/004_subscriptions.sql
- src/app/confidentialite/page.tsx
- src/app/pricing/page.tsx
- src/app/api/payment/init/route.ts
- src/app/api/payment/webhook/route.ts

Fichiers modifiés:
- src/app/(auth)/register/page.tsx
- src/app/(app)/dashboard/page.tsx
- .env.example
```

## Commandes utiles
```bash
# Vérifier que l'application compile toujours
npm run build

# Lancer en développement
npm run dev

# Déployer en preview sur Vercel
vercel --prod=false

# Déployer en production sur Vercel
vercel --prod
```