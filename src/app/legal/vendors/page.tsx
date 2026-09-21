/*
  PAGE : règles vendeurs

  Ce qu'elle était

  Trois phrases écrites du point de vue de la plateforme — « les
  produits peuvent être auto-approuvés uniquement si toutes les
  conditions métier sont remplies » — qui ne disaient à un commerçant ni
  ce qu'on attend de lui, ni ce qui peut lui arriver.

  Ce qu'elle dit maintenant

  Ce qu'un vendeur doit faire, ce qu'il ne peut pas faire, et ce que
  MACHÉ fait en retour. Le tout au présent et à la deuxième personne :
  ces règles s'adressent à quelqu'un.

  Ce qu'elle n'invente pas

  La commission, les délais de versement et les sanctions graduées
  engagent MACHÉ commercialement. Ils se décident.
*/

import Link from "next/link";

export const metadata = {
  title: "Règles vendeurs — MACHÉ",
  description:
    "Ce qu'on attend d'une boutique sur MACHÉ, et ce que MACHÉ s'engage à faire.",
};

export default function VendorsLegalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Règles vendeurs
      </h1>

      <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
        Ce qu&apos;on attend de vous, et ce que MACHÉ fait en retour.
      </p>

      <div className="mt-8 space-y-7 text-md leading-relaxed text-[var(--mache-muted)]">
        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Décrivez ce que vous vendez, tel que c&apos;est
          </h2>

          <p className="mt-2">
            Les photos doivent être celles de l&apos;article, pas d&apos;un
            article approchant. L&apos;état — neuf, d&apos;occasion,
            reconditionné — doit être dit. Les dimensions, matières et
            quantités annoncées doivent être exactes.
          </p>

          <p className="mt-3">
            Un client déçu par une description inexacte ne revient pas, et
            il le dit. C&apos;est la première raison pour laquelle une
            boutique s&apos;éteint.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ne mettez en ligne que ce que vous pouvez livrer
          </h2>

          <p className="mt-2">
            Tenez votre stock à jour. Une commande que vous annulez faute
            de stock coûte au client sa confiance, et à vous votre
            réputation sur la place.
          </p>

          <p className="mt-3">
            Si vous demandez un montant minimum de commande, déclarez-le
            dans le profil de votre boutique : le panier de vos clients
            l&apos;affichera avant qu&apos;ils commandent, plutôt
            qu&apos;après.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui ne peut pas être vendu
          </h2>

          <p className="mt-2">
            Tout ce que la loi haïtienne interdit. Et, quoi qu&apos;en
            dise la loi : les contrefaçons, les médicaments, les armes,
            les espèces protégées, et tout ce qui se fait passer pour la
            marque d&apos;un autre.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Votre profil vous engage
          </h2>

          <p className="mt-2">
            Le profil que vous déclarez — particulier, boutique,
            grossiste, marque — s&apos;affiche sur votre vitrine. MACHÉ ne
            le vérifie pas, et vos clients en sont informés : c&apos;est
            une déclaration de votre part, pas un label.
          </p>

          <p className="mt-3">
            S&apos;en servir pour paraître ce qu&apos;on n&apos;est pas —
            se déclarer « marque » quand on revend — est un motif de
            suspension.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Les avis de vos clients
          </h2>

          <p className="mt-2">
            Seul un client qui a commandé chez vous peut vous noter.
            Personne ne peut acheter, échanger ou supprimer un avis, vous
            compris.
          </p>

          <p className="mt-3">
            Vous pouvez répondre publiquement, et c&apos;est souvent la
            meilleure réponse à un avis sévère. Votre réponse est
            signalée comme venant du vendeur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce que MACHÉ fait
          </h2>

          <ul className="mt-2 space-y-2">
            <li>
              Relit votre boutique avant de l&apos;afficher dans le
              catalogue, et vous dit où vous en êtes.
            </li>
            <li>
              Relit les avis avant publication, dans les deux sens : un
              avis injurieux ne sera pas publié non plus.
            </li>
            <li>
              Vous laisse composer votre vitrine et choisir ses couleurs,
              sans vous laisser produire une page illisible.
            </li>
            <li>
              Suspend une boutique qui trompe ses clients, vend des
              produits interdits, ou ne livre pas ce qu&apos;elle
              annonce.
            </li>
          </ul>
        </section>

        <section className="rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-4">
          <h2 className="text-lg font-bold text-[var(--mache-text)]">
            Ce qui reste à arrêter
          </h2>

          <p className="mt-2 text-base">
            Trois points relèvent d&apos;une décision de MACHÉ et seront
            précisés avant l&apos;ouverture commerciale : la commission
            retenue sur les ventes, le délai de versement de votre
            argent, et la gradation des sanctions — avertissement,
            suspension, exclusion.
          </p>

          <p className="mt-2 text-base">
            Aucun vendeur ne devrait s&apos;engager sans connaître ces
            trois chiffres. Nous préférons dire qu&apos;ils ne sont pas
            arrêtés plutôt que d&apos;en annoncer d&apos;approximatifs.
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link
          href="/dashboard/seller/inscription"
          className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
        >
          Ouvrir ma boutique
        </Link>
        <Link
          href="/contact"
          className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
        >
          Poser une question
        </Link>
      </div>

      <p className="mt-10 text-sm text-[var(--mache-muted)]">
        <Link href="/legal/terms" className="font-semibold hover:underline">
          Conditions générales
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" className="font-semibold hover:underline">
          Confidentialité
        </Link>{" "}
        ·{" "}
        <Link href="/sell" className="font-semibold hover:underline">
          Vendre sur MACHÉ
        </Link>
      </p>
    </main>
  );
}
