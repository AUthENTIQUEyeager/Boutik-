-- ============================================================================
-- Boutik+ — migration 002
-- Fournisseurs, livraisons (réceptions de marchandises) et employés
-- ============================================================================

-- ----------------------------------------------------------------------------
-- fournisseurs
-- ----------------------------------------------------------------------------
create table if not exists fournisseurs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  adresse text,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- livraisons : réception de marchandises depuis un fournisseur
-- ----------------------------------------------------------------------------
create table if not exists livraisons (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  fournisseur_id uuid references fournisseurs(id) on delete set null,
  statut text not null default 'attendue' check (statut in ('attendue', 'recue', 'annulee')),
  date_prevue date,
  date_reception timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- lignes de livraison : un produit + une quantité par ligne
create table if not exists livraison_lignes (
  id uuid primary key default gen_random_uuid(),
  livraison_id uuid not null references livraisons(id) on delete cascade,
  produit_id uuid not null references produits(id) on delete restrict,
  quantite integer not null check (quantite > 0),
  prix_achat_unitaire numeric(12,2) not null default 0
);

-- ----------------------------------------------------------------------------
-- employés (roster, pas de compte de connexion dans ce MVP)
-- ----------------------------------------------------------------------------
create table if not exists employes (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  telephone text,
  role text not null default 'vendeur' check (role in ('vendeur', 'gerant', 'livreur', 'autre')),
  salaire numeric(12,2),
  date_embauche date,
  actif boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Index
-- ============================================================================
create index if not exists idx_fournisseurs_shop on fournisseurs(shop_id);
create index if not exists idx_livraisons_shop on livraisons(shop_id);
create index if not exists idx_livraisons_fournisseur on livraisons(fournisseur_id);
create index if not exists idx_livraison_lignes_livraison on livraison_lignes(livraison_id);
create index if not exists idx_livraison_lignes_produit on livraison_lignes(produit_id);
create index if not exists idx_employes_shop on employes(shop_id);

-- ============================================================================
-- Trigger : à la réception d'une livraison, incrémente le stock des produits
-- ============================================================================
create or replace function fn_after_update_livraison_reception()
returns trigger as $$
begin
  if new.statut = 'recue' and old.statut is distinct from 'recue' then
    update produits p
    set quantite_stock = p.quantite_stock + l.quantite
    from livraison_lignes l
    where l.livraison_id = new.id and l.produit_id = p.id;

    if new.date_reception is null then
      new.date_reception := now();
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_after_update_livraison_reception on livraisons;
create trigger trg_after_update_livraison_reception
  before update on livraisons
  for each row execute function fn_after_update_livraison_reception();

-- ============================================================================
-- RLS
-- ============================================================================
alter table fournisseurs enable row level security;
alter table livraisons enable row level security;
alter table livraison_lignes enable row level security;
alter table employes enable row level security;

drop policy if exists "fournisseurs_all" on fournisseurs;
create policy "fournisseurs_all" on fournisseurs for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

drop policy if exists "livraisons_all" on livraisons;
create policy "livraisons_all" on livraisons for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

-- livraison_lignes n'a pas de shop_id direct : on passe par la livraison parente
drop policy if exists "livraison_lignes_all" on livraison_lignes;
create policy "livraison_lignes_all" on livraison_lignes for all
  using (
    exists (
      select 1 from livraisons l
      where l.id = livraison_lignes.livraison_id
        and (l.shop_id = auth.uid() or is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from livraisons l
      where l.id = livraison_lignes.livraison_id
        and l.shop_id = auth.uid()
    )
  );

drop policy if exists "employes_all" on employes;
create policy "employes_all" on employes for all
  using (shop_id = auth.uid() or is_superadmin())
  with check (shop_id = auth.uid());

-- ============================================================================
-- Fin de la migration 002
-- ============================================================================
