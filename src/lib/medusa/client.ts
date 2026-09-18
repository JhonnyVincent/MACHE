/*
  Client d'accès à l'API boutique de Medusa.

  Un seul endroit sait former une requête vers le backend : l'en-tête de
  clé publiable, la gestion du cache, et surtout le traitement des
  erreurs.

  Principe de dégradation

  Une panne du backend ne doit pas produire une page blanche. Chaque appel
  renvoie soit des données, soit une raison lisible — jamais une exception
  qui remonte jusqu'au rendu. Une marketplace dont l'accueil s'effondre
  parce qu'un rayon ne répond pas est plus grave qu'un rayon vide.

  Ce que ce client ne fait pas

  Il ne calcule aucun prix, ne décide d'aucun stock, n'applique aucune
  promotion. Tout cela est calculé par Medusa, qui en est la seule source
  de vérité. Le storefront affiche ce qu'il reçoit.
*/

import { getMedusaConfig } from "./config";

export type MedusaResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string; configured: boolean };

type FetchOptions = {
  /* Durée de cache en secondes. 0 force une lecture fraîche. */
  revalidate?: number;
  /* Étiquettes de cache, pour invalider depuis un webhook du backend. */
  tags?: string[];
};

export async function medusaFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: FetchOptions = {}
): Promise<MedusaResult<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) {
    return { ok: false, reason: configured.reason, configured: false };
  }

  const { url, key } = configured.config;

  const search = new URLSearchParams();

  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(name, String(value));
  }

  const query = search.toString();
  const target = `${url}${path}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(target, {
      headers: {
        "x-publishable-api-key": key,
        accept: "application/json",
      },
      next: {
        revalidate: options.revalidate ?? 60,
        tags: options.tags,
      },
    });

    if (!response.ok) {
      /*
        Le corps d'erreur de Medusa porte un message utile — « Missing
        required pricing context to calculate prices - region_id », par
        exemple. Le perdre condamnerait à deviner.
      */
      let detail = "";

      try {
        const body = (await response.json()) as { message?: string };
        detail = body?.message ? ` — ${body.message}` : "";
      } catch {
        /* Corps non lisible : le code HTTP suffira. */
      }

      return {
        ok: false,
        reason: `Backend commerce : ${response.status}${detail}`,
        configured: true,
      };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      ok: false,
      reason: `Backend commerce injoignable : ${message}`,
      configured: true,
    };
  }
}
