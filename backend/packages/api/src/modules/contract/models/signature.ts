import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : l'envoi d'un contrat à un marchand, et sa réponse.

  Ce qui est RECOPIÉ ici, et pourquoi c'est l'essentiel

  `contract_version` et `content_hash` sont figés au moment de l'envoi.
  Ils ne sont pas lus dans le contrat au moment où on les affiche : ils
  sont gravés ici.

  C'est la différence entre « ce marchand a signé le contrat n° 4 » —
  qui ne prouve rien, puisque le contrat n° 4 a pu changer — et « ce
  marchand a signé un texte dont l'empreinte est celle-ci ». La seconde
  affirmation se vérifie encore dans dix ans, en recalculant
  l'empreinte du texte qu'on prétend lui avoir fait signer.

  Les traces, et leur valeur réelle

  Adresse IP, navigateur, horodatage, nom saisi. Ce sont des indices
  concordants, pas une identification. Une adresse IP désigne une
  connexion, pas une personne. Les enregistrer vaut mieux que rien —
  c'est ce qu'on produit en cas de litige — mais les présenter comme
  une preuve d'identité serait mentir.

  Pourquoi le refus est un état à part entière

  Un marchand qui refuse doit pouvoir le dire, avec sa raison. Sans
  cela, le refus se confondrait avec l'oubli, et MACHÉ relancerait
  indéfiniment quelqu'un qui a déjà répondu non.
*/
const ContractSignature = model.define("mache_contract_signature", {
  id: model.id({ prefix: "csig" }).primaryKey(),
  display_id: model.autoincrement(),

  contract_id: model.text().index(),
  /* Figés à l'envoi : c'est ce qui donne sa valeur à la signature. */
  contract_version: model.number(),
  content_hash: model.text(),
  contract_title: model.text(),

  seller_id: model.text().index(),

  /* Le lien privé envoyé au marchand. */
  access_token: model.text(),

  status: model
    .enum(["sent", "viewed", "signed", "declined", "revoked"])
    .default("sent"),

  sent_at: model.dateTime().nullable(),
  viewed_at: model.dateTime().nullable(),
  signed_at: model.dateTime().nullable(),
  declined_at: model.dateTime().nullable(),

  /*
    Le nom que le signataire a tapé, et la qualité qu'il déclare. Ce
    sont ses mots : on les garde tels quels, sans les corriger, parce
    que c'est ce qu'il a affirmé être.
  */
  signer_name: model.text().nullable(),
  signer_role: model.text().nullable(),
  signer_email: model.text().nullable(),

  /* Indices concordants, pas identification. */
  signer_ip: model.text().nullable(),
  signer_user_agent: model.text().nullable(),

  decline_reason: model.text().nullable(),

  /*
    L'empreinte de l'ensemble des éléments de preuve, calculée à la
    signature. Elle scelle le tout : modifier après coup l'un des
    champs ci-dessus ne recalculerait pas cette valeur, et l'écart se
    verrait.
  */
  proof_hash: model.text().nullable(),

  /* Une échéance, quand MACHÉ en fixe une. */
  due_at: model.dateTime().nullable(),
});

export default ContractSignature;
