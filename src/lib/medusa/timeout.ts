/*
  Le temps qu'on accorde au backend commerce avant d'abandonner.

  Pourquoi ce fichier existe

  Aucun appel au backend n'avait de limite. Un serveur qui ne répond
  pas — endormi, saturé, coupé — laissait donc la requête pendre, et
  l'écran figé. C'est ce que quelqu'un décrit par « rien ne se passe,
  même pas d'erreur » : ce n'est pas une panne silencieuse, c'est une
  attente sans fin et sans message.

  Pourquoi c'est long

  Une minute paraît énorme pour une requête. Mais un hébergement
  gratuit endort le serveur après un moment sans trafic, et le réveil
  prend souvent quarante à soixante secondes. Une limite à dix secondes
  ferait échouer la première inscription de la journée, systématiquement
  — un échec bien plus déroutant qu'une attente annoncée.

  On attend donc, et on le dit : les formulaires affichent leur état
  pendant ce temps.

  Ce que ce n'est pas

  Une limite n'accélère rien. Elle garantit seulement qu'une attente
  finit, et finit par une phrase.
*/

export const BACKEND_TIMEOUT_MS = 60_000;

/*
  Un signal d'abandon, quand l'environnement sait en produire un.

  `AbortSignal.timeout` existe dans Node 18+ et dans les navigateurs
  récents. Là où il manque, on renvoie `undefined` : l'appel part sans
  limite, comme avant, plutôt que d'échouer parce qu'on a voulu le
  protéger.
*/
export function backendTimeoutSignal(ms = BACKEND_TIMEOUT_MS) {
  if (typeof AbortSignal === "undefined") return undefined;

  if (typeof AbortSignal.timeout !== "function") return undefined;

  return AbortSignal.timeout(ms);
}

/*
  Distingue un abandon d'une vraie panne réseau.

  « fetch failed » et « le serveur n'a pas répondu à temps » appellent
  deux réactions différentes : la seconde vaut la peine d'être
  réessayée, la première rarement. Les confondre ferait renoncer
  quelqu'un dont la demande serait passée au second essai.
*/
export function isTimeout(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const name = (error as { name?: unknown }).name;

  return name === "TimeoutError" || name === "AbortError";
}

export const TIMEOUT_MESSAGE =
  "Le backend commerce n'a pas répondu à temps. Il peut être en veille : réessayez dans une minute.";
