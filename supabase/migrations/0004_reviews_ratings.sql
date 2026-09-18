-- =============================================================================
-- MACHÉ — Migration 0004 : notes agrégées
--
-- Rôle de ce fichier :
--   Tenir à jour products.rating_average / rating_count et
--   stores.rating_average / rating_count à partir de la table reviews.
--
-- Pourquoi un déclencheur plutôt qu'un calcul à la lecture :
--   la note s'affiche sur chaque carte produit, donc sur toutes les listes du
--   site. La recalculer à chaque affichage imposerait une agrégation par
--   produit à chaque page de catalogue. Les colonnes dénormalisées existent
--   déjà (migration 0001) ; ce fichier garantit qu'elles ne mentent pas.
--
-- Prérequis : migrations 0001.
-- Additive et rejouable.
-- =============================================================================

create or replace function public.refresh_rating_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product uuid;
  target_store uuid;
begin
  -- Sur suppression, c'est l'ancienne ligne qui porte les cibles.
  target_product := coalesce(new.product_id, old.product_id);
  target_store   := coalesce(new.store_id, old.store_id);

  if target_product is not null then
    update public.products p
    set rating_average = coalesce(agg.avg_rating, 0),
        rating_count   = coalesce(agg.n, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*) as n
      from public.reviews
      where product_id = target_product and status = 'published'
    ) agg
    where p.id = target_product;
  end if;

  if target_store is not null then
    update public.stores s
    set rating_average = coalesce(agg.avg_rating, 0),
        rating_count   = coalesce(agg.n, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*) as n
      from public.reviews
      where store_id = target_store and status = 'published'
    ) agg
    where s.id = target_store;
  end if;

  return null;
end $$;

drop trigger if exists reviews_refresh_aggregates on public.reviews;
create trigger reviews_refresh_aggregates
after insert or update or delete on public.reviews
for each row execute function public.refresh_rating_aggregates();

-- -----------------------------------------------------------------------------
-- Recalcul initial
--
-- Remet à plat les compteurs de toutes les fiches, y compris celles sans
-- aucun avis : une note résiduelle serait pire qu'une absence de note.
-- -----------------------------------------------------------------------------
update public.products p
set rating_average = coalesce(agg.avg_rating, 0),
    rating_count   = coalesce(agg.n, 0)
from (
  select pr.id,
         round(avg(r.rating)::numeric, 2) as avg_rating,
         count(r.id) as n
  from public.products pr
  left join public.reviews r
    on r.product_id = pr.id and r.status = 'published'
  group by pr.id
) agg
where p.id = agg.id;

update public.stores s
set rating_average = coalesce(agg.avg_rating, 0),
    rating_count   = coalesce(agg.n, 0)
from (
  select st.id,
         round(avg(r.rating)::numeric, 2) as avg_rating,
         count(r.id) as n
  from public.stores st
  left join public.reviews r
    on r.store_id = st.id and r.status = 'published'
  group by st.id
) agg
where s.id = agg.id;

-- -----------------------------------------------------------------------------
-- Réponse du vendeur
--
-- Le vendeur doit pouvoir répondre à un avis sur sa boutique, sans pouvoir
-- modifier la note ni le texte du client. La politique restreint donc la
-- mise à jour aux propriétaires de la boutique concernée ; le contrôle des
-- colonnes réellement modifiées est fait côté serveur applicatif.
-- -----------------------------------------------------------------------------
drop policy if exists reviews_seller_reply on public.reviews;
create policy reviews_seller_reply on public.reviews
  for update to authenticated
  using (store_id is not null and public.owns_store(store_id))
  with check (store_id is not null and public.owns_store(store_id));

-- -----------------------------------------------------------------------------
-- Vérification
-- -----------------------------------------------------------------------------
-- select title, rating_average, rating_count from public.products
-- where rating_count > 0 order by rating_average desc limit 10;
