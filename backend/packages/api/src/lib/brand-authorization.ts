/*
  LA MARQUE AUTORISE SES REVENDEURS.

  Sur MACHE, un produit est partagé : plusieurs boutiques peuvent le
  vendre, chacune par sa propre offre. Mercur n'autorise une boutique à
  créer une offre que si elle est sur la LISTE D'AUTORISATION du produit
  (`product_seller`). C'est ce qui permet à une marque de choisir ses
  revendeurs.

  QUI EST « LA MARQUE » D'UN PRODUIT

  La boutique notée dans `product.metadata.brand_seller_id`. Elle est
  posée à la première autorisation, et seulement si :
  - la boutique a déclaré le profil « marque » ;
  - elle est la SEULE boutique autorisée sur ce produit (donc celle qui
    l'a créé, avant tout revendeur).
  Ensuite elle ne change plus : une boutique autorisée plus tard ne peut
  pas se déclarer marque du produit pour autoriser à son tour d'autres
  revendeurs.
*/

export const BRAND_KEY = "brand_seller_id";

type Raw = Record<string, unknown>;

export type ProductRow = {
  id: string;
  title: string;
  metadata: Raw | null;
  sellers: Array<{ id: string; name?: string | null }>;
};

/* Verdict sur un produit pour la boutique `me` : « owned », « claimable » ou « no ». */
export function brandStatus(product: ProductRow, me: string): "owned" | "claimable" | "no" {
  const owner = (product.metadata ?? {})[BRAND_KEY];

  if (typeof owner === "string" && owner) return owner === me ? "owned" : "no";

  const sellers = product.sellers ?? [];

  return sellers.length === 1 && sellers[0].id === me ? "claimable" : "no";
}
