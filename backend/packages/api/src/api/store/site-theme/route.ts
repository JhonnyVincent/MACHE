/*
  ROUTE PUBLIQUE : l'habillage actif du site.

  Le storefront l'interroge à chaque rendu pour savoir s'il doit peindre
  la page aux couleurs de Noël, d'Octobre rose, ou aux siennes.

  Pourquoi la réponse contient les COULEURS et pas seulement la clé

  Pour que les deux moitiés du site ne puissent pas diverger. Si le
  storefront gardait sa propre table de correspondance, ajouter un thème
  demanderait deux déploiements coordonnés — et entre les deux, une clé
  connue d'un côté et pas de l'autre donnerait une page sans couleurs.

  Pourquoi c'est sans danger

  Ces valeurs ne viennent pas d'un formulaire : elles sont écrites dans
  le code, dans une liste fermée. L'administrateur ne choisit qu'une
  clé, et une clé inconnue retombe sur l'habillage habituel.

  L'emplacement du réglage

  Le champ libre de la boutique Medusa. Ce n'est pas un module de plus à
  migrer pour un seul mot, et le champ est déjà protégé : seule
  l'administration peut l'écrire.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { themeOf } from "../../mache-themes";

export const THEME_FIELD = "mache_theme";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let stored: unknown = null;

  /*
    Une lecture qui échoue ne casse pas la page : elle rend
    l'habillage habituel. Un site qui refuserait de s'afficher parce
    qu'il n'a pas pu savoir s'il devait être vert à Noël aurait des
    priorités inversées.
  */
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "metadata"],
    });

    const store = (stores ?? [])[0] as { metadata?: Record<string, unknown> } | undefined;

    stored = store?.metadata?.[THEME_FIELD] ?? null;
  } catch {
    stored = null;
  }

  const theme = themeOf(stored);

  return res.json({
    theme: {
      key: theme.key,
      label: theme.label,
      banner: theme.banner,
      variables: theme.variables,
    },
  });
}

/* Réexporté pour que la route d'administration écrive dans le même champ. */
export const STORE_MODULE = Modules.STORE;
