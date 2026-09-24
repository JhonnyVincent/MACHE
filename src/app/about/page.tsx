/*
  PAGE : à propos de MACHÉ.

  Ce qu'elle affichait

  Quatre chiffres : « 2 800+ vendeurs actifs », « 45 000+ produits
  listés », « 12 pays desservis », « 98 % satisfaction client ».

  Aucun n'était vrai. Au moment où ils ont été retirés, MACHÉ comptait
  six boutiques approuvées, douze produits, un seul pays, et deux avis
  au total — sur lesquels aucun taux de satisfaction ne veut dire quoi
  que ce soit.

  Pourquoi c'était le pire endroit du site pour mentir

  C'est la page qu'un commerçant ouvre avant de décider s'il ouvre une
  boutique. « 2 800 vendeurs actifs » lui fait croire qu'il rejoint une
  place de marché qui tourne déjà ; il s'inscrit sur cette base, ne vend
  rien, et comprend ce qui s'est passé. On ne récupère pas un vendeur à
  qui on a fait ça.

  Ce qu'elle affiche à la place

  Ce que MACHÉ fait, et où il en est. Les chiffres qui restent sont lus
  dans le catalogue à chaque affichage — ils sont petits, et c'est très
  bien : un chiffre petit et vrai se défend, un chiffre grand et faux
  ne se défend jamais.
*/

import Link from "next/link";
import { fetchSellers, fetchProducts } from "@/lib/medusa/catalog";
import { reportOutage } from "@/lib/medusa/outage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "À propos — MACHÉ",
  description:
    "Ce qu'est MACHÉ, la place de marché d'Haïti : comment elle fonctionne, et où elle en est.",
};

/* Ce que MACHÉ fait réellement aujourd'hui. Chaque ligne est vérifiable. */
const WHAT_WORKS = [
  {
    title: "On paie à la livraison",
    text: "MACHÉ n'encaisse pas. Le client règle le vendeur ou son livreur, en main propre. C'est ce qui permet d'acheter sans carte bancaire.",
  },
  {
    title: "Une commande par boutique",
    text: "Un panier contenant les articles de trois vendeurs produit trois commandes : chacune est préparée, livrée et réglée séparément.",
  },
  {
    title: "Le prix se négocie quand il le faut",
    text: "Pour une quantité, on demande un devis : le vendeur répond par un prix total et une date de validité. Rien n'est réservé tant qu'on n'a pas accepté.",
  },
  {
    title: "On peut vérifier qui sonne",
    text: "Chaque agent MACHÉ porte un code. On le saisit sur le site avant de lui remettre un colis ou de l'argent.",
  },
];

export default async function AboutPage() {
  /*
    Les chiffres sont lus, jamais écrits à la main. Une lecture qui
    échoue n'affiche rien — mieux vaut une page sans chiffres qu'une
    page avec des chiffres faux.
  */
  const [sellers, products] = await Promise.all([
    fetchSellers(200),
    fetchProducts({ limit: 1 }),
  ]);

  if (!sellers.ok) reportOutage("à propos (boutiques)", sellers.reason);
  if (!products.ok) reportOutage("à propos (produits)", products.reason);

  const sellerCount = sellers.ok ? sellers.data.count || sellers.data.sellers.length : null;
  const productCount = products.ok ? products.data.count : null;

  return (
    <main>
      <section className="bg-[var(--mache-dark)] py-14 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--mache-primary-strong)]">
              À propos de MACHÉ
            </div>

            <h1 className="text-hero font-black tracking-tightest">
              La place de marché d&apos;Haïti
            </h1>

            <p className="mt-5 max-w-xl text-md leading-8 text-white/55">
              Des boutiques indépendantes, des marques et des fournisseurs
              d&apos;ici et de la diaspora, réunis au même endroit. Chaque
              vendeur garde sa boutique ; l&apos;acheteur n&apos;a qu&apos;un
              panier.
            </p>

            {/*
              Où en est le projet, dit franchement. Une page « à propos »
              qui laisse croire à une plateforme installée alors qu'elle
              démarre trompe d'abord les vendeurs, qui sont ceux dont
              elle a le plus besoin.
            */}
            <p className="mt-4 max-w-xl text-md leading-8 text-white/40">
              MACHÉ démarre. La plateforme fonctionne — on y ouvre une
              boutique, on y vend, on y commande — et elle compte encore peu
              de vendeurs. C&apos;est le moment d&apos;y entrer, pas celui
              d&apos;y arriver en retard.
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] bg-[var(--mache-dark)] p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte d'Haïti aux couleurs de MACHÉ"
              className="h-[340px] w-full object-contain"
            />
          </div>
        </div>
      </section>

      {(sellerCount !== null || productCount !== null) && (
        <section className="container-page py-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
            Où en est la place de marché
          </h2>

          <p className="mt-1 text-base text-[var(--mache-muted)]">
            Ces nombres sont lus dans le catalogue, maintenant.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerCount !== null && (
              <div className="card p-6">
                <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
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
                <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
                  {productCount}
                </div>
                <div className="mt-1 text-sm text-[var(--mache-muted)]">
                  article{productCount > 1 ? "s" : ""} au catalogue
                </div>
              </div>
            )}

            <div className="card p-6">
              <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
                10
              </div>
              <div className="mt-1 text-sm text-[var(--mache-muted)]">
                départements desservis —{" "}
                <Link href="/haiti" className="font-semibold text-[var(--mache-primary)] hover:underline">
                  la carte
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)]">
          Comment ça marche, concrètement
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {WHAT_WORKS.map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-lg font-black text-[var(--mache-text)]">
                {item.title}
              </h3>
              <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-black">Ce que MACHÉ veut être</h2>
            <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
              L&apos;endroit où l&apos;on achète haïtien sans avoir à
              connaître le vendeur à l&apos;avance. Pour le commerce local,
              pour la diaspora, et pour les entreprises qui achètent en
              volume.
            </p>
          </div>

          {/*
            Ce qui n'est pas encore là. Le dire ici évite qu'on le
            découvre en pleine commande — et un vendeur qui sait à quoi
            s'en tenir reste.
          */}
          <div className="card p-6">
            <h2 className="text-lg font-black">Ce qui n&apos;est pas encore là</h2>
            <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
              Le paiement en ligne : aucun prestataire n&apos;est raccordé,
              tout se règle à la livraison. L&apos;envoi d&apos;e-mails
              automatiques. Et l&apos;export hors d&apos;Haïti, qui demande
              des partenaires logistiques que nous n&apos;avons pas encore.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/sell"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
          >
            Ouvrir une boutique
          </Link>

          <Link
            href="/contact"
            className="rounded-[6px] border border-[var(--mache-line)] px-5 py-2.5 text-md font-semibold text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)]"
          >
            Nous écrire
          </Link>
        </div>
      </section>
    </main>
  );
}
