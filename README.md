# Boutik+

PWA de gestion commerciale pour petits commerçants d'Afrique de l'Ouest (Burkina Faso). Remplace le cahier / Excel / WhatsApp pour gérer clients, ventes, stock, dépenses et dettes.

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS + Framer Motion
- Dexie.js (IndexedDB) pour le mode hors-ligne
- PWA via `next-pwa`

Une seule application, un seul projet Supabase, **3 variables d'environnement**. Aucun backend séparé.

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
3. Vérifie dans **Table Editor** que les 7 tables sont créées (`profiles`, `clients`, `produits`, `ventes`, `depenses`, `dettes`, `notifications`).

### 4. Désactiver la confirmation email (numéro de téléphone uniquement)

Dans Supabase → **Authentication** → **Providers** → **Email** :
- Désactive **"Confirm email"** (l'app utilise un email interne factice, pas de vraie boîte mail à confirmer).

### 5. Configurer les variables en local

```bash
cp .env.example .env.local
# Renseigne les 3 valeurs récupérées à l'étape 2
```

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
3. Dans **Environment Variables**, ajoute les 3 mêmes variables que dans `.env.local`.
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

## Vérification de blocage de compte

Toutes les 60 secondes (et au montage de l'espace commerçant), l'app vérifie `profiles.status`. Si `bloque`, une modale plein écran non-fermable s'affiche, avec pour seule option la déconnexion.

---

## Prochaines versions (non codées dans ce MVP)

- **V2** — Assistant IA conversationnel : route API Next.js côté serveur appelant l'API Claude (clé jamais exposée côté client), insights automatiques sur les ventes, prévisions de tendances. La colonne `ai_credits_used` existe déjà dans `profiles` pour éviter une migration lourde plus tard.
- **V2** — Paiement automatique de l'abonnement via API Mobile Money (Wave / Orange Money) dès que disponible dans la zone.
- **V3** — Envoi WhatsApp automatique des rappels de dette via l'API WhatsApp Business (nécessite validation Meta Business). En V1, seul le lien `wa.me` à clic manuel est disponible.
