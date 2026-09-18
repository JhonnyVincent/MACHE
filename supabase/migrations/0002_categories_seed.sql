-- =============================================================================
-- MACHÉ — Migration 0002 : arborescence des catégories
--
-- Rôle de ce fichier :
--   Remplir public.categories avec l'arborescence de référence.
--
-- Cette liste est GÉNÉRÉE depuis src/lib/categories.ts : les deux ne peuvent
--   pas diverger. Si vous modifiez l'arborescence, modifiez le fichier
--   TypeScript et régénérez cette migration.
--
-- Tous les libellés d'origine du projet sont conservés : les cinq catégories
--   de la bande d'accueil, les dix de l'ancien formulaire produit et les
--   vingt-huit du menu « Plus » sont réparties en parents et sous-catégories.
--
-- Rejouable : « on conflict (slug) do update » remet libellé, parent, icône
--   et position à jour sans créer de doublon ni perdre les identifiants déjà
--   référencés par des produits.
-- =============================================================================

-- Prérequis : migration 0001 (table categories).
do $$
begin
  if to_regclass('public.categories') is null then
    raise exception 'Table categories absente. Appliquez d''abord 0001_marketplace_core.sql.';
  end if;
end $$;

-- Table temporaire : permet de résoudre les parents par leur slug, quel que
-- soit l'ordre d'insertion.
create temporary table _cat_seed (
  slug text primary key,
  label text not null,
  parent_slug text,
  icon text,
  position int not null
) on commit drop;

insert into _cat_seed (slug, label, parent_slug, icon, position) values
  ('mode', 'Mode', null, '👕', 1),
  ('vetements-femme', 'Vêtements femme', 'mode', null, 1),
  ('vetements-homme', 'Vêtements homme', 'mode', null, 2),
  ('mode-enfant', 'Mode enfant', 'mode', null, 3),
  ('chaussures-femme', 'Chaussures femme', 'mode', null, 4),
  ('chaussures-homme', 'Chaussures homme', 'mode', null, 5),
  ('chaussures-enfant', 'Chaussures enfant', 'mode', null, 6),
  ('lingerie-pyjamas', 'Lingerie et pyjamas', 'mode', null, 7),
  ('sacs-bagages', 'Sacs et bagages', 'mode', null, 8),
  ('bijoux-accessoires', 'Bijoux et accessoires', 'mode', null, 9),
  ('beaute', 'Beauté', null, '🌺', 2),
  ('beaute-sante', 'Beauté et santé', 'beaute', null, 1),
  ('maison', 'Maison', null, '🏠', 3),
  ('maison-cuisine', 'Maison et cuisine', 'maison', null, 1),
  ('meubles', 'Meubles', 'maison', null, 2),
  ('electromenagers', 'Électroménagers', 'maison', null, 3),
  ('outillage-habitat', 'Outillage et amélioration de l''habitat', 'maison', null, 4),
  ('saveurs', 'Saveurs', null, '🍲', 4),
  ('alimentation-epicerie', 'Alimentation et épicerie', 'saveurs', null, 1),
  ('artisanat', 'Artisanat', null, '🎨', 5),
  ('arts-artisanat-couture', 'Arts, artisanat et couture', 'artisanat', null, 1),
  ('electronique', 'Électronique', null, '📱', 6),
  ('telephones-accessoires', 'Téléphones et accessoires', 'electronique', null, 1),
  ('electroniques', 'Électroniques', 'electronique', null, 2),
  ('loisirs', 'Loisirs', null, '🎲', 7),
  ('jouets-jeux', 'Jouets et jeux', 'loisirs', null, 1),
  ('sports-plein-air', 'Sports et activités d''extérieur', 'loisirs', null, 2),
  ('livres-medias', 'Livres et médias', 'loisirs', null, 3),
  ('bebe', 'Bébé', null, '🍼', 8),
  ('bebe-maternite', 'Bébé et maternité', 'bebe', null, 1),
  ('automobile', 'Automobile', null, '🚗', 9),
  ('animaux', 'Animaux', null, '🐾', 10),
  ('accessoires-animaux', 'Accessoires animaux', 'animaux', null, 1),
  ('bureau-scolaire', 'Bureau et scolaire', null, '✏️', 11),
  ('services', 'Services', null, '🛠️', 12);

-- 1. Les parents d'abord.
insert into public.categories (slug, label, parent_id, icon, position, is_active)
select s.slug, s.label, null, s.icon, s.position, true
from _cat_seed s
where s.parent_slug is null
on conflict (slug) do update
  set label = excluded.label,
      icon = excluded.icon,
      position = excluded.position;

-- 2. Puis les enfants, rattachés par slug.
insert into public.categories (slug, label, parent_id, icon, position, is_active)
select s.slug, s.label, p.id, s.icon, s.position, true
from _cat_seed s
join public.categories p on p.slug = s.parent_slug
where s.parent_slug is not null
on conflict (slug) do update
  set label = excluded.label,
      parent_id = excluded.parent_id,
      position = excluded.position;

-- -----------------------------------------------------------------------------
-- Rattachement des produits existants
--
-- Les produits en base portent un libellé libre saisi via l'ancienne liste.
-- On renseigne category_id quand le libellé correspond, sans toucher à la
-- colonne `category` : le code sait encore lire les deux.
-- -----------------------------------------------------------------------------
update public.products p
set category_id = c.id
from public.categories c
where p.category_id is null
  and p.category is not null
  and lower(trim(p.category)) = lower(c.label);

-- Correspondances de l'ancienne liste du formulaire produit.
update public.products p
set category_id = c.id
from public.categories c
where p.category_id is null
  and c.slug = case lower(trim(coalesce(p.category, '')))
        when 'vêtements'    then 'mode'
        when 'vetements'    then 'mode'
        when 'alimentation' then 'saveurs'
        when 'électronique' then 'electronique'
        when 'electronique' then 'electronique'
        when 'bijoux'       then 'bijoux-accessoires'
        when 'chaussures'   then 'chaussures-femme'
        when 'accessoires'  then 'bijoux-accessoires'
        else null
      end;

-- -----------------------------------------------------------------------------
-- Vérification
-- -----------------------------------------------------------------------------
-- select c.slug, c.label, p.slug as parent, c.position
-- from public.categories c
-- left join public.categories p on p.id = c.parent_id
-- order by coalesce(p.position, c.position), p.slug nulls first, c.position;
--
-- select count(*) as produits_sans_categorie
-- from public.products where category_id is null;
