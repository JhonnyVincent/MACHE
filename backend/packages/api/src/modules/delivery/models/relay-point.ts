import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : un point de retrait.

  Un LIEU, pas une personne

  C'est la distinction qui justifie ce modèle séparé. Un point de
  retrait est une adresse où un colis attend : une boutique, une
  pharmacie, un dépôt. La personne qui le tient — un agent MACHÉ —
  peut être absente, remplacée, ou tenir deux points. Si le point
  n'était qu'un attribut de l'agent, un colis deviendrait introuvable
  le jour où l'agent change, et personne ne saurait dire où il est.

  `agent_customer_id` dit donc qui tient le point AUJOURD'HUI. Il peut
  être vide : un point existe même sans tenant désigné, et les colis
  qui y sont déposés ne bougent pas pour autant.

  Ce que la fiche publie, et ce qu'elle ne publie pas

  L'adresse et les horaires sont publics : c'est là qu'un client doit
  se rendre. Le téléphone ne l'est que si MACHÉ l'a renseigné exprès
  dans `phone_public` — le numéro personnel du tenant n'a rien à faire
  sur une page publique.

  `active` plutôt qu'une suppression : un point fermé garde les
  livraisons qui y ont transité. Effacer la ligne rendrait illisibles
  des livraisons déjà faites.
*/
const RelayPoint = model.define("mache_relay_point", {
  id: model.id({ prefix: "rel" }).primaryKey(),

  name: model.text(),
  /* Le code court que le client voit : « PAP-DEL-02 ». */
  code: model.text().unique(),

  department: model.text().index(),
  commune: model.text().nullable(),
  address: model.text(),
  landmark: model.text().nullable(),

  phone_public: model.text().nullable(),
  opening_hours: model.text().nullable(),

  /* Qui le tient aujourd'hui. Vide est un état normal. */
  agent_customer_id: model.text().index().nullable(),

  active: model.boolean().default(true),
  note: model.text().nullable(),
});

export default RelayPoint;
