# Prochaines étapes pour mettre Boutik+ en production avec les forfaits payants

## Résumé des travaux effectués
Nous avons préparé l'application pour :
1. Trois forfaits : Gratuit (très limité), Essential (3000 FCFA/mois), Professional (5000 FCFA/mois)
2. Une politique de confidentialité obligatoire à l'inscription
3. L'intégration technique avec MoneyFusion (à configurer avec vos vraies clés)
4. Des optimisations de performance et de configuration Vercel
5. La migration de base de données pour stocker les forfaits et paiements

## Actions requises pour passer en production

### 1. Configurer MoneyFusion (or other mobile money provider)
- Créez un compte auprès de votre prestataire de paiement mobile money préféré (MoneyFusion, Wave, Orange Money, etc.)
- Obtenez vos clés API :
  - Clé secrète (pour les appels API)
  - Clé de signature de webhook (pour vérifier la provenance des webhooks)
- Ajoutez ces clés dans votre fichier `.env.local` :
  ```
  MONEYFUSION_SECRET_KEY=votre_cle_secrete_ici
  MONEYFUSION_WEBHOOK_SECRET=votre_cle_webhook_ici
  ```

### 2. Remplacer les implémentations factices par la vraie intégration
#### a) Initialisation de paiement (`/app/api/payment/init/route.ts`)
- Remplacez la génération factice d'URL de paiement par un appel réel à l'API de votre prestataire
- Exemple générique :
  ```typescript
  // Dans /app/api/payment/init/route.ts
  const payment = await votrePresta.createPayment({
    amount: plan === 'essential' ? 3000 : 5000,
    currency: 'XOF',
    // autres paramètres requis par votre prestataire
    metadata: { shopId, plan }
  });
  return NextResponse.json({ paymentUrl: payment.redirectUrl });
  ```

#### b) Webhook de paiement (`/app/api/payment/webhook/route.ts`)
- Ajoutez la vérification de la signature selon la documentation de votre prestataire
- Exemple :
  ```typescript
  // Vérification de la signature (à adapter)
  const signature = request.headers.get('x-signature'); // ou autre nom d'en-tête
  const isValid = verifySignature(await request.text(), signature, process.env.MONEYFUSION_WEBHOOK_SECRET!);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  ```
- Ensuite, traitez le webhook comme actuellement (mise à jour du plan en cas de paiement réussi)

### 3. Appliquer la migration Supabase
1. Allez dans votre projet Supabase → SQL Editor → New query
2. Copiez-collez le contenu de `supabase/migrations/004_subscriptions.sql`
3. Exécutez la requête

### 4. Configurer les variables d'environnement sur Vercel
- Dans le tableau de bord Vercel → Votre projet → Settings → Environment Variables
- Ajoutez les mêmes variables que dans votre `.env.local` :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MONEYFUSION_SECRET_KEY`
  - `MONEYFUSION_WEBHOOK_SECRET`
- Assurez-vous que ces variables sont définies pour l'environnement de production (et preview si vous testez là-bas)

### 5. Tester avant le lancement en production
#### Option A : Test en preview Vercel (recommandé)
```bash
# Déployer en preview
vercel --prod=false
# Tester l'URL fournie :
# - Nouvelle inscription (vérifier la case à cocher de confidentialité)
# - Connexion et vérification du tableau de bord (bannière gratuite)
# - Visite de /pricing et test des boutons
# - Simuler un webhook réussi pour voir le plan changer
```

#### Option B : Test local
```bash
npm run dev
# Tester les mêmes scénarios en local
```

### 6. Passer en production
Lorsque tous les tests sont concluants :
```bash
vercel --prod
# Surveiller les logs et l'utilisation Supabase/Vercel les premières heures
```

## Points de vigilance
- **Limites gratuites** : Assurez-vous que les limites du forfait gratuit (10 clients, 20 ventes/mois, 5 questions IA) sont clairement communiquées et applicables.
- **Sécurité** : Ne commitez jamais votre `.env.local` avec les vraies clés. Utilisez seulement `.env.example` pour montrer la structure.
- **Conformité** : Relisez et adaptez la politique de confidentialité (`/app/confidentialite/page.tsx`) selon vos obligations légales spécifiques.
- **Sauvegardes** : Activez les sauvegardes automatisées dans Supabase (gratuit dans le plan).

## Ressources
- Documentation Vercel : https://vercel.com/docs
- Documentation Supabase : https://supabase.com/docs
- Exemple d'intégration de paiement mobile money : Consultez la documentation de votre prestataire choisi

## Bon lancement !
Avec ces mises à jour, Boutik+ est prêt à offrir une expérience freemium professionnelle tout en restant conforme et performant.
N'hésitez pas à revenir vers moi si vous avez besoin d'aide pour l'intégration spécifique à votre prestataire de paiement.