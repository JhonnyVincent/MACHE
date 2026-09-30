/*
  ANTI-SPAM DES FORMULAIRES PUBLICS.

  Inscription client, ouverture de boutique, message de contact, demande
  de devis, abonnement aux nouvelles : ce sont les portes qu'un robot
  essaie en premier, pour créer des comptes en masse ou noyer MACHE de
  messages.

  Pas de captcha. En Haïti, sur un téléphone modeste et une connexion
  lente, un captcha coûte des données, échoue souvent, et fait fuir de
  vrais clients. Trois barrières invisibles à la place :

  1. LE CHAMP PIÈGE. Un champ caché aux humains (hors écran, hors
     clavier, ignoré des lecteurs d'écran). Un robot remplit tous les
     champs qu'il trouve : s'il est rempli, l'envoi est refusé.

  2. LE DÉLAI MINIMUM. La page note l'heure à laquelle le formulaire a
     été affiché. Un humain met plusieurs secondes à le remplir ; un
     robot l'envoie dans la seconde.

  3. UN PLAFOND PAR ADRESSE IP, sur une heure. Volontairement large :
     en Haïti, Digicel et Natcom font souvent partager la même adresse
     à des milliers d'abonnés. Un plafond serré bloquerait un quartier
     entier. Celui-ci n'arrête que l'envoi en rafale.

  Le backend garde en plus ses propres plafonds par adresse e-mail et
  par boutique : ces barrières-ci s'y ajoutent, elles ne les remplacent
  pas.
*/

import { headers } from "next/headers";
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from "./anti-spam-fields";

export { HONEYPOT_FIELD, RENDERED_AT_FIELD };

/* En dessous, personne n'a pu lire et remplir le formulaire. */
export const MIN_FILL_MS = 2500;

export type SpamGate = "inscription" | "boutique" | "contact" | "devis" | "newsletter";

/* Par heure et par adresse IP. */
export const HOURLY_LIMITS: Record<SpamGate, number> = {
  inscription: 20,
  boutique: 10,
  contact: 30,
  devis: 40,
  newsletter: 30,
};

const WINDOW_MS = 60 * 60 * 1000;

/* Une adresse fabriquée à chaque envoi ne doit pas pouvoir remplir la mémoire. */
const MAX_KEYS = 20_000;

const buckets = new Map<string, { count: number; resetAt: number }>();

/*
  Le formulaire trahit-il un robot ?

  Un formulaire sans horodatage (page restée ouverte depuis avant cette
  version) n'est pas refusé pour autant : seul un horodatage présent et
  trop récent l'est.
*/
export function looksAutomated(formData: FormData, now = Date.now()): boolean {
  const trap = formData.get(HONEYPOT_FIELD);

  if (typeof trap === "string" && trap.trim() !== "") return true;

  const renderedAt = Number(formData.get(RENDERED_AT_FIELD));

  if (Number.isFinite(renderedAt) && renderedAt > 0 && now - renderedAt < MIN_FILL_MS) return true;

  return false;
}

/*
  Compte un envoi pour cette adresse et dit s'il reste sous le plafond.
  `now` et `ip` sont paramétrables pour les tests.
*/
export function allowSubmission(gate: SpamGate, ip: string, now = Date.now()): boolean {
  if (buckets.size > MAX_KEYS) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const key = `${gate}:${ip}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  bucket.count += 1;

  return bucket.count <= HOURLY_LIMITS[gate];
}

export function resetSpamCounters() {
  buckets.clear();
}

/*
  L'adresse du visiteur : la DERNIÈRE de x-forwarded-for, celle que
  l'hébergeur a constatée lui-même. La première est écrite par le
  visiteur, qui pourrait en inventer une à chaque envoi pour repartir
  de zéro. Même règle que le plafond de connexion du backend.
*/
export function clientIpFrom(forwardedFor: string | null, realIp: string | null): string {
  const last = (forwardedFor ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .pop();

  return (last || realIp || "inconnu").slice(0, 64);
}

async function currentIp(): Promise<string> {
  const list = await headers();

  return clientIpFrom(list.get("x-forwarded-for"), list.get("x-real-ip"));
}

export const SPAM_MESSAGE =
  "Votre envoi n'a pas pu être accepté. Attendez quelques secondes et réessayez ; si cela continue, écrivez-nous.";

export const LIMIT_MESSAGE =
  "Trop d'envois depuis votre connexion en peu de temps. Réessayez dans une heure.";

/*
  Le contrôle complet, à appeler en tête d'une action serveur.
  Renvoie le message à afficher, ou null si l'envoi peut passer.
*/
export async function spamCheck(gate: SpamGate, formData: FormData): Promise<string | null> {
  if (looksAutomated(formData)) return SPAM_MESSAGE;

  if (!allowSubmission(gate, await currentIp())) return LIMIT_MESSAGE;

  return null;
}
