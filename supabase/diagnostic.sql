-- =============================================================================
-- Diagnostic : « je n'arrive pas à entrer dans mon espace vendeur »
--
-- À exécuter dans Supabase → SQL Editor, requête par requête.
--
-- ATTENTION : l'éditeur SQL contourne les règles RLS. Une requête qui
-- fonctionne ici peut très bien être refusée à l'application. C'est
-- justement ce qui rend ce type de problème invisible.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Ma fiche utilisateur existe-t-elle, et quel est mon rôle ?
--    Remplacer l'adresse.
-- -----------------------------------------------------------------------------
select id, email, role, address_verified, created_at
from public.users
where email = 'ton@email.com';

-- Rôles vendeurs reconnus par l'application :
--   seller_individual, seller_business, supplier, official_brand
--
-- Aucune ligne ?           -> voir 2.
-- Une ligne, autre rôle ?  -> voir 3.
-- Une ligne, bon rôle,
-- mais l'app dit
-- « Profil introuvable » ? -> voir 4, c'est du RLS.


-- -----------------------------------------------------------------------------
-- 2. Créer la fiche manquante
--    L'identifiant se trouve dans Authentication → Users.
-- -----------------------------------------------------------------------------
-- insert into public.users (id, email, full_name, role)
-- values ('COLLER-L-UUID-ICI', 'ton@email.com', 'Ton Nom', 'seller_business');


-- -----------------------------------------------------------------------------
-- 3. Corriger le rôle
-- -----------------------------------------------------------------------------
-- update public.users
-- set role = 'seller_business'
-- where email = 'ton@email.com';


-- -----------------------------------------------------------------------------
-- 4. RLS : l'application peut-elle lire ma fiche ?
--
--    D'abord, regarder l'état actuel avant de changer quoi que ce soit.
-- -----------------------------------------------------------------------------
select relname as table_name, relrowsecurity as rls_active
from pg_class
where relname in ('users', 'stores', 'products', 'orders')
  and relnamespace = 'public'::regnamespace;

select schemaname, tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- -----------------------------------------------------------------------------
-- 5. Autoriser chaque utilisateur à lire sa propre fiche
--
--    À n'exécuter QUE si la requête 4 montre que `users` a rls_active = true
--    sans aucune policy `select` correspondante.
--
--    NE PAS activer RLS sur une table qui n'a encore aucune politique :
--    l'activation sans politique bloque TOUS les accès à cette table.
-- -----------------------------------------------------------------------------
-- create policy "Lecture de sa propre fiche"
-- on public.users for select
-- using (auth.uid() = id);

-- Et pour que l'utilisateur puisse modifier son propre profil :
-- create policy "Modification de sa propre fiche"
-- on public.users for update
-- using (auth.uid() = id)
-- with check (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 6. Mes boutiques sont-elles bien rattachées à mon compte ?
--    Le dashboard vendeur liste les stores via stores.owner_id.
-- -----------------------------------------------------------------------------
-- select s.id, s.name, s.slug, s.owner_id, s.is_verified
-- from public.stores s
-- join public.users u on u.id = s.owner_id
-- where u.email = 'ton@email.com';
