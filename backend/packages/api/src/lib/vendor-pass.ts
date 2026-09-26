/*
  LE LAISSEZ-PASSER VERS LE PANNEAU VENDEUR.

  Le problème

  Le vendeur se connecte sur le site MACHÉ. Il clique « Ouvrir mon
  panneau vendeur » : le panneau Mercur, servi par le backend, lui
  redemandait ses identifiants. Deux connexions pour une seule personne,
  parce que ce sont deux adresses : la connexion du site vit sur le
  site, celle du panneau dans un cookie du backend.

  La solution

  Le site, qui a la connexion du vendeur, demande au backend un
  laissez-passer. Le navigateur l'apporte ensuite au backend, qui ouvre
  la session du panneau et y entre directement, dans la bonne boutique.

  Pourquoi pas le jeton de connexion lui-même dans l'adresse

  Une adresse traîne partout : historique du navigateur, journaux,
  en-tête Referer. Le jeton de connexion vaut des heures ; y le mettre,
  c'est le semer. Le laissez-passer, lui :

  - expire en 60 secondes ;
  - ne sert qu'une fois ;
  - est signé avec une clé DÉRIVÉE du secret du backend, et non avec le
    secret lui-même : il ne peut donc pas être présenté comme un jeton
    de connexion ordinaire, même pendant ses 60 secondes ;
  - ne porte que l'identité du membre et la boutique, déjà vérifiée par
    Mercur quand le site l'a demandé.

  Aucune bibliothèque : HMAC-SHA256 de Node, comparaison à temps
  constant.
*/

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const PASS_TTL_MS = 60_000;

/* La partie de l'identité que la session du panneau attend. */
export type PassContext = {
  actor_id: string;
  actor_type: string;
  auth_identity_id: string;
  app_metadata: Record<string, unknown>;
};

export type PassPayload = {
  ctx: PassContext;
  seller_id: string;
  exp: number;
  nonce: string;
};

const PURPOSE = "mache-passage-vendeur";

function key(secret: string) {
  return createHmac("sha256", secret).update(PURPOSE).digest();
}

function sign(body: string, secret: string) {
  return createHmac("sha256", key(secret)).update(body).digest("base64url");
}

export function issuePass(
  ctx: PassContext,
  sellerId: string,
  secret: string,
  now = Date.now()
): string {
  /*
    Les rôles sont recalculés par Mercur à chaque requête d'après
    l'appartenance à la boutique : les figer ici leur survivrait.
  */
  const { roles: _roles, ...app_metadata } = ctx.app_metadata ?? {};

  const payload: PassPayload = {
    ctx: {
      actor_id: ctx.actor_id,
      actor_type: ctx.actor_type,
      auth_identity_id: ctx.auth_identity_id,
      app_metadata,
    },
    seller_id: sellerId,
    exp: now + PASS_TTL_MS,
    nonce: randomBytes(16).toString("base64url"),
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/* Le laissez-passer s'il est intact, pour un membre, et encore valable ; sinon null. */
export function readPass(token: unknown, secret: string, now = Date.now()): PassPayload | null {
  if (typeof token !== "string" || token.length > 4096) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let payload: PassPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (typeof payload.nonce !== "string" || typeof payload.seller_id !== "string") return null;
  if (!payload.ctx || payload.ctx.actor_type !== "member" || !payload.ctx.actor_id) return null;

  return payload;
}

/*
  Une seule utilisation. La mémoire du processus suffit : le
  laissez-passer meurt en 60 secondes de toute façon, et le backend
  tourne en un seul exemplaire. S'il en avait plusieurs, un
  laissez-passer volé ne servirait au pire qu'une fois par exemplaire,
  dans la même minute.
*/
const used = new Map<string, number>();

export function consumePass(payload: PassPayload, now = Date.now()): boolean {
  for (const [nonce, exp] of used) {
    if (exp <= now) used.delete(nonce);
  }

  if (used.has(payload.nonce)) return false;

  used.set(payload.nonce, payload.exp);
  return true;
}

export function resetUsedPasses() {
  used.clear();
}
