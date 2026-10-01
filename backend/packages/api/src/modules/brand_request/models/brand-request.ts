import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : une demande d'autorisation de revendre un produit de marque.

  Un revendeur demande à une marque le droit de proposer un de ses
  produits. La marque accepte (le revendeur est alors autorisé sur le
  produit) ou refuse. Le titre du produit est recopié : la demande reste
  lisible si le produit est renommé ou retiré.
*/
const BrandRequest = model.define("mache_brand_request", {
  id: model.id({ prefix: "brq" }).primaryKey(),
  brand_seller_id: model.text().index(),
  reseller_seller_id: model.text().index(),
  product_id: model.text(),
  product_title: model.text(),
  message: model.text().nullable(),
  status: model.enum(["pending", "approved", "declined"]).default("pending"),
});

export default BrandRequest;
