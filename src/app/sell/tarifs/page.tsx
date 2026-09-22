/*
  PAGE : ce que MACHÉ facture à ses vendeurs.

  Une page de tarifs est le premier endroit où une plateforme peut
  mentir sans en avoir l'air : une fonctionnalité annoncée au futur se
  lit au présent, un taux « à partir de » se lit comme le taux, et un
  prix affiché se lit comme un prix qu'on peut payer aujourd'hui.

  Cette page dit donc trois choses que la plupart taisent : ce qui est
  facturé, ce qui ne l'est pas encore parce que le chiffre n'est pas
  arrêté, et le fait qu'aucun paiement en ligne n'est raccordé — donc
  que rien n'est prélevé pour l'instant.
*/

import Link from "next/link";
import {
  TARIFS,
  COMMISSION_RATE,
  EUR_TO_HTG_DATE,
  billingLine,
  formatEur,
  formatHtg,
  htgFromEur,
} from "@/lib/tarifs";

export const metadata = {
  title: "Tarifs vendeurs — MACHÉ",
  description:
    "Ce que MACHÉ facture aux vendeurs : commission sur les ventes, abonnement pour les marques officielles, tarif sur devis pour les grossistes.",
};

export default function TarifsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Tarifs vendeurs
      </h1>

      <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
        Ouvrir une boutique sur MACHÉ ne coûte rien d&apos;avance. Vous
        payez une commission quand vous vendez. Seules les marques
        officielles ont un abonnement, et les grossistes ont un tarif
        arrêté avec eux.
      </p>

      {/*
        Le fait le plus important de la page, et celui qu'une grille de
        tarifs fait habituellement disparaître : rien n'est encaissé.
        Le placer en haut plutôt qu'en note de bas de page est la seule
        façon qu'il soit lu.
      */}
      <div className="mt-6 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-primary-soft)] px-4 py-3 text-base leading-relaxed text-[var(--mache-text)]">
        <p className="font-semibold">Aucun paiement n&apos;est prélevé aujourd&apos;hui.</p>
        <p className="mt-1">
          MACHÉ n&apos;a pas encore de prestataire de paiement raccordé :
          ni les commissions, ni les abonnements ne sont encaissés
          automatiquement. Ces tarifs décrivent ce qui s&apos;appliquera,
          et vous serez prévenu avant tout premier prélèvement.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {TARIFS.map((tarif) => (
          <div
            key={tarif.profile}
            className="flex flex-col rounded-[10px] border border-[var(--mache-line)] bg-white p-5"
          >
            <h2 className="text-xl font-bold text-[var(--mache-text)]">
              {tarif.title}
            </h2>

            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              {tarif.audience}
            </p>

            <p className="mt-4 text-2xl font-black text-[var(--mache-text)]">
              {billingLine(tarif.billing)}
            </p>

            {/*
              L'équivalent en gourdes, pour que le montant veuille dire
              quelque chose à qui vit et vend en gourdes. Il est
              présenté comme indicatif : c'est l'euro qui est dû.
            */}
            {tarif.billing.kind === "subscription" && (
              <p className="mt-1 text-sm text-[var(--mache-muted)]">
                soit environ {formatHtg(htgFromEur(tarif.billing.minEur))} à{" "}
                {formatHtg(htgFromEur(tarif.billing.maxEur))} par mois
              </p>
            )}

            {tarif.billing.kind === "commission" && (
              <p className="mt-1 text-sm text-[var(--mache-muted)]">
                Vous ne payez que lorsque vous vendez.
              </p>
            )}

            {tarif.billing.kind === "quote" && (
              <p className="mt-1 text-sm text-[var(--mache-muted)]">
                Volumes et marges varient trop pour une grille : le tarif
                s&apos;arrête avec vous.
              </p>
            )}

            <ul className="mt-4 space-y-1.5 text-base text-[var(--mache-muted)]">
              {tarif.included.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="text-[var(--mache-primary)]">
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-1">
              <Link
                href={tarif.sellPage}
                className="text-base font-semibold text-[var(--mache-primary)] hover:underline"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[var(--mache-text)]">
          La commission
        </h2>

        {COMMISSION_RATE === null ? (
          /*
            Un taux inventé sur une page publique engage MACHÉ auprès de
            chaque vendeur qui l'a lu. Dire qu'il n'est pas arrêté est
            moins vendeur, et c'est la seule chose vraie.
          */
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
            Le taux n&apos;est pas encore arrêté. Il sera publié ici, et
            communiqué à chaque vendeur déjà inscrit, avant de
            s&apos;appliquer. Aucune commission n&apos;est prélevée
            entre-temps.
          </p>
        ) : (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
            {COMMISSION_RATE} % du montant de chaque vente, hors
            livraison.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-[var(--mache-text)]">
          Pourquoi un abonnement pour les marques seulement
        </h2>

        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Un abonnement mensuel se paie avant d&apos;avoir vendu. Pour un
          commerçant qui démarre, c&apos;est un mur — et une marketplace
          dont les vendeurs n&apos;entrent pas n&apos;a rien à vendre.
          Une marque établie, elle, a un budget de présence et attend
          autre chose qu&apos;une boutique parmi d&apos;autres.
        </p>

        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Le montant dû est celui en euros. La valeur en gourdes est
          indicative, calculée à un taux retenu par MACHÉ et mis à jour
          le {EUR_TO_HTG_DATE} — ce n&apos;est pas le taux du marché du
          jour.
        </p>
      </section>

      {/*
        Ce qui n'est pas arrêté, nommé. Les pages légales de MACHÉ
        portent le même bloc : une décision en suspens qu'on ne nomme
        pas devient une décision qu'on croit prise.
      */}
      <section className="mt-8 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
        <h2 className="text-base font-bold text-[var(--mache-text)]">
          Ce qui reste à arrêter
        </h2>

        <ul className="mt-2 space-y-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
          <li>Le taux de commission, et s&apos;il varie selon le profil.</li>
          <li>
            Ce qui distingue un abonnement à {formatEur(120)} d&apos;un
            abonnement à {formatEur(300)}.
          </li>
          <li>
            Le moyen de paiement des abonnements, et la date du premier
            prélèvement.
          </li>
          <li>Le préavis en cas de changement de tarif.</li>
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-4 text-base">
        <Link
          href="/dashboard/seller/inscription"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Ouvrir ma boutique
        </Link>

        <Link
          href="/contact"
          className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
        >
          Poser une question
        </Link>
      </div>
    </main>
  );
}
