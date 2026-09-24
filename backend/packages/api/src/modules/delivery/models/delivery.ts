import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : l'acheminement d'une commande, et la preuve qu'elle est arrivée.

  Quatre façons d'acheminer, et pourquoi elles ne se confondent pas

  - `seller` : le vendeur livre lui-même. C'est le cas le plus courant
    en Haïti pour une vente de quartier, et c'est celui qui a le plus
    besoin d'une preuve : personne d'autre que les deux intéressés
    n'était là.
  - `agent` : un agent MACHÉ prend le colis et le porte. MACHÉ répond
    de cette personne, puisque MACHÉ l'a habilitée.
  - `relay` : le colis attend dans un point de retrait, et le client
    vient le chercher. Un point de retrait est un LIEU, pas une
    personne — une même personne peut tenir un point, et un point peut
    changer de tenant sans que les colis déposés changent d'adresse.
    Les confondre rendrait impossible de dire où est un colis quand
    l'agent est absent.
  - `carrier` : un transporteur extérieur. MACHÉ ne le pilote pas, ne
    répond pas de lui, et ne prétend pas savoir où en est le colis :
    on garde le numéro de suivi et le lien du transporteur, pour que le
    client suive chez lui. Afficher un statut MACHÉ sur un colis que
    MACHÉ ne transporte pas serait inventer une information.

  Le code de livraison

  Tiré au hasard, montré AU SEUL ACHETEUR, et saisi par celui qui
  livre au moment de la remise. C'est ce sens-là qui en fait une
  preuve : pour saisir le code, il faut avoir rencontré l'acheteur.

  Dans l'autre sens — un code détenu par le vendeur et saisi par
  l'acheteur — il ne prouverait rien du tout : le vendeur n'aurait
  qu'à le dicter au téléphone.

  Le code est stocké en clair, comme le jeton de lecture des devis,
  parce que l'acheteur doit pouvoir le relire sur sa page. Ce que cela
  coûte : quelqu'un qui lirait la base pourrait confirmer des
  livraisons. Ce que cela protège : le cas réel, un vendeur qui
  marquerait « livré » sans avoir livré. Aucune route vendeur ni agent
  ne renvoie jamais ce champ.

  `payout_state` — pourquoi il est ici

  Parce que la preuve de livraison et l'autorisation de payer sont la
  même décision. MACHÉ n'encaisse pas encore ; le jour où il encaissera,
  ce champ dira ce qui peut être reversé. En attendant il enregistre ce
  qui est dû, ce qui est déjà une information utile au vendeur.
*/
const Delivery = model.define("mache_delivery", {
  id: model.id({ prefix: "dlv" }).primaryKey(),
  display_id: model.autoincrement(),

  order_id: model.text().index(),
  seller_id: model.text().index(),

  /* Renseigné quand l'acheteur a un compte ; sinon la page se lit au jeton. */
  customer_id: model.text().nullable(),
  access_token: model.text(),

  method: model.enum(["seller", "agent", "relay", "carrier"]),

  /*
    L'agent chargé du colis, quand il y en a un. C'est un identifiant
    de CLIENT : un agent MACHÉ est un client à qui s'ajoute une
    fonction, il n'a pas de compte séparé.
  */
  agent_customer_id: model.text().index().nullable(),

  /* Le point de retrait où le colis attend, pour la méthode `relay`. */
  relay_point_id: model.text().index().nullable(),

  /* Le transporteur extérieur. MACHÉ n'en suit pas l'acheminement. */
  carrier_name: model.text().nullable(),
  tracking_number: model.text().nullable(),
  tracking_url: model.text().nullable(),

  /* À qui et où. Recopié, pour qu'un carnet d'adresses modifié plus tard
     ne réécrive pas une livraison déjà faite. */
  recipient_name: model.text().nullable(),
  recipient_phone: model.text().nullable(),
  recipient_address: model.text().nullable(),
  recipient_department: model.text().nullable(),

  /*
    Le code de remise, et les essais de saisie. Le compteur n'est pas
    décoratif : sans lui, un code à six caractères se trouve en essayant.
  */
  code: model.text(),
  code_attempts: model.number().default(0),

  status: model
    .enum([
      "pending",
      "assigned",
      "in_transit",
      "ready_for_pickup",
      "delivered",
      "failed",
      "cancelled",
    ])
    .default("pending"),

  /*
    Qui a constaté la remise.

    `customer` n'est là que pour la méthode `carrier` : un transporteur
    extérieur ne connaît pas MACHÉ et ne saisira jamais notre code. Le
    seul constat possible est alors celui de l'acheteur, et il vaut ce
    qu'il vaut — c'est pour cela qu'on garde qui a confirmé, et pas
    seulement qu'une confirmation a eu lieu. Une preuve déclarative et
    une preuve de remise ne pèsent pas pareil dans un litige.
  */
  confirmed_by: model.enum(["seller", "agent", "customer", "admin"]).nullable(),
  confirmed_at: model.dateTime().nullable(),
  confirmation_note: model.text().nullable(),

  failure_reason: model.text().nullable(),

  payout_state: model
    .enum(["held", "releasable", "released"])
    .default("held"),
});

export default Delivery;
