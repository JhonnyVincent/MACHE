-- -----------------------------------------------------------------------------
-- 0006 — IDENTITÉ DES AGENTS MACHÉ
--
-- Pourquoi cette table
--
-- La page publique /verify-agent existe pour qu'un client puisse vérifier,
-- sur le pas de sa porte, que la personne qui se présente est bien un agent
-- MACHÉ. Elle lisait jusqu'ici deux agents inventés dans un fichier du code.
-- Une vérification d'identité qui répond « oui » à partir de données fausses
-- est pire que pas de vérification du tout : elle sert de caution.
--
-- Cette migration donne à cette page une source réelle.
--
-- Sûreté
--
-- - additive : aucune table, colonne ou politique existante n'est modifiée ;
-- - idempotente : elle peut être rejouée sans effet de bord ;
-- - aucun agent n'est inséré. La table naît vide, et /verify-agent répondra
--   « code inconnu » tant que l'équipe MACHÉ n'y aura pas enregistré ses
--   agents réels.
-- -----------------------------------------------------------------------------

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(id) on delete set null,

  -- Le code figure sur la carte de l'agent ; c'est lui que saisit le client.
  code text not null unique,

  -- Nom d'affichage recopié ici volontairement : la vérification publique ne
  -- doit pas avoir besoin de lire public.users, qui contient des données
  -- privées (e-mail, adresse). Ce qui est public reste dans cette table.
  display_name text not null,
  photo_url text,
  zone text,
  phone_public text,

  status text not null default 'pending',
  valid_until date,
  official_badge boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.agent_profiles drop constraint if exists agent_profiles_status_check;
  alter table public.agent_profiles add constraint agent_profiles_status_check check (
    status in ('pending','active','suspended','revoked')
  );
end $$;

create index if not exists agent_profiles_user_idx   on public.agent_profiles(user_id);
create index if not exists agent_profiles_status_idx on public.agent_profiles(status);


-- -----------------------------------------------------------------------------
-- POLITIQUES D'ACCÈS
--
-- La lecture est publique : c'est le but même d'un annuaire de vérification,
-- et la table ne contient que ce qu'un agent montre déjà en se présentant.
-- L'écriture reste au personnel MACHÉ : un agent ne se déclare pas actif
-- lui-même, sans quoi le badge ne vaut plus rien.
-- -----------------------------------------------------------------------------
alter table public.agent_profiles enable row level security;

drop policy if exists agent_profiles_read on public.agent_profiles;
create policy agent_profiles_read on public.agent_profiles
  for select using (true);

drop policy if exists agent_profiles_write on public.agent_profiles;
create policy agent_profiles_write on public.agent_profiles
  for all using (public.is_staff()) with check (public.is_staff());


-- -----------------------------------------------------------------------------
-- VÉRIFICATION
-- -----------------------------------------------------------------------------
-- select code, display_name, status, valid_until from public.agent_profiles
-- order by created_at;


-- -----------------------------------------------------------------------------
-- ADRESSE DE LIVRAISON VUE PAR L'AGENT ASSIGNÉ
--
-- Le problème
--
-- La table addresses porte la politique `addresses_own` : seul le
-- propriétaire d'une adresse la lit. Un agent chargé de livrer un colis ne
-- peut donc pas lire l'adresse où le porter, et l'espace agent afficherait
-- « adresse non renseignée » sur toutes ses courses.
--
-- Pourquoi une fonction plutôt qu'une sous-requête
--
-- Une politique qui ferait `exists (select 1 from orders join shipments ...)`
-- exécuterait cette sous-requête avec les droits de l'agent : les politiques
-- de orders et de shipments s'y appliqueraient à leur tour, et le test
-- retournerait faux. C'est le même piège que les politiques d'administration
-- qui interrogent public.users. La fonction ci-dessous est SECURITY DEFINER :
-- elle répond à une question précise — « cette adresse est-elle celle d'une
-- course assignée à ce compte ? » — sans ouvrir quoi que ce soit d'autre.
--
-- Cette politique s'ajoute à `addresses_own` sans la remplacer : les
-- politiques permissives se cumulent. Aucun accès existant n'est retiré.
-- -----------------------------------------------------------------------------
create or replace function public.agent_sees_address(target_address uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shipments s
    join public.orders o on o.id = s.order_id
    where s.agent_id = auth.uid()
      and o.shipping_address_id = target_address
      -- Une course close n'a plus de raison de donner accès à une adresse.
      and s.status in ('assigned', 'picked_up', 'in_transit')
  );
$$;

revoke all on function public.agent_sees_address(uuid) from public, anon;
grant execute on function public.agent_sees_address(uuid) to authenticated;

drop policy if exists addresses_assigned_agent on public.addresses;
create policy addresses_assigned_agent on public.addresses
  for select using (public.agent_sees_address(id));


-- -----------------------------------------------------------------------------
-- VÉRIFICATION COMPLÉMENTAIRE
-- -----------------------------------------------------------------------------
-- select polname from pg_policies where tablename = 'addresses';
--   attendu : addresses_own, addresses_assigned_agent
