/*
  Les partenaires de services enregistrés dans MACHE (inscrits seuls ou
  ajoutés par l'équipe, puis approuvés). Les partenaires « signés » à la
  main restent dans src/lib/partners.ts.

  Lecture publique : seuls les partenaires approuvés sortent du backend.
  Si le backend ne répond pas, la liste est vide plutôt qu'en erreur :
  la page Partenaires reste lisible sans eux.
*/

import { getMedusaConfig } from "./config";
import { backendTimeoutSignal } from "./timeout";
import type { Partner } from "../partners";

type Raw = Record<string, unknown>;

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function mapPartner(raw: Raw): Partner {
  const description = str(raw.description);

  return {
    name: String(raw.name ?? ""),
    does: description ?? str(raw.category) ?? "",
    href: str(raw.website),
    mediated: false,
    slug: str(raw.slug),
    category: str(raw.category),
    description,
    location: str(raw.location),
    logo: str(raw.logo),
    banner: str(raw.banner),
    whatsapp: str(raw.whatsapp),
    phone: str(raw.phone),
    facebook: str(raw.facebook),
    instagram: str(raw.instagram),
  };
}

async function get(path: string): Promise<Raw | null> {
  const configured = getMedusaConfig();

  if (!configured.ok) return null;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      signal: backendTimeoutSignal(),
      headers: { "x-publishable-api-key": configured.config.key, accept: "application/json" },
      next: { revalidate: 60, tags: ["partners"] },
    });

    if (!response.ok) return null;

    return (await response.json()) as Raw;
  } catch {
    return null;
  }
}

export async function fetchDbPartners(): Promise<Partner[]> {
  const data = await get("/store/partners");

  return Array.isArray(data?.partners) ? (data!.partners as Raw[]).map(mapPartner) : [];
}

export async function fetchDbPartner(slug: string): Promise<Partner | null> {
  const data = await get(`/store/partners/${encodeURIComponent(slug)}`);

  return data?.partner ? mapPartner(data.partner as Raw) : null;
}

export type PartnerRegistration = { ok: true } | { ok: false; reason: string };

export async function registerPartner(body: Record<string, string>): Promise<PartnerRegistration> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  try {
    const response = await fetch(`${configured.config.url}/store/partners`, {
      method: "POST",
      signal: backendTimeoutSignal(),
      headers: {
        "x-publishable-api-key": configured.config.key,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    return response.ok
      ? { ok: true }
      : { ok: false, reason: str(payload.message) ?? "Votre demande n'a pas pu être enregistrée." };
  } catch {
    return { ok: false, reason: "Le serveur n'a pas répondu. Réessayez dans un instant." };
  }
}
