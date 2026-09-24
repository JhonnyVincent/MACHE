/*
  ROUTE : l'administrateur choisit l'habillage du site.

  Ce qu'il peut écrire : une clé, prise dans une liste fermée. Rien
  d'autre. Pas de couleur, pas de texte de bandeau, pas de feuille de
  style.

  Pourquoi si peu de liberté

  Parce que ce réglage repeint le site pour TOUS les visiteurs, et
  qu'une couleur saisie à la main ne se vérifie pas depuis un écran
  d'administration : on y voit une pastille, pas une page. Un thème
  préparé a été relu en entier — contraste du texte, des boutons, des
  bordures. Et une chaîne libre recopiée dans une variable CSS servie à
  tout le monde serait une porte ouverte.

  L'habillage habituel est toujours atteignable : c'est la clé
  `default`, et c'est aussi ce que rend toute clé inconnue.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { THEMES, THEME_KEYS, themeOf } from "../../../mache-themes";
import { THEME_FIELD } from "../../../store/site-theme/route";

type StoreService = {
  updateStores: (id: string, data: Record<string, unknown>) => Promise<unknown>;
};

async function currentStore(req: MedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "metadata"],
  });

  return (stores ?? [])[0] as
    | { id: string; metadata?: Record<string, unknown> }
    | undefined;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const store = await currentStore(req);

  const active = themeOf(store?.metadata?.[THEME_FIELD]);

  return res.json({
    active: active.key,
    themes: THEME_KEYS.map((key) => ({
      key,
      label: THEMES[key].label,
      description: THEMES[key].description,
      banner: THEMES[key].banner,
      variables: THEMES[key].variables,
    })),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { theme?: unknown };

  const key = typeof body.theme === "string" ? body.theme : null;

  /*
    Refus explicite plutôt que retour silencieux sur `default`. Un
    administrateur qui envoie une clé que le serveur ne connaît pas doit
    l'apprendre — sinon il croira avoir activé Noël et verra le site
    inchangé sans comprendre.
  */
  if (!key || !(THEME_KEYS as string[]).includes(key)) {
    return res.status(400).json({
      message: `Habillage inconnu. Les choix possibles sont : ${THEME_KEYS.join(", ")}.`,
    });
  }

  const store = await currentStore(req);

  if (!store) {
    return res.status(500).json({ message: "Aucune boutique configurée." });
  }

  const storeService = req.scope.resolve(Modules.STORE) as StoreService;

  /*
    Le champ libre est fusionné, pas remplacé : il peut contenir
    d'autres réglages, et les écraser pour changer une couleur serait
    une perte de données au nom d'une décoration.
  */
  await storeService.updateStores(store.id, {
    metadata: { ...(store.metadata ?? {}), [THEME_FIELD]: key },
  });

  return res.json({ active: key, theme: THEMES[key as keyof typeof THEMES] });
}
