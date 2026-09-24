/*
  PAGE : le profil vendeur « Marque officielle ».

  Ce qu'elle promettait

  « Campagnes sponsorisées », « Publicité : sponsorisez vos produits
  dans les zones importantes de Maché », « Analytics premium », «
  Support prioritaire », « ⭐ 4.9 / 5 ». Rien de tout cela n'existe :
  MACHÉ n'a pas de régie publicitaire, pas de tableau de statistiques
  côté vendeur, pas de file de support prioritaire, et la note était
  affichée sur une boutique qui n'existe pas.

  Deux tarifs étaient annoncés — « Business : sur devis » et « Premium :
  contrat » — alors que la page de tarifs dit 120 à 300 € par mois. Deux
  pages du même site donnaient deux prix différents pour la même chose.

  Ce qu'elle dit maintenant

  Ce que le profil marque donne réellement aujourd'hui, le prix lu
  depuis le même fichier que /sell/tarifs (il ne peut donc plus diverger),
  et une section « ce qui n'est pas encore là » — parce qu'une marque
  qui s'engage sur 120 € par mois doit savoir ce qu'elle n'achète pas.

  La maquette de boutique a disparu

  Elle utilisait le logo de MACHÉ comme avatar d'une marque inventée,
  « Marque Soleil ». Le même défaut avait déjà été signalé sur /sell.
*/

import Link from "next/link";
import { TARIFS, billingLine, htgFromEur, formatHtg, EUR_TO_HTG_DATE, COMMISSION_RATE_REDUCED } from "@/lib/tarifs";

export const metadata = {
  title: "Marque officielle · Vendre sur MACHÉ",
  description:
    "Le profil vendeur destiné aux marques : boutique identifiée, commission réduite, abonnement mensuel.",
};

const tarif = TARIFS.find((item) => item.profile === "marque")!;

/*
  Ce qui est en place. Chaque ligne correspond à un écran ou à un champ
  qui existe dans le produit ; aucune ne décrit une intention.
*/
const REEL: [string, string][] = [
  [
    "Boutique identifiée comme marque officielle",
    "Votre profil vendeur porte la mention marque, visible sur votre boutique et dans le catalogue.",
  ],
  [
    "Badge vérifié",
    "Accordé par MACHÉ après contrôle de vos documents. Il ne s'achète pas : l'abonnement ne le déclenche pas.",
  ],
  [
    "Vitrine personnalisable",
    "Bannière, logo, présentation et mise en avant de vos produits, depuis l'éditeur de vitrine.",
  ],
  [
    "Commission réduite",
    `${COMMISSION_RATE_REDUCED} % sur vos ventes au lieu du taux standard, parce que vous payez déjà un abonnement mensuel.`,
  ],
  [
    "Demandes de devis",
    "Vos acheteurs professionnels vous adressent une demande de devis ; vous répondez avec un prix et une date de validité.",
  ],
  [
    "Plusieurs personnes dans la boutique",
    "Vos collaborateurs accèdent à la boutique avec des droits distincts.",
  ],
];

/*
  Ce qui n'est pas là. Cette liste est le cœur de la page : c'est elle
  qui empêche l'abonnement d'être vendu sur un malentendu.
*/
const PAS_ENCORE: string[] = [
  "Aucune régie publicitaire : on ne peut pas sponsoriser un produit sur MACHÉ.",
  "Aucun tableau de statistiques côté vendeur : la mesure d'audience n'est pas encore ouverte.",
  "Aucune file de support prioritaire : les demandes passent par le même canal que les autres vendeurs.",
  "MACHÉ n'encaisse pas encore les paiements : l'acheteur règle le vendeur, et la commission est facturée ensuite.",
];

const ETAPES: [string, string][] = [
  ["Créer le compte", "Vous ouvrez une boutique comme n'importe quel vendeur — c'est gratuit."],
  ["Envoyer les documents", "Pièces de l'entreprise et preuve que vous représentez la marque."],
  ["Vérification par MACHÉ", "Contrôle à la main. C'est ce contrôle qui donne le badge vérifié."],
  ["Convenir du montant", "Entre 120 et 300 € selon la taille du catalogue et l'accompagnement."],
];

export default function SellMarqueOfficiellePage() {
  const min = htgFromEur(tarif.billing.kind === "subscription" ? tarif.billing.minEur : 0);
  const max = htgFromEur(tarif.billing.kind === "subscription" ? tarif.billing.maxEur : 0);

  return (
    <main className="bg-[var(--mache-bg)] pb-12">
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-[var(--mache-line)] bg-[#071f3d] text-white">
        <div className="container-page py-12 lg:py-16">
          <Link href="/sell" className="text-sm font-bold text-white/60 hover:text-white">
            ← Retour à Devenir vendeur
          </Link>

          <div className="mt-6 inline-flex rounded-[4px] border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
            Profil vendeur · Marque officielle
          </div>

          <h1 className="mt-5 max-w-3xl text-hero font-black tracking-tightest">
            Une boutique identifiée comme la vôtre.
          </h1>

          <p className="mt-5 max-w-2xl text-md leading-relaxed text-white/75">
            {tarif.audience} Le profil marque donne une boutique reconnaissable,
            une commission réduite, et l&apos;accès aux acheteurs professionnels.
          </p>

          <div className="mt-8 rounded-[10px] border border-white/15 bg-white/5 p-5 sm:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-label text-white/50">
              Abonnement mensuel
            </p>
            <p className="mt-1.5 text-3xl font-black">{billingLine(tarif.billing)}</p>
            <p className="mt-1.5 text-sm text-white/60">
              soit environ {formatHtg(min)} à {formatHtg(max)} par mois
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Conversion indicative au taux retenu par MACHÉ le {EUR_TO_HTG_DATE}.
              Le montant dû est celui en euros. La fourchette se resserre selon
              la taille de votre catalogue — c&apos;est le seul profil vendeur
              avec un abonnement.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/seller/inscription"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Ouvrir la boutique
            </Link>
            <Link
              href="/sell/tarifs"
              className="rounded-[6px] border border-white/30 px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-white hover:text-[#071f3d]"
            >
              Comparer les profils
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page py-10">
        <h2 className="text-2xl font-black tracking-tight text-[var(--mache-text)]">
          Ce que l&apos;abonnement vous donne
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Chaque ligne correspond à un écran qui existe aujourd&apos;hui sur MACHÉ.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {REEL.map(([title, text]) => (
            <div
              key={title}
              className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5"
            >
              <h3 className="text-md font-bold text-[var(--mache-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mache-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page pb-10">
        <div className="rounded-[10px] border border-[#e6d6b8] bg-[#fdf8ec] p-6">
          <h2 className="text-xl font-black tracking-tight text-[var(--mache-text)]">
            Ce qui n&apos;est pas encore là
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--mache-muted)]">
            MACHÉ démarre. Vous lisez cette liste avant de vous engager, pas après.
          </p>

          <ul className="mt-4 space-y-2.5">
            {PAS_ENCORE.map((item) => (
              <li key={item} className="flex gap-2.5 text-base leading-relaxed text-[var(--mache-text)]">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-[#a07b21]">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page pb-10">
        <h2 className="text-2xl font-black tracking-tight text-[var(--mache-text)]">
          Comment on s&apos;y prend
        </h2>

        <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map(([title, text], index) => (
            <li
              key={title}
              className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--mache-text)] text-md font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-3 text-md font-bold text-[var(--mache-text)]">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--mache-muted)]">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="mache-reveal container-page">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[var(--mache-dark)] p-6 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Vous représentez une marque ?
            </h2>
            <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/70">
              Ouvrez la boutique d&apos;abord — c&apos;est gratuit et sans
              engagement. L&apos;abonnement ne commence qu&apos;une fois le
              montant convenu ensemble.
            </p>
          </div>

          <Link
            href="/contact"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
          >
            Nous écrire
          </Link>
        </div>
      </section>
    </main>
  );
}
