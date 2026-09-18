-- =============================================================================
-- Politiques RLS de la table `users`
--
-- Le script « ROLES + PERMISSIONS + WIDGETS » active RLS sur user_roles,
-- admin_permissions, site_widgets, site_theme et partner_vendors — mais il
-- ne définit aucune politique pour `public.users` elle-même.
--
-- Or toutes ses politiques d'administration sont écrites ainsi :
--
--   exists (
--     select 1 from public.users
--     where users.id = auth.uid() and users.role = 'super_admin'
--   )
--
-- Cette sous-requête s'exécute avec les droits de l'utilisateur connecté :
-- elle est donc elle-même soumise au RLS de `users`. Si `users` a RLS actif
-- sans politique de lecture, la sous-requête ne renvoie rien, et :
--
--   - toutes ces vérifications d'administration renvoient false, même pour
--     un super_admin — plus personne ne gère les widgets ni le thème ;
--   - l'application ne peut pas lire son propre rôle, et retombe sur
--     l'espace acheteur.
--
-- C'est le symptôme « je n'arrive pas à entrer côté vendeur, sans savoir
-- pourquoi ».
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. CONSTAT — à exécuter en premier, avant toute modification
-- -----------------------------------------------------------------------------
select relname as "table", relrowsecurity as "rls_actif"
from pg_class
where relnamespace = 'public'::regnamespace
  and relname = 'users';

select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'users';

-- rls_actif = false            -> rien à faire ici, la cause est ailleurs
--                                 (voir supabase/diagnostic.sql)
-- rls_actif = true, 0 policy   -> c'est le problème : passer à l'étape 2
-- rls_actif = true, des policy -> lire leur colonne `qual` pour vérifier
--                                 qu'une lecture `auth.uid() = id` existe


-- -----------------------------------------------------------------------------
-- 2. LECTURE DE SA PROPRE FICHE
--    Le minimum vital : sans elle, personne ne connaît son propre rôle.
-- -----------------------------------------------------------------------------
create policy "Lecture de sa propre fiche"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "Modification de sa propre fiche"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 3. FIABILISER LES VÉRIFICATIONS DE RÔLE  (recommandé)
--
--    Lire `users` depuis la politique d'une autre table est fragile : le
--    résultat dépend du RLS de `users`, et une politique de `users` qui
--    interrogerait `users` provoquerait une récursion infinie.
--
--    Une fonction SECURITY DEFINER lit le rôle en dehors du RLS. C'est le
--    motif recommandé par Supabase.
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


-- -----------------------------------------------------------------------------
-- 4. RÉÉCRITURE DES POLITIQUES AVEC LA FONCTION  (optionnel)
--
--    Exemple pour les widgets ; le même remplacement vaut pour site_theme,
--    user_roles, admin_permissions et partner_vendors.
--
--    À n'appliquer qu'après avoir vérifié l'étape 1 : remplacer une
--    politique se fait en la supprimant d'abord, donc pendant un court
--    instant la table n'est plus protégée par celle-ci.
-- -----------------------------------------------------------------------------
-- drop policy if exists "Admins can manage widgets" on public.site_widgets;
--
-- create policy "Admins can manage widgets"
-- on public.site_widgets
-- for all
-- to authenticated
-- using (public.current_user_role() in ('super_admin', 'admin'))
-- with check (public.current_user_role() in ('super_admin', 'admin'));


-- -----------------------------------------------------------------------------
-- 5. VÉRIFICATION FINALE
--    À exécuter connecté avec le compte concerné, depuis l'application et
--    non depuis l'éditeur SQL : l'éditeur contourne le RLS et renverrait un
--    résultat trompeur.
-- -----------------------------------------------------------------------------
-- select auth.uid(), public.current_user_role();
