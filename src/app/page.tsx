/*
  PAGE : accueil MACHÉ

  L'accueil d'une marketplace doit montrer qu'elle est vivante : ce qui
  vient d'arriver, qui vient d'ouvrir, ce qui est en promotion. Chaque
  rayon vient donc du backend commerce.

  Ce qui a changé par rapport à la version précédente

  L'ancienne accueil découpait un même lot de vingt-quatre produits en six
  rayons — « meilleures ventes », « sponsorisés », « recommandé pour
  vous », « tendances » — qui étaient en réalité six tranches du même
  tableau. Un vendeur pouvait s'y croire mis en avant sans l'être, un
  client croire à un classement qui n'existait pas.

  Désormais un rayon n'apparaît que si la donnée qui le justifie existe.
  Ce qui manque est nommé, pas simulé.
*/

import Link from "next/link";
import { fetchHomeData } from "@/lib/medusa/home";
import { FEATURED_CATEGORIES } from "@/lib/categories";
import { PartnersStrip } from "@/components/partners-strip";
import {
  ProductRailSection, SellerRailSection, HomeBoardSection,
  CollectionRailSection,
} from "@/components/home/rails";

export const dynamic = "force-dynamic";

const SERVICES = [
  { icon: "🚚", title: "Suivre mes commandes", text: "État et livraison de vos achats", href: "/dashboard/buyer/orders" },
  { icon: "✅", title: "Vérifier un agent", text: "Confirmer un agent MACHÉ", href: "/verify-agent" },
  { icon: "🏪", title: "Ouvrir une boutique", text: "Vendre sur la marketplace", href: "/sell" },
  { icon: "🎧", title: "Support client", text: "Contacter notre équipe", href: "/contact" },
];

const WHY = [
  { icon: "🇭🇹", title: "Produits d'ici", text: "Artisans, boutiques et marques haïtiennes, en un seul endroit." },
  { icon: "🛡️", title: "Vendeurs vérifiés", text: "Le badge vérifié n'est accordé qu'après contrôle des documents." },
  { icon: "⚡", title: "Achat simple", text: "Trouver, comparer et commander depuis un téléphone." },
  { icon: "🤝", title: "Ouvert à tous", text: "Particuliers, entreprises, fournisseurs et marques officielles." },
];

export default async function HomePage() {
  const home = await fetchHomeData();

  /*
    Le diagnostic va au journal du serveur, pas au visiteur.

    Tant que le backend commerce n'est pas branché, l'accueil affichait
    deux encadrés — « Backend commerce non configuré » et « Rayons à
    venir » — qui expliquaient au client ce qui manquait à la boutique.
    C'est une information d'exploitation : elle est utile à qui déploie
    le site, pas à qui vient acheter. Elle n'est pas perdue pour autant,
    elle est écrite ici.

    L'accueil ne compense pas pour autant : un rayon sans donnée reste
    absent, il n'est pas rempli d'exemples.
  */
  if (home.problems.length > 0) {
    console.warn(
      `[accueil] catalogue incomplet (backend ${home.configured ? "configuré" : "non configuré"}) : ${home.problems.join(" | ")}`
    );
  }

  const liveCounts = [
    { label: "Boutiques", value: home.newSellers.length },
    { label: "Rayons", value: home.categories.length },
    { label: "Nouveautés", value: home.rails.find((r) => r.key === "new")?.products.length ?? 0 },
  ];

  return (
    <main className="bg-[var(--mache-bg)] pb-10">
      {/* ------------------------------------------------------------------ */}
      {/* Bandeau : identité de MACHÉ, pas une photo de stock                */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-[var(--mache-line)] bg-gradient-to-br from-white via-white to-[var(--mache-bg-2)]">
        <div className="container-page grid items-center gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-12">
          <div>
            <span className="inline-block rounded-[3px] bg-[var(--mache-primary)] px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
              Marketplace haïtienne
            </span>

            <h1 className="mt-4 text-hero font-black tracking-tightest text-[var(--mache-text)]">
              Acheter chez les vendeurs d&apos;Haïti,
              <br className="hidden sm:block" /> au même endroit.
            </h1>

            <p className="mt-4 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">
              Des boutiques indépendantes, des marques et des fournisseurs
              réunis sur une seule place de marché. Chaque vendeur garde sa
              boutique ; vous n&apos;avez qu&apos;un panier.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/shop"
                className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
              >
                Voir le catalogue
              </Link>
              <Link
                href="/sell"
                className="rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white"
              >
                Ouvrir ma boutique
              </Link>
            </div>

            {/*
              Compteurs tirés de ce qui a réellement été chargé. À zéro,
              ils ne s'affichent pas : « 0 boutique » en gros sur l'accueil
              n'aide personne, et un chiffre rond inventé encore moins.
            */}
            {liveCounts.some((count) => count.value > 0) && (
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                {liveCounts
                  .filter((count) => count.value > 0)
                  .map((count) => (
                    <div key={count.label}>
                      <dt className="text-xs font-semibold uppercase tracking-label text-[var(--mache-muted)]">
                        {count.label}
                      </dt>
                      <dd className="mt-0.5 text-2xl font-black leading-none text-[var(--mache-text)]">
                        {count.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>

          {/*
            Les deux seuls visuels réellement possédés par le projet : le
            logo hibiscus et la carte d'Haïti. Le reste de l'ancien
            bandeau était une photo de stock sans rapport avec MACHÉ.
          */}
          <div className="relative hidden justify-center lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte d'Haïti aux couleurs de MACHÉ"
              className="w-full max-w-[420px] object-contain"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-haiti-mache-hibiscus.png"
              alt=""
              aria-hidden="true"
              className="absolute -bottom-2 right-2 w-24 object-contain opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Services : quatre liens qui mènent tous à une page réelle. */}
      <section className="mache-reveal border-b border-[var(--mache-line)] bg-[var(--mache-white)]">
        <div className="container-page grid grid-cols-2 gap-px bg-[var(--mache-line)] sm:grid-cols-4">
          {SERVICES.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="flex items-center gap-2.5 bg-[var(--mache-white)] px-3 py-3.5 transition-colors hover:bg-[var(--mache-bg)]"
            >
              <span className="text-xl" aria-hidden="true">{service.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold text-[var(--mache-text)]">
                  {service.title}
                </span>
                <span className="block truncate text-xs text-[var(--mache-muted)]">
                  {service.text}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Rayons réels, dans l'ordre où ils apportent quelque chose. */}
      {home.rails.map((rail) => (
        <ProductRailSection
          key={rail.key}
          title={rail.title}
          subtitle={rail.subtitle}
          href={rail.href}
          products={rail.products}
        />
      ))}

      <SellerRailSection
        title="Nouvelles boutiques"
        subtitle="Les vendeurs qui viennent d'ouvrir sur MACHÉ"
        sellers={home.newSellers}
      />

      {home.verifiedSellers.length > 0 && (
        <SellerRailSection
          title="Boutiques vérifiées"
          subtitle="Entreprises dont MACHÉ a contrôlé les documents"
          sellers={home.verifiedSellers}
        />
      )}

      {/*
        LES RAYONS, EN MOSAÏQUE.

        C'était une bande de liens texte. Sur l'accueil d'une place de
        marché, une liste de mots donne l'impression d'un site vide même
        quand le catalogue ne l'est pas — c'est exactement ce que fait
        voir une comparaison avec n'importe quelle grande place.

        Chaque tuile emprunte quatre vraies photos aux produits de son
        rayon. Pas d'images décoratives : un rayon sans article le dit,
        et se remplira tout seul au premier produit déposé.

        Le repli en liens texte reste, pour le cas où le catalogue ne
        répond pas : une carte du site vaut mieux qu'un trou.
      */}
      {home.boards.length > 0 ? (
        <HomeBoardSection cards={home.boards} />
      ) : (
        <section className="mache-reveal container-page py-5">
          <h2 className="mb-3 text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
            Parcourir les rayons
          </h2>
          <div className="flex flex-wrap gap-2">
            {FEATURED_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="rounded-[6px] border border-[var(--mache-line)] bg-[var(--mache-white)] px-3.5 py-2 text-base font-medium text-[var(--mache-text)] transition-colors hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
              >
                <span aria-hidden="true">{category.icon} </span>
                {category.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <CollectionRailSection collections={home.collections} />

      {/* Pourquoi MACHÉ — quatre affirmations tenues par le produit. */}
      <section className="mache-reveal container-page py-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item) => (
            <div
              key={item.title}
              className="rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-4"
            >
              <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              <h3 className="mt-2 text-md font-bold text-[var(--mache-text)]">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--mache-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/*
        Les partenaires, juste nommés et liés.

        Vide tant que personne n'a signé : la bande ne s'affiche pas du
        tout plutôt que d'annoncer un réseau qui n'existe pas.
      */}
      <PartnersStrip />

      {/* Appel aux vendeurs. */}
      <section className="mache-reveal container-page py-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[var(--mache-dark)] p-6 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">
              Vous vendez quelque chose ?
            </h2>
            <p className="mt-1.5 max-w-xl text-base leading-relaxed text-white/70">
              Ouvrez votre boutique sur MACHÉ, gardez votre marque, et
              profitez d&apos;un catalogue déjà visité. Particuliers,
              entreprises, fournisseurs et marques officielles.
            </p>
          </div>

          <Link
            href="/sell"
            className="rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-strong)]"
          >
            Commencer à vendre
          </Link>
        </div>
      </section>
    </main>
  );
}
