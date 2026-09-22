import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : une demande de devis.

  Une demande porte sur UN article et UNE boutique. C'est la forme que
  prend la demande réelle en Haïti — « combien pour 200 sacs de riz chez
  vous ? » — et non un panier à plusieurs vendeurs. Un devis à plusieurs
  boutiques n'aurait d'ailleurs pas de sens : il n'y a personne pour
  l'arbitrer, chaque vendeur fixe son prix seul.

  `seller_id` est une colonne, pas un lien Medusa. Un lien sert à
  traverser le graphe des modules ; ici on ne traverse rien, on filtre :
  « les demandes de cette boutique ». La colonne suffit, et elle
  n'attache pas le module des devis au module des vendeurs.

  `quoted_amount` reste vide tant que le vendeur n'a pas répondu. Zéro
  aurait été un prix — « gratuit » — et le client l'aurait lu comme tel.

  `access_token` permet à un acheteur sans compte de relire sa demande.
  Sans lui, un devis demandé en trente secondes exigerait une
  inscription pour en lire la réponse, et la plupart des demandes
  seraient perdues.
*/
const Quote = model.define("mache_quote", {
  id: model.id({ prefix: "quo" }).primaryKey(),
  display_id: model.autoincrement(),

  /* À qui la demande est adressée. */
  seller_id: model.text().index(),

  /* Renseigné quand l'acheteur était connecté ; sinon la demande est anonyme. */
  customer_id: model.text().nullable(),
  access_token: model.text(),

  buyer_name: model.text(),
  buyer_email: model.text(),
  buyer_phone: model.text().nullable(),
  buyer_company: model.text().nullable(),

  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  /*
    Le titre est recopié, pas seulement référencé : un produit
    supprimé ou renommé ne doit pas rendre illisible une demande déjà
    envoyée. Un devis est une pièce d'échange entre deux personnes, il
    garde ce qui a été demandé.
  */
  product_title: model.text(),
  quantity: model.number(),

  message: model.text().nullable(),

  status: model
    .enum(["pending", "answered", "accepted", "declined", "expired"])
    .default("pending"),

  seller_message: model.text().nullable(),
  quoted_amount: model.bigNumber().nullable(),
  currency_code: model.text().nullable(),
  valid_until: model.dateTime().nullable(),
});

export default Quote;
