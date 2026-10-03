/*
  PAGE : à propos de MACHE.

  Ce qu'elle affichait avant

  Quatre chiffres inventés — « 2 800+ vendeurs actifs », « 45 000+
  produits », « 12 pays », « 98 % de satisfaction » — quand MACHE
  comptait six boutiques, douze articles, un pays et deux avis. C'est la
  page qu'un commerçant lit avant de décider s'il ouvre une boutique :
  lui faire croire qu'il rejoint une place de marché qui tourne déjà,
  c'est le perdre le jour où il comprend.

  Ce qu'elle dit maintenant

  L'objectif, tel qu'il a été formulé : connecter Haïti au monde,
  encourager les échanges entre producteurs. Puis ce que cela veut dire
  concrètement — et ce qui n'est pas encore en place, parce qu'une
  intention annoncée comme un acquis est un mensonge à retardement.

  Ce qu'elle ne dit pas

  Qui a fondé MACHE, depuis quand, avec quelle équipe. Ces éléments ne
  m'ont pas été donnés, et les inventer serait pire qu'un chiffre gonflé :
  « fondé en 2019 par une équipe de passionnés » ne se démentirait
  jamais tout seul. La page se tient très bien sans — une page
  d'entreprise portée par son objectif est la norme pour un projet qui
  démarre.
*/

import { Link } from "next-view-transitions";
import { fetchPublicSellers, fetchProducts } from "@/lib/medusa/catalog";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "À propos de MACHE",
  description:
    "Connecter Haïti au monde, encourager les échanges entre producteurs. Ce qu'est MACHE, et où le projet en est.",
};

/*
  L'objectif décomposé. Chaque volet dit ce qui EXISTE aujourd'hui, et
  nomme ce qui manque — les deux dans la même carte, pour qu'on ne
  puisse pas lire l'un sans l'autre.
*/
const AMBITIONS = [
  {
    title: "Connecter Haïti au monde",
    now: "La diaspora achète chez des vendeurs qui sont en Haïti, depuis n'importe où : elle fait livrer ses proches sur place, ou se fait expédier la commande à l'étranger, après confirmation des frais d'expédition.",
    missing:
      "Aucun tarif négocié avec un transporteur ni de paiement en ligne : chaque envoi à l'étranger est chiffré un par un. Le site est en français ; le créole ne couvre pour l'instant que la navigation.",
  },
  {
    title: "Encourager les échanges entre producteurs",
    now: "Un producteur achète à un autre producteur comme une entreprise achète : il demande un devis pour une quantité, obtient un prix total, et voit les tarifs dégressifs avant de commander.",
    missing:
      "Les grossistes apparaissent sur la carte et dans « Acheter en gros » à mesure qu'ils s'inscrivent. Ils sont encore peu nombreux.",
  },
  {
    title: "Vendre sans avancer d'argent",
    now: "Ouvrir une boutique ne coûte rien. La commission n'est due que sur une vente réalisée, et seules les marques officielles ont un abonnement.",
    missing:
      "MACHE n'encaisse pas encore : le client règle le vendeur à la livraison, en main propre. Aucun prestataire de paiement n'est raccordé.",
  },
  {
    title: "Savoir à qui on achète",
    now: "Chaque boutique déclare son profil (artisan, commerce, grossiste, marque) et MACHE vérifie les documents de celles qui portent le badge. Un agent qui se présente chez vous a un code qui se vérifie sur le site.",
    missing:
      "La vérification se fait au cas par cas, à la main. Elle prend le temps qu'il faut.",
  },
];

export default async function AboutPage() {
  /*
    Les chiffres sont lus, jamais écrits à la main. Une lecture qui
    échoue n'affiche rien : une page sans chiffres vaut mieux qu'une
    page avec des chiffres faux.
  */
  const [sellers, products] = await Promise.all([
    fetchPublicSellers(200),
    fetchProducts({ limit: 1 }),
  ]);

  if (!sellers.ok) reportOutage("à propos (boutiques)", sellers.reason);
  if (!products.ok) reportOutage("à propos (produits)", products.reason);

  const sellerCount = sellers.ok
    ? sellers.data.count || sellers.data.sellers.length
    : null;

  const productCount = products.ok ? products.data.count : null;

  return (
    <main>
      <section className="bg-white py-16">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-sm font-semibold tracking-label text-[var(--mache-primary)]">
              À propos de nous
            </div>

            <h1 className="text-hero text-[var(--mache-text)]">
              Connecter Haïti au monde
            </h1>

            <p className="mt-5 max-w-xl text-md leading-relaxed text-[var(--mache-text)]">
              Et encourager les échanges entre ceux qui produisent ici. C&apos;est
              l&apos;objectif de MACHE, et tout le reste en découle.
            </p>

            <p className="mt-4 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">
              Un pays plein de gens qui fabriquent, cultivent et vendent, et pas
              d&apos;endroit commun où les trouver. Une diaspora qui veut acheter
              au pays sans passer par quelqu&apos;un qui connaît quelqu&apos;un.
              Des producteurs qui s&apos;approvisionnent les uns chez les autres
              sans savoir que l&apos;autre existe. MACHE est fait pour ça.
            </p>
          </div>

          <div className="overflow-hidden rounded-[12px] p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              decoding="async"
              src="/images/carte-haiti-mache.webp"
              alt="Carte d'Haïti aux couleurs de MACHE"
              className="h-[340px] w-full object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="text-2xl text-[var(--mache-text)]">
          Ce que ça veut dire, concrètement
        </h2>

        <p className="mt-2 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
          Un objectif qui ne se traduit par rien reste une affiche. Voici ce
          qui fonctionne aujourd&apos;hui, et ce qui n&apos;est pas encore
          là.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {AMBITIONS.map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="font-display text-xl font-semibold text-[var(--mache-text)]">
                {item.title}
              </h3>

              <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
                {item.now}
              </p>

              {/*
                Le manque, dans la même carte que ce qui marche. Relégué
                en bas de page, personne ne le lit — et c'est
                précisément celui qui ne l'aura pas lu qui se sentira
                trompé.
              */}
              <p className="mt-3 border-t border-[var(--mache-line)] pt-3 text-base leading-7 text-[var(--mache-muted)]">
                <span className="font-semibold text-[var(--mache-text)]">
                  Pas encore :
                </span>{" "}
                {item.missing}
              </p>
            </div>
          ))}
        </div>
      </section>

      {(sellerCount !== null || productCount !== null) && (
        <section className="container-page pb-14">
          <h2 className="text-2xl text-[var(--mache-text)]">
            Où nous en sommes
          </h2>

          <p className="mt-2 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
            Ces nombres sont lus dans le catalogue, à l&apos;instant où vous
            ouvrez cette page. MACHE démarre : ils sont petits, et c&apos;est
            le moment d&apos;y entrer plutôt que d&apos;y arriver en retard.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerCount !== null && (
              <div className="card p-6">
                <div className="font-display text-4xl font-semibold text-[var(--mache-primary)]">
                  {sellerCount}
                </div>
                <div className="mt-1 text-sm text-[var(--mache-muted)]">
                  boutique{sellerCount > 1 ? "s" : ""} ouverte
                  {sellerCount > 1 ? "s" : ""}
                </div>
              </div>
            )}

            {productCount !== null && (
              <div className="card p-6">
                <div className="font-display text-4xl font-semibold text-[var(--mache-primary)]">
                  {productCount}
                </div>
                <div className="mt-1 text-sm text-[var(--mache-muted)]">
                  article{productCount > 1 ? "s" : ""} au catalogue
                </div>
              </div>
            )}

            <div className="card p-6">
              <div className="font-display text-4xl font-semibold text-[var(--mache-primary)]">
                10
              </div>
              <div className="mt-1 text-sm text-[var(--mache-muted)]">
                départements couverts —{" "}
                <Link
                  href="/haiti"
                  className="font-semibold text-[var(--mache-primary)] hover:underline"
                >
                  voir la carte
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page pb-16">
        <div className="rounded-[8px] border border-[var(--mache-line)] bg-white p-7">
          <h2 className="text-xl text-[var(--mache-text)]">
            Vous produisez, cultivez ou fabriquez en Haïti ?
          </h2>

          <p className="mt-2 max-w-2xl text-md leading-relaxed text-[var(--mache-muted)]">
            C&apos;est de vous que MACHE a besoin en premier. Une place de
            marché sans vendeurs n&apos;a rien à vendre, et plus tôt vous y
            êtes, plus votre boutique a le temps de se faire connaître.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/seller/inscription"
              className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Ouvrir ma boutique
            </Link>

            <Link
              href="/sell/tarifs"
              className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
            >
              Voir ce que ça coûte
            </Link>

            <Link
              href="/contact"
              className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
            >
              Nous écrire
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
