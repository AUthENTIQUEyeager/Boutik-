-- ============================================================================
-- Boutik+ — migration initiale
-- Tables, triggers (calcul de bénéfice + décrément de stock) et policies RLS
-- ============================================================================

-- Extension nécessaire pour gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  shop_name text not null,
  role text not null default 'commercant' check (role in ('commercant', 'superadmin')),
  status text not null default 'actif' check (status in ('actif', 'bloque')),
  subscription_expires_at timestamptz not null default (now() + interval '30 days'),
  ai_credits_used integer not null default 0, -- réservé pour la V2, non utilisé en V1
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- clients
-- ----------------------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- produits
-- ----------------------------------------------------------------------------
create table if not exists produits (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  prix_achat numeric(12,2) not null default 0,
  prix_vente numeric(12,2) not null default 0,
  quantite_stock integer not null default 0,
  seuil_alerte_stock integer not null default 5,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ventes
-- ----------------------------------------------------------------------------
create table if not exists ventes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  produit_id uuid not null references produits(id) on delete restrict,
  quantite integer not null check (quantite > 0),
  prix_achat_unitaire numeric(12,2) not null default 0,
  prix_vente_unitaire numeric(12,2) not null default 0,
  benefice_calcule numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- depenses
-- ----------------------------------------------------------------------------
create table if not exists depenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  montant numeric(12,2) not null,
  categorie text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- dettes
-- ----------------------------------------------------------------------------
create table if not exists dettes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  montant numeric(12,2) not null,
  montant_paye numeric(12,2) not null default 0,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'soldee')),
  date_echeance date,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('stock_bas', 'dette_echeance', 'info')),
  message text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Index utiles
-- ============================================================================
create index if not exists idx_clients_shop on clients(shop_id);
create index if not exists idx_produits_shop on produits(shop_id);
create index if not exists idx_ventes_shop on ventes(shop_id);
create index if not exists idx_ventes_produit on ventes(produit_id);
create index if not exists idx_depenses_shop on depenses(shop_id);
create index if not exists idx_dettes_shop on dettes(shop_id);
create index if not exists idx_dettes_client on dettes(client_id);
create index if not exists idx_notifications_shop on notifications(shop_id);

-- ============================================================================
-- Triggers : calcul du bénéfice + décrément automatique du stock à la vente
-- ============================================================================
create or replace function fn_before_insert_vente()
returns trigger as $$
declare
  v_stock integer;
begin
  -- Si les prix ne sont pas fournis, on les récupère depuis le produit
  if new.prix_achat_unitaire is null or new.prix_achat_unitaire = 0 then
    select prix_achat into new.prix_achat_unitaire from produits where id = new.produit_id;
  end if;
  if new.prix_vente_unitaire is null or new.prix_vente_unitaire = 0 then
    select prix_vente into new.prix_vente_unitaire from produits where id = new.produit_id;
  end if;

  new.benefice_calcule := (new.prix_vente_unitaire - new.prix_achat_unitaire) * new.quantite;

  select quantite_stock into v_stock from produits where id = new.produit_id for update;
  if v_stock is null then
    raise exception 'Produit introuvable';
  end if;
  if v_stock < new.quantite then
    raise exception 'Stock insuffisant (disponible: %, demandé: %)', v_stock, new.quantite;
  end if;

  update produits set quantite_stock = quantite_stock - new.quantite where id = new.produit_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_before_insert_vente on ventes;
create trigger trg_before_insert_vente
  before insert on ventes
  for each row execute function fn_before_insert_vente();

-- Notification automatique de stock bas après une vente
create or replace function fn_after_insert_vente_notify_stock()
returns trigger as $$
declare
  v_stock integer;
  v_seuil integer;
  v_nom text;
begin
  select quantite_stock, seuil_alerte_stock, nom into v_stock, v_seuil, v_nom
  from produits where id = new.produit_id;

  if v_stock <= v_seuil then
    insert into notifications (shop_id, type, message)
    values (new.shop_id, 'stock_bas', 'Stock bas pour "' || v_nom || '" : ' || v_stock || ' unité(s) restante(s).');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_after_insert_vente_notify on ventes;
create trigger trg_after_insert_vente_notify
  after insert on ventes
  for each row execute function fn_after_insert_vente_notify_stock();

-- Met à jour le statut d'une dette dès qu'elle est intégralement payée
create or replace function fn_before_update_dette()
returns trigger as $$
begin
  if new.montant_paye >= new.montant then
    new.statut := 'soldee';
  else
    new.statut := 'en_cours';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_before_update_dette on dettes;
create trigger trg_before_update_dette
  before insert or update on dettes
  for each row execute function fn_before_update_dette();

-- ============================================================================
-- Fonction utilitaire : l'utilisateur courant est-il superadmin ?
-- ============================================================================
create or replace function is_superadmin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'superadmin'
  );
$$ language sql security definer stable;

-- ============================================================================
-- RLS
-- ============================================================================
alter table profiles enable row level security;
alter table clients enable row level security;
alter table produits enable row level security;
alter table ventes enable row level security;
alter table depenses enable row level security;
alter table dettes enable row level security;
alter table notifications enable row level security;

-- profiles: chacun voit/modifie son propre profil ; le superadmin voit tout
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or is_superadmin());

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin" on profiles for update
  using (is_superadmin())
  with check (is_superadmin());

drop policy if exists "profiles_insert_self" on profiles;
create policy "profiles_insert_self" on profiles for insert
  with check (id = auth.uid());

-- Gabarit générique appliqué à clients / produits / ventes / depenses / dettes / notifications
drop policy if exists "clients_all" on clients;
create policy "clients_all" on clients for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "produits_all" on produits;
create policy "produits_all" on produits for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "ventes_all" on ventes;
create policy "ventes_all" on ventes for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "depenses_all" on depenses;
create policy "depenses_all" on depenses for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "dettes_all" on dettes;
create policy "dettes_all" on dettes for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "notifications_all" on notifications;
create policy "notifications_all" on notifications for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

-- ============================================================================
-- Fin de la migration
-- ============================================================================
