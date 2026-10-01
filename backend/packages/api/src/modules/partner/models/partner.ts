import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : un partenaire de services (photographe, financement, transport…).

  Un partenaire n'est PAS un vendeur : il ne vend pas par le panier de
  MACHE, on le contacte directement. Il s'inscrit lui-même (statut
  « pending ») ou est ajouté par l'équipe ; rien n'est public avant
  « approved ».

  Statuts :
  - pending   : inscrit, pas encore examiné ;
  - approved  : visible sur le site ;
  - suspended : retiré du site, réversible ;
  - banned    : exclu, ne peut pas se réinscrire avec cette adresse.

  Les images sont des ADRESSES fournies par le partenaire : MACHE ne les
  héberge pas.
*/
const Partner = model.define("mache_partner", {
  id: model.id({ prefix: "ptn" }).primaryKey(),
  slug: model.text().unique(),

  name: model.text(),
  category: model.text(),
  description: model.text().nullable(),
  location: model.text().nullable(),

  logo: model.text().nullable(),
  banner: model.text().nullable(),
  website: model.text().nullable(),
  whatsapp: model.text().nullable(),
  phone: model.text().nullable(),
  facebook: model.text().nullable(),
  instagram: model.text().nullable(),

  /* Qui contacter chez MACHE-side : jamais affiché publiquement. */
  contact_name: model.text().nullable(),
  contact_email: model.text().index(),

  status: model.enum(["pending", "approved", "suspended", "banned"]).default("pending"),
  status_reason: model.text().nullable(),
  /* « self » = inscrit seul ; « admin » = ajouté par l'équipe. */
  source: model.enum(["self", "admin"]).default("self"),
});

export default Partner;
