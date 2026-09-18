-- =============================================================================
-- MACHÉ — Migration 0003 : zones de livraison
--
-- Rôle de ce fichier :
--   Rendre les frais de livraison configurables plutôt que codés dans
--   l'application.
--
-- Aucun tarif n'est fixé ici. Les zones sont créées avec fee = NULL, ce qui
--   signifie « frais confirmés par la boutique après commande ». Le tunnel
--   d'achat l'affiche tel quel au client : c'est honnête et cela évite
--   d'annoncer un total que le client ne paiera pas.
--
--   Pour activer un tarif :
--     update public.shipping_zones set fee = 250 where slug = 'port-au-prince';
--
-- Prérequis : migration 0001.
-- Additive et rejouable.
-- =============================================================================

create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  -- NULL = tarif non défini, à confirmer par la boutique.
  fee numeric(12,2),
  currency text not null default 'HTG',
  estimated_days_min int,
  estimated_days_max int,
  is_active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shipping_zones_active_idx
  on public.shipping_zones(is_active, position);

alter table public.shipping_zones enable row level security;

drop policy if exists shipping_zones_read on public.shipping_zones;
create policy shipping_zones_read on public.shipping_zones
  for select using (is_active or public.is_staff());

drop policy if exists shipping_zones_write on public.shipping_zones;
create policy shipping_zones_write on public.shipping_zones
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Les dix départements d'Haïti, plus la diaspora. Les délais restent NULL
-- tant qu'un transporteur n'est pas intégré.
insert into public.shipping_zones (slug, label, position) values
  ('port-au-prince',  'Port-au-Prince et zone métropolitaine', 1),
  ('ouest',           'Ouest (hors zone métropolitaine)',      2),
  ('artibonite',      'Artibonite',                            3),
  ('nord',            'Nord',                                  4),
  ('nord-est',        'Nord-Est',                              5),
  ('nord-ouest',      'Nord-Ouest',                            6),
  ('centre',          'Centre',                                7),
  ('sud',             'Sud',                                   8),
  ('sud-est',         'Sud-Est',                               9),
  ('grande-anse',     'Grande-Anse',                          10),
  ('nippes',          'Nippes',                               11),
  ('diaspora',        'Hors d''Haïti (diaspora)',             12)
on conflict (slug) do nothing;

-- Le mode de retrait en boutique ne coûte rien : c'est le seul tarif que
-- l'on peut affirmer sans décision commerciale.
insert into public.shipping_zones (slug, label, fee, position) values
  ('retrait-boutique', 'Retrait en boutique', 0, 0)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Vérification
-- -----------------------------------------------------------------------------
-- select slug, label, fee, is_active from public.shipping_zones order by position;
