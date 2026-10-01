/*
  Conversion indicative des prix, au taux du jour.

  Ce que c'est

  Le prix facturé reste celui du vendeur, dans sa devise (gourdes). Un
  visiteur peut choisir de voir, EN PLUS, l'équivalent en dollars ou en
  euros : « ≈ 19 USD ». C'est une aide à la lecture, pas une facture :
  l'écran le dit.

  D'où vient le taux

  D'un service public de taux de change (open.er-api.com, sans clé),
  relu toutes les 6 heures. Si le service ne répond pas, il n'y a PAS de
  taux : la conversion n'est tout simplement pas affichée. On n'invente
  jamais un taux de repli — un taux figé sans date se lirait comme le
  taux du jour.

  L'adresse du service se change par FX_API_URL (tests, ou autre
  fournisseur au même format).
*/

export const DISPLAY_CURRENCIES = ["HTG", "USD", "EUR", "CAD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const CURRENCY_COOKIE = "mache_currency";

export type Rates = {
  /* Combien d'unités de chaque devise pour 1 USD. */
  perUsd: Record<string, number>;
  /* Date de la mise à jour du service, telle qu'il la donne. */
  updatedAt: string | null;
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === "string" && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

export async function getRates(): Promise<Rates | null> {
  const url = process.env.FX_API_URL || "https://open.er-api.com/v6/latest/USD";

  try {
    const response = await fetch(url, {
      next: { revalidate: 6 * 60 * 60 },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { rates?: Record<string, unknown>; time_last_update_utc?: unknown };

    const perUsd: Record<string, number> = {};

    for (const code of DISPLAY_CURRENCIES) {
      const value = Number(data.rates?.[code]);
      if (Number.isFinite(value) && value > 0) perUsd[code] = value;
    }

    /* Sans la devise de base (USD) et sans gourde, rien de fiable à calculer. */
    if (!perUsd.USD || !perUsd.HTG) return null;

    return {
      perUsd,
      updatedAt: typeof data.time_last_update_utc === "string" ? data.time_last_update_utc : null,
    };
  } catch {
    return null;
  }
}

export function convert(amount: number, from: string, to: string, rates: Rates): number | null {
  const a = rates.perUsd[from.toUpperCase()];
  const b = rates.perUsd[to.toUpperCase()];

  if (!a || !b || !Number.isFinite(amount)) return null;

  return (amount / a) * b;
}
