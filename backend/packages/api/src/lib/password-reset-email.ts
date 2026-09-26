/*
  LE MESSAGE « NOUVEAU MOT DE PASSE », ET SON LIEN.

  Séparé de l'abonné pour se tester sans Medusa : c'est ici que se
  décide ce qu'on envoie, et c'est ici que se logent les deux fautes
  graves possibles.

  1. UN LIEN QUI POINTE AILLEURS QUE CHEZ MACHÉ

  L'adresse du site vient de la configuration (STOREFRONT_URL), jamais
  de la requête. Un en-tête de requête se falsifie : construit à partir
  de lui, le lien pourrait mener chez un tiers qui recevrait le jeton
  et prendrait le compte.

  2. UN ACTEUR INCONNU

  Seuls trois espaces ont une page pour choisir un nouveau mot de
  passe : client, vendeur, administration. Pour tout autre type de
  compte, on n'envoie rien plutôt qu'un lien vers une page qui ne sait
  pas le traiter.

  Le lien est valable 15 minutes et ne sert qu'une fois : c'est Medusa
  qui le garantit, et le message le dit, pour qu'un lien expiré ne
  passe pas pour une panne.
*/

export const RESET_ACTORS = ["customer", "member", "user"] as const;
export type ResetActor = (typeof RESET_ACTORS)[number];

export function isResetActor(value: unknown): value is ResetActor {
  return typeof value === "string" && (RESET_ACTORS as readonly string[]).includes(value);
}

/* Ce que chaque espace s'appelle, pour que le destinataire sache de quel compte il s'agit. */
const SPACE: Record<ResetActor, string> = {
  customer: "votre compte client",
  member: "votre espace vendeur",
  user: "l'administration de MACHÉ",
};

export function storefrontBase(): string | null {
  const raw = String(process.env.STOREFRONT_URL || "").trim().replace(/\/+$/, "");

  return /^https?:\/\/[^\s/]+/.test(raw) ? raw : null;
}

export function resetLink(
  actor: unknown,
  token: unknown,
  base: string | null = storefrontBase()
): string | null {
  if (!base || !isResetActor(actor)) return null;
  if (typeof token !== "string" || !token) return null;

  const query = new URLSearchParams({ acteur: actor, token });

  return `${base}/mot-de-passe/nouveau?${query.toString()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resetEmail(actor: ResetActor, link: string) {
  const space = SPACE[actor];
  const safe = escapeHtml(link);

  return {
    subject: "Choisir un nouveau mot de passe — MACHÉ",
    text: [
      "Bonjour,",
      "",
      `Quelqu'un — probablement vous — a demandé un nouveau mot de passe pour ${space}.`,
      "",
      "Pour le choisir, ouvrez ce lien :",
      link,
      "",
      "Il est valable 15 minutes et ne sert qu'une fois.",
      "",
      "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable, et personne n'a accès à votre compte.",
      "",
      "— MACHÉ",
    ].join("\n"),
    html: `<!doctype html>
<html lang="fr"><body style="font-family:Arial,sans-serif;color:#0f1111;line-height:1.5;max-width:520px">
<p>Bonjour,</p>
<p>Quelqu'un — probablement vous — a demandé un nouveau mot de passe pour ${escapeHtml(space)}.</p>
<p><a href="${safe}" style="display:inline-block;background:#c8102e;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Choisir un nouveau mot de passe</a></p>
<p style="font-size:13px;color:#565959">Le bouton ne s'affiche pas ? Copiez ce lien dans votre navigateur :<br><span style="word-break:break-all">${safe}</span></p>
<p style="font-size:13px;color:#565959">Ce lien est valable 15 minutes et ne sert qu'une fois.</p>
<p style="font-size:13px;color:#565959">Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable, et personne n'a accès à votre compte.</p>
<p>— MACHÉ</p>
</body></html>`,
  };
}
