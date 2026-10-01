/*
  Lecture et nettoyage de ce qu'un partenaire (ou l'équipe) saisit.

  Tout ce qui sera affiché publiquement passe par ici : adresses
  limitées à http(s) (pas de « javascript: »), numéro WhatsApp en
  chiffres, longueurs bornées. Un champ invalide est refusé plutôt que
  corrigé en silence.
*/

export const PARTNER_CATEGORIES = [
  "Photographie",
  "Financement",
  "Transport et livraison",
  "Graphisme et marque",
  "Développement web",
  "Comptabilité et droit",
  "Formation",
  "Autre",
] as const;

export type PartnerFields = {
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  logo: string | null;
  banner: string | null;
  website: string | null;
  whatsapp: string | null;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  contact_name: string | null;
  contact_email: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, max);
  return cleaned ? cleaned : null;
}

/* Une adresse web : http(s) seulement ; on ajoute https:// à « monsite.com ». */
export function webUrl(value: unknown): string | null | "invalid" {
  const raw = text(value, 500);
  if (!raw) return null;

  const withScheme = /^https?:\/\//i.test(raw) ? raw : /^[a-z][a-z0-9+.-]*:/i.test(raw) ? "" : `https://${raw}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "invalid";
    if (!url.hostname.includes(".")) return "invalid";
    return url.toString();
  } catch {
    return "invalid";
  }
}

export function whatsappDigits(value: unknown): string | null | "invalid" {
  const raw = text(value, 40);
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `509${digits}`;

  return digits.length >= 10 && digits.length <= 15 ? digits : "invalid";
}

export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || "partenaire";
}

export type ParsedPartner = { ok: true; value: PartnerFields } | { ok: false; reason: string };

export function parsePartner(body: Record<string, unknown>): ParsedPartner {
  const name = text(body.name, 120);
  const category = text(body.category, 60);
  const email = (text(body.contact_email, 254) ?? "").toLowerCase();

  if (!name) return { ok: false, reason: "Indiquez le nom de l'entreprise." };
  if (!category || !(PARTNER_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, reason: "Choisissez une catégorie de service." };
  }
  if (!EMAIL.test(email)) return { ok: false, reason: "Indiquez une adresse e-mail de contact valide." };

  const urls: Record<"logo" | "banner" | "website" | "facebook" | "instagram", string | null> = {
    logo: null, banner: null, website: null, facebook: null, instagram: null,
  };

  for (const key of Object.keys(urls) as Array<keyof typeof urls>) {
    const parsed = webUrl(body[key]);
    if (parsed === "invalid") return { ok: false, reason: `L'adresse « ${key} » n'est pas valable (elle doit commencer par https://).` };
    urls[key] = parsed;
  }

  const whatsapp = whatsappDigits(body.whatsapp);
  if (whatsapp === "invalid") return { ok: false, reason: "Le numéro WhatsApp n'est pas valable." };

  return {
    ok: true,
    value: {
      name,
      category,
      description: text(body.description, 1500),
      location: text(body.location, 160),
      ...urls,
      whatsapp,
      phone: text(body.phone, 40),
      contact_name: text(body.contact_name, 120),
      contact_email: email,
    },
  };
}

/* Ce qui peut sortir sur le site public : jamais l'e-mail ni le motif interne. */
export function publicPartner(row: Record<string, unknown>) {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description ?? null,
    location: row.location ?? null,
    logo: row.logo ?? null,
    banner: row.banner ?? null,
    website: row.website ?? null,
    whatsapp: row.whatsapp ?? null,
    phone: row.phone ?? null,
    facebook: row.facebook ?? null,
    instagram: row.instagram ?? null,
  };
}
