/*
  L'ÉQUIPE DE MACHE : le propriétaire, et ceux à qui il délègue.

  Une seule personne détient tout : le PROPRIÉTAIRE. Elle seule gère
  l'équipe, les boutiques, les versements et la sécurité. Elle peut
  confier des tâches précises à des membres, qui ont chacun leur espace
  et ne voient que ce qui les concerne :

  - « support »  : le suivi des clients (messages, comptes professionnels,
                   avis signalés, clients bloqués) ;
  - « contenu »  : le site et ses mises à jour (apparence, textes,
                   promotions, partenaires).

  Où c'est écrit : dans les métadonnées du compte administrateur
  (`mache_staff_role`), que seul un administrateur peut modifier. Un
  compte SANS ce champ est un propriétaire : tout compte délégué est créé
  avec son rôle par le propriétaire, jamais autrement.

  La règle s'applique côté SERVEUR, sur chaque route d'administration :
  cacher un lien ne protège rien, une requête écrite à la main passerait.
*/

export const STAFF_ROLES = ["owner", "support", "contenu"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Propriétaire",
  support: "Suivi des clients",
  contenu: "Site et mises à jour",
};

export const STAFF_METADATA_KEY = "mache_staff_role";

export function staffRole(metadata: Record<string, unknown> | null | undefined): StaffRole {
  const raw = (metadata ?? {})[STAFF_METADATA_KEY];

  return raw === "support" || raw === "contenu" ? raw : "owner";
}

/* Ce que chaque rôle délégué peut atteindre (préfixes de routes d'administration). */
const COMMON = ["/admin/users/me", "/admin/mache/two-factor"];

/* Lecture seule pour tous (chiffres de la vue d'ensemble). */
const READ_ONLY_FOR_ALL = ["/admin/orders", "/admin/sellers"];

const ALLOWED: Record<Exclude<StaffRole, "owner">, string[]> = {
  support: [
    ...COMMON,
    "/admin/mache/messages",
    "/admin/mache/pros",
    "/admin/customers",
    "/admin/customer-groups",
    "/admin/reviews",
  ],
  contenu: [
    ...COMMON,
    "/admin/mache/theme",
    "/admin/mache/policies",
    "/admin/mache/promotions",
    "/admin/mache/partners",
    "/admin/mache/apps",
    "/admin/promotions",
  ],
};

/* En lecture seule pour ces préfixes, même pour un délégué qui y a accès. */
const READ_ONLY: Record<Exclude<StaffRole, "owner">, string[]> = {
  support: [],
  contenu: ["/admin/mache/apps"],
};

function under(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function staffMayCall(role: StaffRole, method: string, path: string): boolean {
  if (role === "owner") return true;

  const clean = path.split("?")[0].replace(/\/+$/, "");

  /* Un chemin qui remonte (« .. ») ou double ses barres n'est jamais une route d'un espace délégué. */
  if (clean.includes("..") || clean.includes("//") || clean.includes("%2e") || clean.includes("%2E")) return false;

  const safe = ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

  if (safe && READ_ONLY_FOR_ALL.some((prefix) => under(clean, prefix))) return true;

  if (!ALLOWED[role].some((prefix) => under(clean, prefix))) return false;

  if (!safe && READ_ONLY[role].some((prefix) => under(clean, prefix))) return false;

  return true;
}
