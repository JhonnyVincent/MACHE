/*
  Le numéro WhatsApp d'une boutique.

  Rangé dans `seller.metadata.whatsapp`, que le vendeur écrit lui-même.
  C'est un choix du vendeur : le numéro devient PUBLIC dès qu'il l'enregistre
  (le bouton « Commander sur WhatsApp » le contient), et l'écran le dit
  avant. Sans numéro enregistré, aucun bouton n'apparaît.

  Format : chiffres seulement, indicatif compris, sans « + » (c'est ce
  qu'attend wa.me). Un numéro haïtien à 8 chiffres reçoit l'indicatif 509.
*/

export function normalizeWhatsapp(input: unknown): string | null {
  if (typeof input !== "string") return null;

  let digits = input.replace(/\D/g, "");

  /* « 00 » devant l'indicatif : écriture internationale ancienne. */
  if (digits.startsWith("00")) digits = digits.slice(2);

  /* Numéro local haïtien : 8 chiffres. */
  if (digits.length === 8) digits = `509${digits}`;

  /* Longueur E.164 : au plus 15 chiffres, et rien de crédible sous 10. */
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}

export function readSellerWhatsapp(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  return normalizeWhatsapp((metadata ?? {})["whatsapp"]);
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
