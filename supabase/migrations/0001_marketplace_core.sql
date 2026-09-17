-- =============================================================================
-- MACHÉ — Migration 0001 : socle marketplace
--
-- Rôle de ce fichier :
--   Ajouter les tables qui manquent pour qu'une commande multi-vendeurs, un
--   avis, une adresse ou un paiement puissent exister. Le code ne référence
--   aujourd'hui que products, stores, users, orders, site_widgets et
--   partner_vendors : tout le reste d'une marketplace n'a pas de support.
--
-- Garanties :
--   - ADDITIVE UNIQUEMENT. Aucun DROP, aucun RENAME, aucune donnée touchée.
--   - REJOUABLE. Tout est en « if not exists » ou gardé par un bloc DO.
--   - Les tables EXISTANTES ne voient leur RLS ni activé ni modifié ici :
--     activer RLS sur une table sans politique bloque tous ses accès. Les
--     politiques des tables existantes sont traitées séparément dans
--     supabase/users-policies.sql, après constat.
--
-- À exécuter dans : Supabase → SQL Editor. Lire la section 0 d'abord.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. CONSTAT — à exécuter seul, avant le reste
-- -----------------------------------------------------------------------------
-- select table_name from information_schema.tables
-- where table_schema = 'public' order by table_name;
--
-- select relname, relrowsecurity as rls_actif from pg_class
-- where relnamespace = 'public'::regnamespace and relkind = 'r'
-- order by relname;


-- -----------------------------------------------------------------------------
-- 1. FONCTION DE RÔLE
--
-- Lire public.users depuis la politique d'une autre table est fragile : la
-- sous-requête est elle-même soumise au RLS de users, et une politique de
-- users qui interrogerait users provoquerait une récursion infinie. Une
-- fonction SECURITY DEFINER lit le rôle en dehors du RLS.
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'super_admin'), false);
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- Propriétaire d'une boutique, utilisé par plusieurs politiques.
create or replace function public.owns_store(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores
    where stores.id = target_store and stores.owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_store(uuid) from public, anon;
grant execute on function public.owns_store(uuid) to authenticated;


-- -----------------------------------------------------------------------------
-- 2. CATÉGORIES
--
-- Elles sont aujourd'hui codées en dur dans trois fichiers, avec trois listes
-- qui ne se recouvrent pas, et les liens de l'accueil passent le libellé en
-- minuscules alors que les produits stockent le libellé d'origine : le filtre
-- par catégorie ne peut pas fonctionner. Une table donne une référence unique
-- avec un slug stable pour les URL.
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  parent_id uuid references public.categories(id) on delete set null,
  icon text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_active_idx on public.categories(is_active, position);


-- -----------------------------------------------------------------------------
-- 3. ADRESSES
-- -----------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  department text,
  country text not null default 'HT',
  postal_code text,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses(user_id);


-- -----------------------------------------------------------------------------
-- 4. COMMANDES — compléments
--
-- La table orders existe et porte déjà store_id, seller_id, status,
-- total_price et created_at. Ces colonnes ne sont pas touchées : le code s'en
-- sert. On ajoute ce qui manque pour une commande réelle.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.orders') is null then
    raise notice 'Table orders absente : création.';

    create table public.orders (
      id uuid primary key default gen_random_uuid(),
      store_id uuid references public.stores(id) on delete set null,
      seller_id uuid references public.users(id) on delete set null,
      status text not null default 'pending',
      total_price numeric(12,2) not null default 0,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

alter table public.orders add column if not exists reference       text;
alter table public.orders add column if not exists buyer_id        uuid references public.users(id) on delete set null;
alter table public.orders add column if not exists currency        text not null default 'HTG';
alter table public.orders add column if not exists subtotal        numeric(12,2) not null default 0;
alter table public.orders add column if not exists shipping_total  numeric(12,2) not null default 0;
alter table public.orders add column if not exists discount_total  numeric(12,2) not null default 0;
alter table public.orders add column if not exists payment_status  text not null default 'pending';
alter table public.orders add column if not exists shipping_address_id uuid references public.addresses(id) on delete set null;
alter table public.orders add column if not exists contact_email   text;
alter table public.orders add column if not exists contact_phone   text;
alter table public.orders add column if not exists notes           text;
alter table public.orders add column if not exists placed_at       timestamptz;
alter table public.orders add column if not exists updated_at      timestamptz not null default now();

-- Référence lisible par le client, unique. Générée hors SQL applicatif pour
-- rester indépendante d'une séquence.
create unique index if not exists orders_reference_key on public.orders(reference)
  where reference is not null;

create index if not exists orders_buyer_idx   on public.orders(buyer_id);
create index if not exists orders_store_idx   on public.orders(store_id);
create index if not exists orders_status_idx  on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

-- Statuts autorisés. En contrainte plutôt qu'en type enum : une valeur
-- s'ajoute par un simple ALTER, sans migration de type.
do $$
begin
  alter table public.orders drop constraint if exists orders_status_check;
  alter table public.orders add constraint orders_status_check check (
    status in ('draft','pending','processing','shipped','delivered',
               'completed','cancelled','refunded','failed')
  );

  alter table public.orders drop constraint if exists orders_payment_status_check;
  alter table public.orders add constraint orders_payment_status_check check (
    payment_status in ('pending','requires_action','authorized','paid',
                       'failed','refunded','partially_refunded',
                       'cancelled','cash_on_delivery')
  );
exception
  when check_violation then
    raise notice 'Contrainte de statut non appliquée : des lignes existantes portent une valeur hors liste. Corrigez-les puis rejouez.';
end $$;


-- -----------------------------------------------------------------------------
-- 5. LIGNES DE COMMANDE
--
-- Sans cette table, une commande ne peut porter qu'une seule boutique : le
-- panier d'un client achetant chez deux vendeurs n'est pas représentable.
-- C'est la table qui fait la différence entre une boutique et une marketplace.
--
-- Les libellés et le prix sont recopiés à la commande : le client doit
-- retrouver ce qu'il a payé même si le vendeur modifie ou supprime le produit.
-- -----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  seller_id uuid references public.users(id) on delete set null,
  title text not null,
  variant_label text,
  image_url text,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(12,2) not null,
  commission_rate numeric(5,4) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  seller_amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx  on public.order_items(order_id);
create index if not exists order_items_store_idx  on public.order_items(store_id);
create index if not exists order_items_seller_idx on public.order_items(seller_id);


-- -----------------------------------------------------------------------------
-- 6. PAIEMENTS
--
-- Aucune donnée bancaire n'est stockée : seules les références du prestataire.
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  status text not null default 'pending',
  amount numeric(12,2) not null,
  currency text not null default 'HTG',
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments(order_id);
create unique index if not exists payments_provider_ref_key
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;


-- -----------------------------------------------------------------------------
-- 7. EXPÉDITIONS
-- -----------------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  agent_id uuid references public.users(id) on delete set null,
  status text not null default 'pending',
  carrier text,
  tracking_number text,
  zone text,
  fee numeric(12,2) not null default 0,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_order_idx on public.shipments(order_id);
create index if not exists shipments_agent_idx on public.shipments(agent_id);

do $$
begin
  alter table public.shipments drop constraint if exists shipments_status_check;
  alter table public.shipments add constraint shipments_status_check check (
    status in ('pending','assigned','picked_up','in_transit',
               'delivered','failed','cancelled')
  );
end $$;


-- -----------------------------------------------------------------------------
-- 8. AVIS
--
-- Un avis est rattaché à une ligne de commande : c'est ce qui permet de
-- distinguer un avis vérifié d'un avis quelconque, et d'empêcher plusieurs
-- avis pour un même achat.
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  image_urls text[] not null default '{}',
  is_verified_purchase boolean not null default false,
  status text not null default 'published',
  seller_reply text,
  seller_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_id);
create index if not exists reviews_store_idx   on public.reviews(store_id);
create unique index if not exists reviews_one_per_purchase
  on public.reviews(order_item_id) where order_item_id is not null;


-- -----------------------------------------------------------------------------
-- 9. FAVORIS
--
-- L'en-tête du site pointe déjà vers /favorites, page qui n'existe pas.
-- -----------------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_target_check check (
    (product_id is not null and store_id is null)
    or (product_id is null and store_id is not null)
  )
);

create unique index if not exists favorites_user_product_key
  on public.favorites(user_id, product_id) where product_id is not null;
create unique index if not exists favorites_user_store_key
  on public.favorites(user_id, store_id) where store_id is not null;


-- -----------------------------------------------------------------------------
-- 10. VERSEMENTS VENDEUR
-- -----------------------------------------------------------------------------
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'HTG',
  status text not null default 'pending',
  method text,
  reference text,
  period_start date,
  period_end date,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payouts_seller_idx on public.payouts(seller_id);


-- -----------------------------------------------------------------------------
-- 11. ABONNEMENTS
--
-- Les montants ne sont volontairement pas renseignés : fixer un prix est une
-- décision commerciale. La structure permet de les configurer sans migration.
-- -----------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  max_stores int not null default 1,
  max_products_per_store int not null default 50,
  commission_rate numeric(5,4) not null default 0,
  price_amount numeric(12,2),
  price_currency text not null default 'HTG',
  billing_period text not null default 'monthly',
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);


-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, is_read, created_at desc);


-- -----------------------------------------------------------------------------
-- 13. PRODUITS — compléments
--
-- image_urls est conservé : c'est le format déjà utilisé par le projet.
-- -----------------------------------------------------------------------------
alter table public.products add column if not exists image_urls    text[] not null default '{}';
alter table public.products add column if not exists compare_at_price numeric(12,2);
alter table public.products add column if not exists category_id   uuid references public.categories(id) on delete set null;
alter table public.products add column if not exists attributes    jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists rating_average numeric(3,2) not null default 0;
alter table public.products add column if not exists rating_count  int not null default 0;
alter table public.products add column if not exists updated_at    timestamptz not null default now();

create index if not exists products_store_idx    on public.products(store_id);
create index if not exists products_status_idx   on public.products(status);
create index if not exists products_category_idx on public.products(category_id);

-- Recherche plein texte sur titre et description.
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));


-- -----------------------------------------------------------------------------
-- 14. BOUTIQUES — compléments
-- -----------------------------------------------------------------------------
alter table public.stores add column if not exists banner_url     text;
alter table public.stores add column if not exists rating_average numeric(3,2) not null default 0;
alter table public.stores add column if not exists rating_count   int not null default 0;
alter table public.stores add column if not exists updated_at     timestamptz not null default now();

create unique index if not exists stores_slug_key on public.stores(slug);
create index if not exists stores_owner_idx on public.stores(owner_id);


-- -----------------------------------------------------------------------------
-- 15. RLS SUR LES TABLES CRÉÉES ICI
--
-- Uniquement sur les tables nouvelles : chacune reçoit ses politiques dans la
-- même transaction, donc aucun accès existant n'est coupé.
-- -----------------------------------------------------------------------------
alter table public.categories        enable row level security;
alter table public.addresses         enable row level security;
alter table public.order_items       enable row level security;
alter table public.payments          enable row level security;
alter table public.shipments         enable row level security;
alter table public.reviews           enable row level security;
alter table public.favorites         enable row level security;
alter table public.payouts           enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.notifications     enable row level security;

-- Catégories et offres : lecture publique, écriture réservée au personnel.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (is_active or public.is_staff());

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists plans_read on public.subscription_plans;
create policy plans_read on public.subscription_plans
  for select using (is_active or public.is_staff());

drop policy if exists plans_write on public.subscription_plans;
create policy plans_write on public.subscription_plans
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Données personnelles : chacun les siennes.
drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- Lignes de commande : l'acheteur voit les siennes, le vendeur celles de ses
-- boutiques, le personnel toutes.
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select to authenticated using (
    public.is_staff()
    or seller_id = auth.uid()
    or (store_id is not null and public.owns_store(store_id))
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.buyer_id = auth.uid()
    )
  );

-- Paiements : lecture seule pour l'acheteur et le vendeur concerné. L'écriture
-- passe par le serveur, jamais par le navigateur.
drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select to authenticated using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- Expéditions : acheteur, vendeur, agent assigné, personnel.
drop policy if exists shipments_read on public.shipments;
create policy shipments_read on public.shipments
  for select to authenticated using (
    public.is_staff()
    or agent_id = auth.uid()
    or (store_id is not null and public.owns_store(store_id))
    or exists (
      select 1 from public.orders o
      where o.id = shipments.order_id and o.buyer_id = auth.uid()
    )
  );

drop policy if exists shipments_agent_update on public.shipments;
create policy shipments_agent_update on public.shipments
  for update to authenticated
  using (agent_id = auth.uid() or public.is_staff())
  with check (agent_id = auth.uid() or public.is_staff());

-- Avis : lecture publique des avis publiés, écriture par leur auteur.
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews
  for select using (status = 'published' or author_id = auth.uid() or public.is_staff());

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (author_id = auth.uid() or public.is_staff())
  with check (author_id = auth.uid() or public.is_staff());

-- Versements : le vendeur consulte les siens.
drop policy if exists payouts_read on public.payouts;
create policy payouts_read on public.payouts
  for select to authenticated using (seller_id = auth.uid() or public.is_staff());


-- -----------------------------------------------------------------------------
-- 16. OFFRES PAR DÉFAUT
--
-- Limites reprises de src/lib/seller.ts pour rester cohérentes avec le code.
-- price_amount reste NULL : aucun prix n'est décidé ici.
-- -----------------------------------------------------------------------------
insert into public.subscription_plans
  (code, label, max_stores, max_products_per_store, commission_rate, position)
values
  ('free',           'Gratuit',           1,     50, 0.0800, 1),
  ('business',       'Business',          2,    500, 0.0600, 2),
  ('supplier',       'Fournisseur',       3,   2000, 0.0500, 3),
  ('official_brand', 'Marque officielle', 10, 10000, 0.0400, 4)
on conflict (code) do nothing;


-- -----------------------------------------------------------------------------
-- 17. VÉRIFICATION
-- -----------------------------------------------------------------------------
-- select table_name from information_schema.tables
-- where table_schema = 'public'
--   and table_name in ('categories','addresses','order_items','payments',
--                      'shipments','reviews','favorites','payouts',
--                      'subscription_plans','subscriptions','notifications')
-- order by table_name;
