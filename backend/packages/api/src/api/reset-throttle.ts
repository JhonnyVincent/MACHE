/*
  PLAFOND DES DEMANDES DE NOUVEAU MOT DE PASSE.

  Pourquoi un plafond à part

  Le plafond de connexion compte les ÉCHECS. Une demande de nouveau mot
  de passe, elle, réussit toujours — Medusa répond « envoyé » à tout le
  monde, pour ne pas révéler qui a un compte. Elle échappait donc à
  tout plafond : on pouvait réclamer des liens en boucle pour l'adresse
  de quelqu'un et noyer sa boîte.

  La limite : trois demandes par adresse et par heure

  Largement assez pour quelqu'un qui n'a pas reçu le premier message ;
  trop peu pour en faire une arme contre une boîte.

  Pourquoi PAS de limite par adresse IP

  Elle a été écrite, puis retirée. Le site de MACHÉ appelle ce backend
  depuis son propre serveur : toutes les demandes faites sur le site
  arrivent donc de la MÊME adresse IP, celle du site. Une limite par IP
  serait devenue une limite pour le site entier — et dix demandes d'un
  malveillant auraient suffi à bloquer la récupération de mot de passe
  pour tout le monde pendant une heure. Un garde-fou qui devient une
  panne n'en est pas un.

  Ce qui reste possible, et ce que ça coûterait

  Épuiser le quota d'envoi (300 e-mails par jour chez Brevo) demande
  des centaines de comptes EXISTANTS — Medusa n'envoie rien pour une
  adresse inconnue — à raison de trois liens par heure chacun. C'est
  laborieux et visible dans les journaux. La parade complète serait que
  le site transmette au backend l'adresse IP de l'internaute, signée ;
  elle n'est pas en place.

  Le refus ne dit rien de l'existence du compte : il tombe pareil, que
  l'adresse corresponde à quelqu'un ou non.
*/

import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

const WINDOW_MS = 60 * 60 * 1000;
const PER_IDENTIFIER = 3;
const MAX_KEYS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function hit(key: string, now: number): number {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return 1;
  }

  bucket.count += 1;
  return bucket.count;
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size > MAX_KEYS) buckets.clear();
}

export function throttleResetRequests(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  /*
    L'adresse complète, pas `req.path` : selon la façon dont Express
    monte un middleware, `req.path` peut être relatif à son point de
    montage, et l'espace (client, vendeur…) n'y figurerait plus.
  */
  const match = /\/auth\/([^/?]+)\/[^/?]+\/reset-password(?:\?|$)/.exec(
    String(req.originalUrl || req.url || req.path || "")
  );

  if (!match) return next();

  const body = (req.body ?? {}) as { identifier?: unknown };
  const identifier =
    typeof body.identifier === "string" ? body.identifier.slice(0, 120) : "";

  /* Sans adresse, Medusa refusera la demande de lui-même. */
  if (!identifier) return next();

  const now = Date.now();

  if (buckets.size > MAX_KEYS) sweep(now);

  /*
    L'espace compte dans la clé : un client et un vendeur qui partagent
    une adresse ont deux comptes, chacun avec sa propre récupération.
  */
  const actor = match[1];

  if (hit(`${actor}|${identifier}`, now) > PER_IDENTIFIER) {
    return res.status(429).json({
      message:
        "Trop de demandes de nouveau mot de passe pour cette adresse. Réessayez dans une heure, et vérifiez vos courriers indésirables : le premier message y est peut-être.",
    });
  }

  return next();
}

export function resetResetThrottle() {
  buckets.clear();
}

export const RESET_THROTTLE = { WINDOW_MS, PER_IDENTIFIER };
