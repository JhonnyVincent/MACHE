import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : une conversation entre quelqu'un et MACHÉ.

  Pourquoi ce module existe

  La page contact affichait quatre adresses en @mache.local — un
  domaine qui n'existe pas. Personne ne recevait rien. Un acheteur
  inquiet, un vendeur bloqué, quelqu'un signalant un produit
  inadmissible : tous écrivaient dans le vide.

  MACHÉ n'a pas de fournisseur d'e-mail, et n'en aura pas demain. La
  réponse n'est donc pas d'attendre un domaine : c'est que la
  conversation vive DANS le site.

  LA LIMITE QU'IL FAUT REGARDER EN FACE

  Sans e-mail, MACHÉ ne peut prévenir personne qu'une réponse est
  arrivée. Trois cas, trois sorts différents :

  - un CLIENT ou un VENDEUR connecté retrouve sa conversation dans son
    espace. Il la verra en revenant ;
  - quelqu'un SANS COMPTE ne la retrouve que par le lien privé qu'on lui
    donne à l'envoi. S'il le perd, la réponse est perdue pour lui ;
  - dans tous les cas, personne n'est notifié.

  Les écrans le disent au moment d'envoyer, pas après. Une messagerie
  qui laisse croire à une alerte qui n'existe pas est pire qu'un
  formulaire qui prévient qu'il faut revenir.

  `access_token` est donc, pour un visiteur sans compte, la seule clé
  de sa propre conversation.
*/
const Thread = model.define("mache_thread", {
  id: model.id({ prefix: "thr" }).primaryKey(),
  display_id: model.autoincrement(),

  subject: model.text(),

  /*
    Pourquoi on écrit. Sert à trier une pile de messages : un
    signalement de produit ne s'attend pas au même délai qu'une
    question sur les tarifs.
  */
  category: model
    .enum(["question", "commande", "boutique", "signalement", "autre"])
    .default("question"),

  from_name: model.text(),
  from_email: model.text(),
  from_phone: model.text().nullable(),

  /* Renseignés quand la personne était connectée. */
  customer_id: model.text().index().nullable(),
  seller_id: model.text().index().nullable(),

  /* Pour un visiteur sans compte, la seule clé de sa conversation. */
  access_token: model.text(),

  status: model.enum(["open", "answered", "closed"]).default("open"),

  /*
    Deux compteurs plutôt qu'un « lu / non lu » unique : une
    conversation peut attendre MACHÉ et le demandeur en même temps —
    l'un a répondu, l'autre n'a pas encore relu. Un drapeau unique
    devrait choisir, et se tromperait pour l'un des deux.
  */
  awaiting_mache: model.boolean().default(true),
  awaiting_sender: model.boolean().default(false),

  last_message_at: model.dateTime().nullable(),

  /* Note interne, jamais montrée au demandeur. */
  internal_note: model.text().nullable(),

  closed_at: model.dateTime().nullable(),
});

export default Thread;
