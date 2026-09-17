-- =============================================================================
-- MACHÉ — Migration 0005 : modération des produits
--
-- Rôle de ce fichier :
--   Donner à la table products les colonnes nécessaires au cycle de
--   publication, et journaliser chaque décision de modération.
--
-- Cycle retenu (cahier des charges §10) :
--   draft → submitted → manual_review | auto_approved → active
--   avec rejected, paused, archived comme sorties possibles.
--
-- Seul `active` est visible au catalogue public : le filtre est déjà
--   `status = 'active'` dans src/lib/catalog.ts. Rejeter ou mettre en pause
--   un produit le retire donc réellement de la vente.
--
-- Prérequis : migration 0001.
-- Additive et rejouable.
-- =============================================================================

alter table public.products add column if not exists submitted_at     timestamptz;
alter table public.products add column if not exists reviewed_at      timestamptz;
alter table public.products add column if not exists reviewed_by      uuid references public.users(id) on delete set null;
alter table public.products add column if not exists rejection_reason text;

create index if not exists products_status_created_idx
  on public.products(status, created_at desc);

-- Statuts autorisés. En contrainte plutôt qu'en type enum : une valeur
-- s'ajoute par un simple ALTER.
do $$
begin
  alter table public.products drop constraint if exists products_status_check;
  alter table public.products add constraint products_status_check check (
    status in ('draft','submitted','manual_review','auto_approved',
               'active','rejected','paused','archived')
  );
exception
  when check_violation then
    raise notice 'Contrainte de statut non appliquée : des produits portent une valeur hors liste. Listez-les avec « select distinct status from public.products; » puis corrigez.';
end $$;

-- -----------------------------------------------------------------------------
-- Journal des décisions
--
-- Une décision de modération doit être traçable : qui a validé quoi, quand,
-- et pourquoi. Sans journal, un rejet contesté est impossible à instruire.
-- -----------------------------------------------------------------------------
create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  actor_id uuid references public.users(id) on delete set null,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists moderation_events_product_idx
  on public.moderation_events(product_id, created_at desc);

alter table public.moderation_events enable row level security;

-- Le personnel lit tout ; un vendeur lit l'historique de ses propres produits,
-- ce qui lui permet de comprendre un rejet.
drop policy if exists moderation_events_read on public.moderation_events;
create policy moderation_events_read on public.moderation_events
  for select to authenticated using (
    public.is_staff()
    or (store_id is not null and public.owns_store(store_id))
  );

drop policy if exists moderation_events_write on public.moderation_events;
create policy moderation_events_write on public.moderation_events
  for insert to authenticated with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- Réglage de la marketplace : validation obligatoire ou non
--
-- Le cahier des charges exige qu'un vendeur ne puisse pas contourner une
-- validation quand MACHÉ l'impose. Le réglage vit en base pour être
-- modifiable sans redéploiement.
-- -----------------------------------------------------------------------------
create table if not exists public.marketplace_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.marketplace_settings enable row level security;

drop policy if exists settings_read on public.marketplace_settings;
create policy settings_read on public.marketplace_settings
  for select using (true);

drop policy if exists settings_write on public.marketplace_settings;
create policy settings_write on public.marketplace_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- false = les produits d'un vendeur vérifié partent directement en vente.
-- true  = toute mise en ligne passe par un administrateur.
insert into public.marketplace_settings (key, value) values
  ('require_product_review', 'false'::jsonb)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Vérification
-- -----------------------------------------------------------------------------
-- select status, count(*) from public.products group by status order by 2 desc;
-- select key, value from public.marketplace_settings;
