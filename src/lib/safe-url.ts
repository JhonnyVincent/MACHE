/*
  Assainissement des adresses venant de l'extérieur.

  Trois endroits de MACHÉ acceptent une adresse fournie par quelqu'un
  d'autre que le code : le paramètre `next` d'une connexion, le
  `return_to` d'un ajout au panier, et les liens qu'un vendeur pose dans
  sa vitrine. Les trois étaient traités à la légère.

  Le piège de `startsWith("/")`

  Il paraît suffisant, et il ne l'est pas : « //evil.example » commence
  bien par une barre oblique, mais c'est une adresse PROTOCOL-RELATIVE que
  le navigateur résout en « https://evil.example ». Un lien de connexion
  contenant ?next=//evil.example renvoyait donc l'utilisateur sur un site
  tiers juste après qu'il a saisi son mot de passe — le décor idéal d'un
  hameçonnage, puisque la personne vient de faire confiance à MACHÉ.

  Le piège de `javascript:`

  Un vendeur remplit librement le lien du bouton de sa vitrine. Sans
  contrôle, `javascript:...` s'exécute au clic, dans la session du
  visiteur : c'est une faille stockée, déclenchée par n'importe quel
  client de la boutique.
*/

/*
  Chemin interne, pour une redirection après une action.

  N'accepte qu'un chemin commençant par une seule barre oblique. Toute
  adresse absolue, protocol-relative ou à schéma exotique est remplacée
  par le repli.
*/
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;

  const path = value.trim();

  if (!path.startsWith("/")) return fallback;

  /* « // » et « /\ » : protocol-relative, donc externe. */
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;

  /* Un retour chariot permettrait d'injecter un en-tête. */
  if (/[\r\n]/.test(path)) return fallback;

  return path;
}

/*
  Lien affichable, posé par un vendeur dans sa vitrine.

  Autorise un chemin interne, une ancre, http(s), mailto: et tel: —
  c'est-à-dire ce qu'un commerçant a de bonnes raisons de vouloir. Tout le
  reste, `javascript:` et `data:` en tête, est refusé.
*/
export function safeLinkHref(value: unknown, fallback = "#"): string {
  if (typeof value !== "string") return fallback;

  const href = value.trim();

  if (!href || /[\r\n]/.test(href)) return fallback;

  if (href.startsWith("#")) return href;

  if (href.startsWith("/")) {
    return href.startsWith("//") || href.startsWith("/\\") ? fallback : href;
  }

  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;

  return fallback;
}

/*
  Adresse d'image.

  Seul http(s) est accepté : `data:` permet d'embarquer un SVG, et un SVG
  affiché depuis la même origine peut exécuter du script.
*/
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const src = value.trim();

  if (!src || /[\r\n]/.test(src)) return null;

  return /^https?:\/\//i.test(src) ? src : null;
}
