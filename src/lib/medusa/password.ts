/*
  MOT DE PASSE OUBLIÉ — côté site.

  Deux appels au backend, pour les trois espaces (client, vendeur,
  administration) :

  1. demander un lien : le backend envoie un e-mail si un compte existe,
     et répond pareil s'il n'en existe pas ;
  2. choisir un nouveau mot de passe avec le jeton reçu dans le lien.

  CE QUE LE SITE NE DIT JAMAIS

  Si une adresse a un compte. « Aucun compte pour cette adresse »
  apprendrait à n'importe qui qui est client ou vendeur chez MACHÉ — un
  annuaire offert aux arnaqueurs. Le message est donc le même dans les
  deux cas : « si un compte existe, un e-mail est parti ».

  Le vendeur a un seul compte pour MACHÉ et pour le panneau Mercur :
  un nouveau mot de passe choisi ici vaut pour les deux.
*/

import { medusaBackendUrl } from "./config";
import { backendTimeoutSignal, isTimeout, TIMEOUT_MESSAGE } from "./timeout";

export const RESET_ACTORS = ["customer", "member", "user"] as const;
export type ResetActor = (typeof RESET_ACTORS)[number];

export function isResetActor(value: unknown): value is ResetActor {
  return typeof value === "string" && (RESET_ACTORS as readonly string[]).includes(value);
}

/* Où se reconnecter une fois le mot de passe changé. */
export const LOGIN_PAGE: Record<ResetActor, string> = {
  customer: "/compte/connexion",
  member: "/dashboard/seller/connexion",
  user: "/dashboard/admin/connexion",
};

export const SPACE_LABEL: Record<ResetActor, string> = {
  customer: "votre compte client",
  member: "votre espace vendeur (le même compte sert au panneau vendeur)",
  user: "l'administration de MACHÉ",
};

/* Le même seuil qu'à l'inscription : en dessous, un mot de passe ne protège plus rien. */
export const MIN_PASSWORD = 8;

type Outcome = { ok: true } | { ok: false; reason: string; expired?: boolean };

async function post(
  path: string,
  body: unknown,
  token?: string
): Promise<{ status: number } | { status: 0; reason: string }> {
  const url = medusaBackendUrl();

  if (!url) {
    return { status: 0, reason: "Le site n'est pas relié au backend (NEXT_PUBLIC_MEDUSA_BACKEND_URL absente)." };
  }

  try {
    const response = await fetch(`${url}${path}`, {
      method: "POST",
      signal: backendTimeoutSignal(),
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return { status: response.status };
  } catch (error) {
    return { status: 0, reason: isTimeout(error) ? TIMEOUT_MESSAGE : "Le serveur n'a pas répondu. Réessayez dans un instant." };
  }
}

export async function requestPasswordReset(actor: ResetActor, email: string): Promise<Outcome> {
  const identifier = email.trim().toLowerCase();

  if (!identifier.includes("@")) return { ok: false, reason: "Cette adresse e-mail n'est pas valable." };

  const result = await post(`/auth/${actor}/emailpass/reset-password`, { identifier });

  if (result.status === 0) return { ok: false, reason: (result as { reason: string }).reason };

  if (result.status === 429) {
    return {
      ok: false,
      reason:
        "Plusieurs liens ont déjà été demandés pour cette adresse. Attendez une heure, et regardez dans vos courriers indésirables : le premier y est peut-être.",
    };
  }

  /*
    201 : le backend a traité la demande — qu'un compte existe ou non,
    c'est volontaire. Tout le reste est une vraie panne.
  */
  if (result.status >= 200 && result.status < 300) return { ok: true };

  return { ok: false, reason: `La demande n'a pas pu être traitée (erreur ${result.status}). Réessayez dans un instant.` };
}

export async function setNewPassword(
  actor: ResetActor,
  token: string,
  password: string
): Promise<Outcome> {
  if (password.length < MIN_PASSWORD) {
    return { ok: false, reason: `Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.` };
  }

  if (!token) return { ok: false, expired: true, reason: "Ce lien est incomplet." };

  const result = await post(`/auth/${actor}/emailpass/update`, { password }, token);

  if (result.status === 0) return { ok: false, reason: (result as { reason: string }).reason };

  if (result.status >= 200 && result.status < 300) return { ok: true };

  /*
    401 : lien expiré (15 minutes), déjà utilisé, ou abîmé par un
    logiciel de messagerie qui l'a coupé en deux. Dans les trois cas, le
    remède est le même — en demander un autre — et c'est ce qu'on dit.
  */
  if (result.status === 401 || result.status === 400) {
    return {
      ok: false,
      expired: true,
      reason: "Ce lien n'est plus valable : il a expiré (15 minutes) ou a déjà servi. Demandez-en un nouveau.",
    };
  }

  return { ok: false, reason: `Le mot de passe n'a pas pu être changé (erreur ${result.status}). Réessayez dans un instant.` };
}
