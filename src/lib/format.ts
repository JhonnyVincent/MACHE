/* Formatage partagé entre les pages publiques et les composants client. */

const htgFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatPrice(value: number) {
  return `${htgFormatter.format(Number(value) || 0)} HTG`;
}
