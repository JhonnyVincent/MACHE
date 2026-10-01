import { cookies } from "next/headers";
import { CURRENCY_COOKIE, convert, getRates, isDisplayCurrency } from "@/lib/fx";

/*
  « ≈ 19 USD » sous un prix, si le visiteur a choisi une devise
  d'affichage différente de celle de facturation. Rien sans taux du jour.
*/
export async function ApproxPrice({
  amount,
  currency,
  className = "",
}: {
  amount: number | null;
  currency: string | null;
  className?: string;
}) {
  if (amount === null) return null;

  const wanted = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const billed = (currency || "HTG").toUpperCase();

  if (!isDisplayCurrency(wanted) || wanted === billed) return null;

  const rates = await getRates();
  const value = rates ? convert(amount, billed, wanted, rates) : null;

  if (value === null) return null;

  return (
    <span
      className={className || "text-sm text-[var(--mache-muted)]"}
      title="Estimation indicative au taux du jour. Vous payez dans la devise de la boutique."
    >
      ≈ {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value < 100 ? 2 : 0 }).format(value)} {wanted}
    </span>
  );
}
