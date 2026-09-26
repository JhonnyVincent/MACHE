/*
  LIMITER LES TENTATIVES DE CONNEXION.

  LE SCÉNARIO QU'ON FERME

  Ce n'est pas le piratage sophistiqué, c'est le plus banal et le plus
  fréquent : quelqu'un essaie des mots de passe en boucle. Sans limite,
  une machine en essaie des milliers par minute, et un mot de passe
  ordinaire tombe. C'est ainsi que la plupart des comptes tombent — pas
  par une faille, par de la patience automatisée.

  POURQUOI ICI ET PAS DANS LE SITE

  Parce que le formulaire du site n'est pas le seul chemin. Qui connaît
  l'adresse du backend appelle `/auth/...` directement et ne voit jamais
  le formulaire. Une limite posée dans le site ne protégerait que les
  gens honnêtes. Posée ici, elle couvre les deux.

  CE QU'ELLE COMPTE, ET CE QU'ELLE NE COMPTE PAS

  Seuls les ÉCHECS. Une connexion réussie remet le compteur à zéro :
  sinon un vendeur qui travaille toute la journée finirait bloqué par
  son propre usage.

  La clé associe l'adresse IP ET l'identifiant visé. L'IP seule
  bloquerait tout un cybercafé — ou tout un opérateur mobile haïtien
  derrière une même sortie — parce qu'une personne s'est trompée.
  L'identifiant seul permettrait à un attaquant de bloquer le compte du
  patron de MACHÉ à volonté, ce qui est une attaque en soi.

  SA LIMITE, ÉCRITE PLUTÔT QUE TUE

  Le compteur vit dans la mémoire du processus. Il repart à zéro à
  chaque redéploiement, et deux instances du backend compteraient
  chacune de leur côté. Ce n'est donc pas un rempart contre une attaque
  distribuée et patiente ; c'est ce qui transforme « des milliers
  d'essais par minute » en « huit par quart d'heure », ce qui suffit à
  rendre l'attaque sans objet. Un vrai plafond partagé demanderait
  Redis, que cette installation n'a pas.
*/

import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

/* Huit essais par quart d'heure. Large pour une personne, inutile pour une machine. */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

/*
  Plafond du nombre de clés retenues. Sans lui, un attaquant qui varie
  l'adresse visée à chaque essai ferait grossir cette table jusqu'à
  épuiser la mémoire du backend — il aurait transformé une protection
  en panne.
*/
const MAX_KEYS = 10_000;

type Bucket = { count: number; resetAt: number };

const attempts = new Map<string, Bucket>();

/*
  L'adresse de l'appelant. Derrière l'hébergement, la vraie adresse est
  dans `x-forwarded-for` ; on prend la PREMIÈRE, celle du client, les
  suivantes étant les relais. Tronquée : une valeur fabriquée ne doit
  pas pouvoir servir de clé sans fin.
*/
function clientIp(req: MedusaRequest): string {
  const header = req.headers["x-forwarded-for"];

  const raw = Array.isArray(header) ? header[0] : header;

  const first = (raw ?? "").split(",")[0]?.trim();

  return (first || req.socket?.remoteAddress || "inconnu").slice(0, 64);
}

/* L'identifiant visé, quand le corps en porte un. */
function target(req: MedusaRequest): string {
  const body = (req.body ?? {}) as { email?: unknown };

  return typeof body.email === "string"
    ? body.email.trim().toLowerCase().slice(0, 120)
    : "";
}

function sweep(now: number) {
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt <= now) attempts.delete(key);
  }

  /*
    Toujours trop plein après nettoyage : la table est sous pression.
    On la vide plutôt que de la laisser grandir — perdre des compteurs
    est moins grave que de faire tomber le backend.
  */
  if (attempts.size > MAX_KEYS) attempts.clear();
}

export function throttleLogin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = Date.now();

  sweep(now);

  const key = `${clientIp(req)}|${target(req)}`;

  const bucket = attempts.get(key);

  if (bucket && bucket.resetAt > now && bucket.count >= MAX_ATTEMPTS) {
    const seconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("Retry-After", String(seconds));

    return res.status(429).json({
      message: `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(seconds / 60)} minute(s). Si ce n'est pas vous, votre mot de passe est visé : changez-le.`,
    });
  }

  /*
    On observe la RÉPONSE plutôt que de compter à l'entrée : c'est le
    seul moment où l'on sait si l'essai a échoué. Compter à l'entrée
    punirait les connexions réussies.
  */
  res.on("finish", () => {
    const failed = res.statusCode === 401 || res.statusCode === 400;

    const current = attempts.get(key);

    if (!failed) {
      /* Réussite : le compteur repart de zéro. */
      attempts.delete(key);
      return;
    }

    if (current && current.resetAt > Date.now()) {
      current.count += 1;
      return;
    }

    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  });

  return next();
}

/* Pour les tests : l'état ne doit pas fuir d'un cas à l'autre. */
export function resetLoginThrottle() {
  attempts.clear();
}

export const LOGIN_THROTTLE = { MAX_ATTEMPTS, WINDOW_MS };
