/*
  L'ÉQUIPE : rôles et espaces (côté site).

  Le propriétaire voit tout. Un membre délégué ne voit que son espace.
  C'est un CONFORT d'affichage : la vraie barrière est dans le backend
  (backend/packages/api/src/lib/staff.ts, appliquée à chaque route). Les
  deux listes de rôles doivent rester identiques — un test le vérifie.
*/

export const STAFF_ROLES = ["owner", "support", "contenu"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Propriétaire",
  support: "Suivi des clients",
  contenu: "Site et mises à jour",
};

export const STAFF_ROLE_HELP: Record<Exclude<StaffRole, "owner">, string> = {
  support: "Messages, comptes professionnels, avis signalés, clients bloqués. Voit les chiffres en lecture seule.",
  contenu: "Apparence, textes, promotions, partenaires. Voit les chiffres en lecture seule.",
};

export function parseStaffRole(metadata: Record<string, unknown> | null | undefined): StaffRole {
  const raw = (metadata ?? {})["mache_staff_role"];

  return raw === "support" || raw === "contenu" ? raw : "owner";
}

/* Les pages de l'administration ouvertes à chaque rôle délégué. */
const PAGES: Record<Exclude<StaffRole, "owner">, string[]> = {
  support: [
    "/dashboard/admin/messages",
    "/dashboard/admin/pros",
    "/dashboard/admin/moderation",
    "/dashboard/admin/users",
    "/dashboard/admin/securite",
  ],
  contenu: [
    "/dashboard/admin/promotions",
    "/dashboard/admin/partenaires",
    "/dashboard/admin/applications",
    "/dashboard/admin/apparence",
    "/dashboard/admin/textes",
    "/dashboard/admin/securite",
  ],
};

export function roleMaySee(role: StaffRole, path: string): boolean {
  if (role === "owner") return true;

  const clean = path.split("?")[0].replace(/\/+$/, "");

  /* La vue d'ensemble et la connexion sont ouvertes à tous. */
  if (clean === "/dashboard/admin" || clean.startsWith("/dashboard/admin/connexion")) return true;

  return PAGES[role].some((page) => clean === page || clean.startsWith(`${page}/`));
}
