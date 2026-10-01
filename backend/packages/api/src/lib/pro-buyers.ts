/*
  LES ACHETEURS PROFESSIONNELS : ce que le code partage.

  Un acheteur professionnel (hôtel, école, restaurant, entreprise, ONG…)
  voit les grossistes et peut leur demander un devis, sans vendre
  lui-même sur MACHE. Les vendeurs le peuvent d'office.

  - la DEMANDE vit dans le champ libre du client (`mache_pro_request`) :
    c'est lui qui l'écrit, et ça n'engage que lui ;
  - l'ACCORD est l'appartenance au groupe marqué PRO_MARKER, que seule
    l'administration modifie ;
  - un REFUS est noté par l'administration (`mache_pro_refused`) ; un
    client qui l'effacerait ne ferait que redevenir « en attente ».

  Fonctions pures ici, pour se tester sans Medusa.
*/

export const PRO_TYPES = ["hotel", "restaurant", "ecole", "entreprise", "ong", "commerce", "autre"] as const;

export type ProType = (typeof PRO_TYPES)[number];

export const PRO_TYPE_LABELS: Record<ProType, string> = {
  hotel: "Hôtel",
  restaurant: "Restaurant",
  ecole: "École",
  entreprise: "Entreprise",
  ong: "ONG / association",
  commerce: "Commerce",
  autre: "Autre",
};

export type ProRequest = {
  organisation: string;
  type: ProType;
  city: string;
  phone: string;
  note: string | null;
  requested_at: string;
};

export type ProStatus = "approved" | "pending" | "refused" | "none";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/* Une demande lisible, ou la raison de son refus. */
export function parseProRequest(
  body: Record<string, unknown>,
  now = new Date()
): { ok: true; value: ProRequest } | { ok: false; reason: string } {
  const organisation = clean(body.organisation, 120);
  const type = clean(body.type, 20) as ProType;
  const city = clean(body.city, 80);
  const phone = clean(body.phone, 40);
  const note = clean(body.note, 500) || null;

  if (organisation.length < 2) return { ok: false, reason: "Indiquez le nom de votre organisation." };
  if (!PRO_TYPES.includes(type)) return { ok: false, reason: "Choisissez le type d'organisation." };
  if (city.length < 2) return { ok: false, reason: "Indiquez votre ville." };
  if (phone.replace(/\D/g, "").length < 7) return { ok: false, reason: "Indiquez un numéro de téléphone joignable." };

  return { ok: true, value: { organisation, type, city, phone, note, requested_at: now.toISOString() } };
}

export function readProRequest(metadata: Record<string, unknown> | null | undefined): ProRequest | null {
  const raw = (metadata ?? {}).mache_pro_request;

  if (!raw || typeof raw !== "object") return null;

  const request = raw as Record<string, unknown>;
  const type = String(request.type ?? "") as ProType;

  if (typeof request.organisation !== "string" || !PRO_TYPES.includes(type)) return null;

  return {
    organisation: request.organisation,
    type,
    city: String(request.city ?? ""),
    phone: String(request.phone ?? ""),
    note: typeof request.note === "string" ? request.note : null,
    requested_at: String(request.requested_at ?? ""),
  };
}

/*
  Le statut : le groupe d'abord (c'est lui qui fait foi), puis le refus,
  puis la demande.
*/
export function proStatus(inGroup: boolean, metadata: Record<string, unknown> | null | undefined): ProStatus {
  if (inGroup) return "approved";

  const request = readProRequest(metadata);

  if (!request) return "none";

  const refused = (metadata ?? {}).mache_pro_refused;

  if (refused && typeof refused === "object") {
    const at = String((refused as Record<string, unknown>).at ?? "");

    /* Un refus plus récent que la demande tient ; une nouvelle demande le remplace. */
    if (at && at >= request.requested_at) return "refused";
  }

  return "pending";
}
