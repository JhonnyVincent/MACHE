/*
  Empêcher qu'une exception d'action serveur devienne un écran d'erreur.

  Le problème

  Une action serveur qui lève rend « Application error: a server-side
  exception has occurred », avec un identifiant technique et rien
  d'autre. Sur un formulaire d'inscription, c'est le pire endroit
  possible : la personne ne sait pas si son compte a été créé, ne peut
  rien corriger, et n'a aucune raison de réessayer.

  Les couches d'appel à Medusa attrapent déjà leurs propres pannes et
  rendent une raison. Mais tout le reste peut lever : un cookie refusé,
  une dépendance qui change de comportement, une valeur inattendue. Un
  formulaire doit survivre à ça.

  Le piège

  `redirect()` et `notFound()` de Next FONCTIONNENT en levant une
  exception : c'est ainsi qu'ils interrompent le rendu. Un `catch`
  naïf les avalerait, et la redirection de fin d'inscription ne se
  produirait jamais — le compte serait créé, et la personne resterait
  sur le formulaire.

  On les reconnaît à leur `digest`, et on les relaie intactes.
*/

const CONTROL_FLOW_PREFIXES = [
  /* redirect() */
  "NEXT_REDIRECT",
  /* notFound(), et les autres interruptions HTTP de Next */
  "NEXT_HTTP_ERROR_FALLBACK",
  "NEXT_NOT_FOUND",
];

/*
  Vrai quand l'exception est un mécanisme de Next, pas une panne.
*/
export function isControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;

  if (typeof digest !== "string") return false;

  return CONTROL_FLOW_PREFIXES.some((prefix) => digest.startsWith(prefix));
}

/*
  La raison, pour le journal du serveur.

  Elle n'est jamais montrée telle quelle : un message d'exception cite
  des chemins, des noms de variables et parfois des valeurs. C'est ce
  qu'il faut à qui exploite le site, jamais à qui remplit un
  formulaire.
*/
export function reasonOf(error: unknown): string {
  if (error instanceof Error) return error.message;

  return String(error);
}
