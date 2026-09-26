/*
  QUAND L'ARGENT D'UNE VENTE DEVIENT CELUI DU VENDEUR.

  Deux signatures, et une date limite.

  LES DEUX SIGNATURES

  Le vendeur (ou l'agent, ou le point de retrait) prouve qu'il a REMIS
  le colis : il saisit le code que seul l'acheteur détient. Puis
  l'acheteur constate qu'il a bien REÇU. Les deux ensemble libèrent le
  versement.

  Une seule ne suffit pas, et pour deux raisons opposées. Le seul
  constat du vendeur, c'est lui qui se paie sur sa propre parole — et
  le code, s'il protège beaucoup, ne protège pas de tout (un colis
  remis vide passe le code). Le seul constat de l'acheteur laisserait
  un vendeur honnête payé par quelqu'un qui n'a rien reçu.

  LA DATE LIMITE, ET CE QU'ELLE COÛTE

  Un acheteur qui ne revient jamais sur le site — parce qu'il est
  content, parce qu'il a oublié, parce qu'il a changé de téléphone —
  garderait sinon l'argent du vendeur indéfiniment. C'est le cas le
  plus fréquent, et de loin : la plupart des gens ne confirment rien.

  Passé le délai, la somme part donc sans la seconde signature.

  Ce que cela coûte, et il faut le dire franchement : un acheteur
  floué qui se réveille au seizième jour se plaint après que l'argent
  est parti. MACHÉ devra alors le récupérer auprès du vendeur, ou le
  perdre. C'est le prix de ne pas prendre en otage l'argent de tous les
  vendeurs honnêtes pour le silence de la plupart des acheteurs.

  POURQUOI DEUX DÉLAIS

  Quinze jours quand le colis circule en Haïti : la remise est déjà
  constatée par le code, le délai ne couvre qu'une contestation.

  Vingt-cinq jours quand un transporteur extérieur s'en charge —
  typiquement Haïti vers l'étranger. Là, aucun code MACHÉ n'est saisi :
  le transporteur ne connaît pas MACHÉ. Le seul constat possible est
  celui de l'acheteur, le colis met des semaines, et le compte à
  rebours part de l'expédition et non d'une remise que personne
  n'observe. Un délai court paierait le vendeur avant que le colis
  n'ait seulement passé la douane.

  LA DATE EST ÉCRITE SUR LA LIVRAISON, PAS RECALCULÉE

  `payout_due_at` est posée une fois et conservée. Si ces délais
  changent un jour, les livraisons déjà en cours gardent celui qu'on
  leur a annoncé : personne ne doit voir son argent reculer de dix
  jours parce qu'une constante a bougé pendant que son colis roulait.
*/

export type DeliveryMethod = "seller" | "agent" | "relay" | "carrier";

export const PAYOUT_DELAY_DAYS = {
  /* En Haïti, remise constatée par le code. */
  standard: 15,
  /* Transporteur extérieur : le colis met des semaines à arriver. */
  carrier: 25,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function payoutDelayDays(method: DeliveryMethod): number {
  return method === "carrier"
    ? PAYOUT_DELAY_DAYS.carrier
    : PAYOUT_DELAY_DAYS.standard;
}

export function payoutDueAt(method: DeliveryMethod, from: Date): Date {
  return new Date(from.getTime() + payoutDelayDays(method) * DAY_MS);
}

function at(value: Date | string | null | undefined): number | null {
  if (!value) return null;

  const time = value instanceof Date ? value.getTime() : Date.parse(value);

  return Number.isFinite(time) ? time : null;
}

export type ReleaseContext = {
  method: DeliveryMethod;
  /* Le code a été saisi par celui qui a remis le colis. */
  handoverConfirmedAt: Date | string | null;
  /* L'acheteur a constaté sa réception. */
  customerConfirmedAt: Date | string | null;
  /* La date au-delà de laquelle on libère sans la seconde signature. */
  payoutDueAt: Date | string | null;
  /* La boutique est-elle sous gel pour fraude ? */
  frozen: boolean;
  now?: Date;
};

/*
  LA DÉCISION, ÉCRITE UNE SEULE FOIS.

  Toute route qui touche au versement passe par ici. Recopiée, cette
  règle aurait divergé — et c'est l'écart qu'une fraude emprunte.
*/
export function payoutStateFor(
  context: ReleaseContext
): "held" | "releasable" {
  /*
    LE GEL L'EMPORTE SUR TOUT LE RESTE.

    Ni les deux signatures ni l'expiration du délai ne relâchent
    l'argent d'une boutique sous enquête. C'est tout l'intérêt du gel :
    la fraude passe précisément par des livraisons en bonne et due
    forme.
  */
  if (context.frozen) return "held";

  const now = (context.now ?? new Date()).getTime();

  const handover = at(context.handoverConfirmedAt);
  const customer = at(context.customerConfirmedAt);
  const due = at(context.payoutDueAt);

  /*
    Un transporteur extérieur ne saisit pas de code MACHÉ. Le constat
    de l'acheteur est alors la SEULE preuve qui existe : l'exiger en
    double reviendrait à ne jamais payer ces vendeurs-là.
  */
  if (context.method === "carrier") {
    if (customer !== null) return "releasable";

    return due !== null && now >= due ? "releasable" : "held";
  }

  /* Les deux signatures. */
  if (handover !== null && customer !== null) return "releasable";

  /*
    Le délai ne court qu'à partir de la remise. Sans elle, rien ne
    prouve que le colis ait seulement quitté le vendeur, et laisser le
    temps payer à sa place ouvrirait la fraude la plus simple : créer
    une livraison, ne rien faire, attendre quinze jours.
  */
  if (handover === null) return "held";

  return due !== null && now >= due ? "releasable" : "held";
}
