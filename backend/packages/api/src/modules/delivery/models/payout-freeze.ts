import { model } from "@medusajs/framework/utils";

/*
  MODÈLE : le gel des versements d'une boutique.

  À QUOI ÇA SERT

  Une fraude est constatée — un vendeur qui encaisse et ne livre pas,
  des confirmations de livraison qui sentent l'arrangement, un compte
  repris par quelqu'un d'autre. Il faut pouvoir arrêter l'argent
  immédiatement, sans attendre une correction du code, et sans avoir à
  fermer la boutique dans la seconde si l'on n'est pas encore sûr.

  Geler et suspendre sont DEUX décisions distinctes. Suspendre arrête
  la vente ; geler arrête l'argent. On peut vouloir l'un sans l'autre :
  laisser une boutique honorer ses commandes en cours tout en retenant
  les sommes le temps d'une enquête, ou au contraire fermer une
  boutique dont les versements sont déjà à jour.

  CE QUE LE GEL FAIT VRAIMENT — ET LA LIMITE À NE PAS MAQUILLER

  MACHÉ n'encaisse pas : l'acheteur règle le vendeur en main propre.
  Geler n'arrache donc pas à un vendeur de l'argent qu'il a déjà dans
  la poche, et aucun écran ne doit laisser croire le contraire.

  Ce que le gel fait, et qui est réel aujourd'hui : il empêche
  `payout_state` de passer à « releasable ». Une livraison confirmée
  reste confirmée — la remise a eu lieu, c'est un fait, et le nier
  ferait perdre de l'information — mais son montant reste RETENU au
  lieu d'être porté comme dû au vendeur. Le jour où MACHÉ versera
  vraiment, ce même marqueur est la vanne, déjà fermée.

  POURQUOI UN MOTIF EST OBLIGATOIRE

  Un gel sans motif est une accusation que plus personne ne sait
  justifier six mois plus tard — ni défendre si le vendeur la conteste,
  ni lever si celui qui l'a posée est parti.

  POURQUOI ON NE SUPPRIME PAS LA LIGNE EN DÉGELANT

  Un gel levé est une décision qui a existé, et qui a retenu de
  l'argent pendant un temps. L'effacer rendrait inexplicable un écart
  de trésorerie constaté après coup. On la désactive, avec son motif de
  levée.
*/
const PayoutFreeze = model.define("mache_payout_freeze", {
  id: model.id({ prefix: "gel" }).primaryKey(),

  /* La boutique dont l'argent est retenu. */
  seller_id: model.text().index(),

  /* Obligatoire à la pose. Ce qu'on reprochera, écrit au moment où on le pense. */
  reason: model.text(),

  /*
    Qui a décidé. Un gel est une mesure grave ; savoir qui l'a posée
    fait partie de la décision, et c'est la première question posée
    quand elle est contestée.
  */
  frozen_by: model.text().nullable(),

  /*
    Actif ou levé. Deux gels successifs sur la même boutique laissent
    donc deux lignes : l'historique est l'intérêt même du modèle.
  */
  active: model.boolean().default(true),

  lifted_by: model.text().nullable(),
  lifted_reason: model.text().nullable(),
  lifted_at: model.dateTime().nullable(),
});

export default PayoutFreeze;
