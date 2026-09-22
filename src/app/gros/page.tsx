/*
  PAGE : acheter en gros sur MACHÉ.

  Pourquoi elle existe

  MACHÉ avait tout le nécessaire pour le commerce entre entreprises —
  demandes de devis, prix dégressifs, commande minimum par boutique —
  et aucun moyen d'y accéder. Un acheteur professionnel devait
  parcourir le catalogue article par article en espérant tomber sur un
  grossiste. Le profil « Fournisseur / Grossiste » existait, les
  vendeurs pouvaient le déclarer, et rien ne le lisait.

  Ce que cette page dit, et ne dit pas

  Le profil est une DÉCLARATION du vendeur, pas un contrôle de MACHÉ :
  `seller.metadata` est écrit par le vendeur. Cette page liste donc les
  boutiques qui se présentent comme grossistes, et l'écrit dans ces
  termes. Laisser entendre que MACHÉ les a vérifiées serait leur prêter
  une caution qui n'existe pas.

  Et quand aucune boutique ne s'est déclarée, elle le dit. Une page
  « acheter en gros » remplie d'exemples inventés ferait perdre son
  temps à un acheteur, et perdre sa confiance à MACHÉ.
*/

import Link from "next/link";
import { fetchSellers } from "@/lib/medusa/catalog";
import { readSellerProfile, isWholesaleProfile } from "@/lib/seller-profile";
import { readSellerMinimum } from "@/lib/seller-minimum";
import { formatAmount } from "@/lib/format";
import { VerifiedBadge } from "@/components/verified-badge";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acheter en gros — MACHÉ",
  description:
    "Les boutiques qui vendent en gros sur MACHÉ : demande de devis, prix dégressifs selon la quantité, commande minimum.",
};

/*
  Ce qui existe réellement pour un acheteur professionnel. Chaque ligne
  renvoie à un mécanisme en service, pas à une intention.
*/
const HOW = [
  {
    title: "Demander un devis",
    text: "Vous indiquez une quantité, le vendeur répond par un prix total et une date de validité. Rien n'est réservé, rien n'est payé tant que vous n'avez pas accepté.",
  },
  {
    title: "Prix dégressifs",
    text: "Certaines boutiques affichent leurs paliers directement sur la fiche produit : le prix unitaire baisse à partir d'une quantité. Vous les voyez avant d'acheter, pas dans le panier.",
  },
  {
    title: "Commande minimum",
    text: "Une boutique peut fixer un montant en dessous duquel elle ne vend pas. Il est annoncé sur sa page et vérifié au moment de la commande.",
  },
];

export default async function WholesalePage() {
  /*
    Assez large pour couvrir la marketplace entière : les grossistes
    sont une minorité, et les rater parce qu'on s'est arrêté aux douze
    premières boutiques viderait la page de son objet.
  */
  const result = await fetchSellers(200);

  if (!result.ok) reportOutage("acheter en gros", result.reason);

  const wholesalers = (result.ok ? result.data.sellers : []).filter((seller) =>
    isWholesaleProfile(readSellerProfile(seller.metadata))
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Acheter en gros
      </h1>

      <p className="mt-3 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
        Pour une boutique, une école, un hôtel, un chantier : sur MACHÉ,
        une commande en volume se négocie avant d&apos;être passée.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {HOW.map((item) => (
          <div
            key={item.title}
            className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
          >
            <h2 className="text-base font-bold text-[var(--mache-text)]">
              {item.title}
            </h2>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              {item.text}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Les boutiques qui vendent en gros
        </h2>

        {/*
          Dit tout de suite d'où vient cette information. « Grossiste »
          affiché sans précision se lit comme une qualification accordée
          par MACHÉ.
        */}
        <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Ces boutiques se présentent elles-mêmes comme grossistes. MACHÉ
          n&apos;a pas vérifié cette déclaration : c&apos;est le vendeur qui
          l&apos;a renseignée.
        </p>

        {!result.ok && (
          <div className="mt-4 rounded-[8px] border border-[#f2c2c8] bg-[#fdeaec] px-4 py-3 text-base text-[#b01124]">
            La liste des boutiques ne peut pas être affichée pour le moment.
            Réessayez dans quelques minutes.
          </div>
        )}

        {result.ok && wholesalers.length === 0 && (
          /*
            Aucune boutique déclarée. On le dit, et on donne les deux
            sorties utiles : chercher dans le catalogue, ou ouvrir une
            boutique de gros. Pas d'exemples inventés.
          */
          <div className="mt-4 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
            <p className="text-base font-semibold text-[var(--mache-text)]">
              Aucune boutique ne s&apos;est encore déclarée grossiste.
            </p>

            <p className="mt-1.5 text-base leading-relaxed text-[var(--mache-muted)]">
              Cela ne veut pas dire qu&apos;aucune ne vend en volume : vous
              pouvez demander un devis à n&apos;importe quelle boutique,
              depuis la fiche d&apos;un de ses articles.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-base font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              >
                Parcourir le catalogue
              </Link>

              <Link
                href="/sell/fournisseur"
                className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-base font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
              >
                Vous vendez en gros ? Ouvrez une boutique
              </Link>
            </div>
          </div>
        )}

        {wholesalers.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {wholesalers.map((seller) => {
              const minimum = readSellerMinimum(seller.metadata);

              return (
                <div
                  key={seller.id}
                  className="flex flex-col rounded-[10px] border border-[var(--mache-line)] bg-white p-4"
                >
                  <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-[var(--mache-text)]">
                    {seller.name}
                    {/*
                      Sur cette page plus qu'ailleurs : une commande en
                      gros engage des sommes qu'on ne confie pas à une
                      entreprise dont on ne sait rien.
                    */}
                    {seller.isPremium && <VerifiedBadge compact />}
                  </h3>

                  {seller.description && (
                    <p className="mt-1.5 line-clamp-3 text-base leading-relaxed text-[var(--mache-muted)]">
                      {seller.description}
                    </p>
                  )}

                  {/*
                    La commande minimum, quand la boutique en a fixé
                    une. C'est l'information qui décide si l'on va plus
                    loin — la découvrir au moment de commander fait
                    perdre son temps à tout le monde.
                  */}
                  {minimum > 0 && (
                    <p className="mt-2 text-sm font-semibold text-[var(--mache-text)]">
                      Commande minimum : {formatAmount(minimum, "HTG")}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-3 pt-4 text-base">
                    <Link
                      href={`/store/${seller.handle}`}
                      className="font-semibold text-[var(--mache-primary)] hover:underline"
                    >
                      Voir la boutique
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-[10px] border border-[var(--mache-line)] bg-white p-5">
        <h2 className="text-base font-bold text-[var(--mache-text)]">
          Un devis n&apos;est pas une commande
        </h2>

        <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-[var(--mache-muted)]">
          Demander un prix n&apos;engage à rien. Accepter une proposition ne
          déclenche aucun paiement : MACHÉ n&apos;encaisse pas, le règlement
          se convient directement avec le vendeur.{" "}
          <Link href="/legal/terms" className="font-semibold text-[var(--mache-primary)] hover:underline">
            Conditions d&apos;utilisation
          </Link>
        </p>
      </section>
    </main>
  );
}
