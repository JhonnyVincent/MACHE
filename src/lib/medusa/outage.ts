/*
  Ce qu'on dit à un visiteur quand le catalogue ne répond pas.

  Les fonctions du catalogue renvoient une raison précise :
  « Backend commerce non configuré : NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY absente(s). » C'est exactement ce
  qu'il faut à qui déploie le site.

  Ce n'est pas ce qu'il faut à qui vient acheter. Sept pages
  l'affichaient telle quelle : fiche produit, boutique, commande, et les
  quatre écrans de l'espace client. Un client y lisait le nom de
  variables d'environnement qu'il ne peut ni comprendre ni corriger.

  La raison n'est pas perdue : elle part au journal du serveur, où la
  cherchera celui qui exploite MACHÉ.

  Chaque page écrit sa propre phrase : « cette fiche », « cette
  boutique », « vos commandes ». Une formule unique et vague obligerait
  le visiteur à deviner de quoi on parle.
*/

export function reportOutage(scope: string, reason: string): void {
  console.warn(`[${scope}] ${reason}`);
}
