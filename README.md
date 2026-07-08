# Boutik+

PWA de gestion commerciale pour petits commerçants d'Afrique de l'Ouest (Burkina Faso). Remplace le cahier / Excel / WhatsApp pour gérer clients, ventes, stock, dépenses et dettes.

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS + Framer Motion
- Dexie.js (IndexedDB) pour le mode hors-ligne
- PWA via `next-pwa`

Une seule application, un seul projet Supabase. Aucun backend séparé.

> ℹ️ La contrainte initiale de "3 variables d'environnement" est passée à **4** avec l'ajout de l'assistant IA (`GOOGLE_AI_API_KEY`). Toujours une seule app, un seul déploiement — juste une clé de plus à coller sur Vercel.

---

## Déploiement — étapes exactes

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Choisis un nom (ex. `boutik-plus`), un mot de passe de base de données, et une région proche (Europe de l'Ouest recommandée pour l'Afrique de l'Ouest).
3. Attends la fin du provisionnement (~2 minutes).

### 2. Récupérer les clés

Dans le projet Supabase → **Project Settings** → **API** :

- `Project URL` → correspond à `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → correspond à `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key (⚠️ secrète) → correspond à `SUPABASE_SERVICE_ROLE_KEY`

### 3. Lancer les migrations SQL

1. Dans Supabase → **SQL Editor** → **New query**.
2. Colle l'intégralité du contenu de `supabase/migrations/001_init.sql` et exécute (**Run**).
3. Fais de même avec `supabase/migrations/002_fournisseurs_livraisons_employes.sql` (ajoute fournisseurs, livraisons et employés).
4. Fais de même avec `supabase/migrations/003_ai_assistant.sql` (ajoute le suivi du quota de l'assistant IA).
5. Vérifie dans **Table Editor** que les tables sont créées (`profiles`, `clients`, `produits`, `ventes`, `depenses`, `dettes`, `notifications`, `fournisseurs`, `livraisons`, `livraison_lignes`, `employes`).

### 4. Désactiver la confirmation email (numéro de téléphone uniquement)

Dans Supabase → **Authentication** → **Providers** → **Email** :
- Désactive **"Confirm email"** (l'app utilise un email interne factice, pas de vraie boîte mail à confirmer).

### 5. Configurer les variables en local

```bash
cp .env.example .env.local
# Renseigne les 3 valeurs Supabase récupérées à l'étape 2
```

### 5bis. Obtenir la clé de l'assistant IA (gratuite)

1. Va sur [aistudio.google.com](https://aistudio.google.com) → connecte-toi avec un compte Google.
2. **Get API Key** → génère une clé (aucune carte bancaire requise).
3. Ajoute-la dans `.env.local` : `GOOGLE_AI_API_KEY=...`

Le tier gratuit Google (~1 500 requêtes/jour au total pour le projet) est largement suffisant pour démarrer. L'app limite en plus chaque boutique à 50 questions/mois (compteur `ai_credits_used`, réinitialisé automatiquement chaque mois) pour éviter qu'un seul compte n'épuise le quota.

### 6. Installer et lancer en local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

### 7. Charger les données de démonstration (optionnel)

1. Inscris-toi normalement dans l'app avec un numéro de test (ex. `70000000`).
2. Dans Supabase → **SQL Editor**, récupère l'UUID : `select id from profiles where phone = '70000000';`
3. Ouvre `supabase/seed.sql`, remplace `<SHOP_ID>` par cet UUID, puis exécute le script dans le SQL Editor.

### 8. Créer le compte super admin

Après inscription d'un compte normal, passe son rôle à `superadmin` directement en base :

```sql
update profiles set role = 'superadmin' where phone = 'TON_NUMERO';
```

### 9. Déployer sur Vercel

1. Pousse le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com) → **Add New Project** → importe le repo.
3. Dans **Environment Variables**, ajoute les 4 mêmes variables que dans `.env.local` (les 3 Supabase + `GOOGLE_AI_API_KEY`).
4. Clique **Deploy**. Le build (`npm run build`) doit réussir sans configuration supplémentaire.

### 10. Vérification post-déploiement

- Ouvre l'URL Vercel sur mobile → un bandeau d'installation doit apparaître (Android : bouton direct ; iOS : instructions "Partager → Sur l'écran d'accueil").
- Teste une inscription, une vente, une dette avec un client ayant un numéro WhatsApp valide.
- Coupe le réseau puis enregistre une vente : elle doit apparaître immédiatement (Dexie), puis se synchroniser au retour de connexion (indicateur dans l'en-tête).

---

## Structure du projet

```
src/
  app/
    (auth)/login, register        → authentification par téléphone
    (app)/dashboard, clients,     → espace commerçant
          produits, ventes,
          depenses, dettes
    (admin)/admin                 → espace super admin
    api/admin/*                   → route handlers utilisant la service role key
  components/                     → composants réutilisables (nav, modales, PWA…)
  lib/
    supabase/{client,server,admin}.ts
    dexie.ts                      → base locale + file de synchronisation
    sync.ts                       → moteur de synchronisation hors-ligne
  types/database.ts               → types partagés
supabase/
  migrations/001_init.sql         → schéma complet + triggers + RLS
  seed.sql                        → données de démonstration
```

## Fonctionnement hors-ligne

Toute écriture (vente, client, produit, dépense, dette) passe d'abord par Dexie (IndexedDB), qui met à jour l'interface immédiatement puis ajoute l'opération à une file `sync_queue`. Au retour de connexion (`online` event + polling 30s), la file est vidée vers Supabase dans l'ordre chronologique via un `upsert` (stratégie "dernière écriture gagne"). Un point discret dans l'en-tête indique l'état : en ligne / hors-ligne / synchronisation en cours.

Les modules **Fournisseurs**, **Livraisons** et **Employés** (ajoutés après le MVP initial) fonctionnent en écriture directe vers Supabase (connexion requise) car les livraisons impliquent une écriture transactionnelle multi-tables (en-tête + lignes) qui ne se prête pas simplement à la file de synchronisation. Les modules cœur (ventes, clients, produits, dépenses, dettes) restent pleinement utilisables hors-ligne.

## Navigation mobile

La barre d'onglets du bas reste volontairement courte (Accueil, Ventes, Clients, Dettes) pour rester lisible sur petit écran. Un 5ᵉ onglet **Plus** ouvre un menu donnant accès à Produits, Dépenses, Fournisseurs, Livraisons et Employés. Sur tablette/PC, tous ces liens apparaissent directement dans la barre latérale.

## Vente rapide

L'écran Ventes s'ouvre par défaut en mode **Vente rapide** : une grille de produits, un tap ajoute au panier, un second tap (ou +/-) ajuste la quantité. Un bandeau flottant affiche le total et valide la vente en un geste (client optionnel). Le mode **Vente détaillée** (formulaire classique) et l'**Historique** restent accessibles via les boutons en haut de l'écran.

## Vérification de blocage de compte

Toutes les 60 secondes (et au montage de l'espace commerçant), l'app vérifie `profiles.status`. Si `bloque`, une modale plein écran non-fermable s'affiche, avec pour seule option la déconnexion.

---

## Assistant IA

Une bulle flottante (icône ✨, en bas à droite) ouvre un chat où le commerçant peut poser des questions simples sur sa boutique ("Quel est mon bénéfice du mois ?", "Ai-je des produits en rupture ?"). Fonctionnement :

- Route serveur `POST /api/assistant` — la clé `GOOGLE_AI_API_KEY` reste côté serveur, jamais exposée au client.
- Le modèle utilisé est **Gemini 2.5 Flash** (tier gratuit Google, sans carte bancaire).
- À chaque question, la route va chercher des **données agrégées** de la boutique (bénéfice du jour/mois, stock total, produits en stock bas, total des dettes en cours) — **jamais de nom ou numéro de client**, pour limiter ce qui transite vers un service tiers.
- Chaque boutique est limitée à **50 questions par mois** (`profiles.ai_credits_used`, réinitialisé automatiquement via `profiles.ai_credits_reset_at`). Au-delà, l'assistant affiche un message clair et se réactive le mois suivant.
- Aucun historique de conversation n'est conservé en base : la discussion vit dans la mémoire de l'onglet et disparaît au rechargement — volontairement simple pour un assistant "questions de base".

Pour changer le quota mensuel, modifie la constante `QUOTA_MENSUELLE` dans `src/app/api/assistant/route.ts`.

## Prochaines versions (non codées dans ce MVP)

- ~~**V2** — Assistant IA conversationnel~~ ✅ Livré (voir section "Assistant IA" ci-dessous). Piste future : passer sur l'API Claude pour une meilleure qualité de réponse une fois que l'abonnement génère assez de revenu pour absorber le coût.
- **V2** — Paiement automatique de l'abonnement via API Mobile Money (Wave / Orange Money) dès que disponible dans la zone.
- **V3** — Envoi WhatsApp automatique des rappels de dette via l'API WhatsApp Business (nécessite validation Meta Business). En V1, seul le lien `wa.me` à clic manuel est disponible.
