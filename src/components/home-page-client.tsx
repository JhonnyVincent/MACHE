"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { ProductCard } from "@/components/product-card";

type VendorCard = {
  name: string;
  category: string;
  location: string;
  href: string;
};

const content = {
  mainCategories: [
    { title: "Artisanat", icon: "🎨", href: "/shop?category=artisanat" },
    { title: "Beauté", icon: "🌺", href: "/shop?category=beaute" },
    { title: "Maison", icon: "🏠", href: "/shop?category=maison" },
    { title: "Mode", icon: "👕", href: "/shop?category=mode" },
    { title: "Saveurs", icon: "🍲", href: "/shop?category=saveurs" }
  ],
  moreButton: "Plus",
  moreTitle: "Toutes les catégories",
  catalogButton: "Voir le catalogue",
  advantages: [
    {
      icon: "🚚",
      title: "Suivre une livraison",
      text: "Voir l’état de votre colis",
      href: "/track-order"
    },
    {
      icon: "💳",
      title: "Paiement en ligne",
      text: "Méthodes de paiement disponibles",
      href: "/checkout"
    },
    {
      icon: "✅",
      title: "Vérifier un agent",
      text: "Confirmer un agent Maché",
      href: "/verify-agent"
    },
    {
      icon: "🎧",
      title: "Support client",
      text: "Contactez notre équipe",
      href: "/contact"
    }
  ],
  whyChooseUs: [
    {
      icon: "🇭🇹",
      title: "Produits locaux",
      text: "Découvrez des produits haïtiens, des artisans et des boutiques d’ici."
    },
    {
      icon: "🛡️",
      title: "Vendeurs fiables",
      text: "Maché met en avant des vendeurs sérieux et des boutiques vérifiées."
    },
    {
      icon: "⚡",
      title: "Achat simple",
      text: "Trouvez, comparez et commandez rapidement depuis votre téléphone."
    },
    {
      icon: "🤝",
      title: "Pour tous les vendeurs",
      text: "Petits vendeurs, entreprises, agents et partenaires peuvent rejoindre Maché."
    }
  ],
  slides: [
    {
      badge: "Marketplace haïtienne",
      title: "Tout Ayiti. Tout en un seul Maché.",
      text: "Achetez local, découvrez des vendeurs fiables et soutenez les produits haïtiens avec une expérience simple, rapide et sécurisée.",
      cta: "Acheter maintenant",
      href: "/shop",
      type: "haiti"
    },
    {
      badge: "Meilleures ventes",
      title: "Les produits les plus demandés du moment",
      text: "Mode, épicerie, artisanat, beauté et maison : retrouvez les produits qui attirent le plus les clients.",
      cta: "Voir les meilleures ventes",
      href: "/shop?sort=best",
      type: "products"
    },
    {
      badge: "Partenaire export",
      title: "PHARE de Bawon accompagne l’importation et l’exportation",
      text: "Un espace pour connecter Haïti, la diaspora, les exportateurs, les importateurs et les opportunités commerciales.",
      cta: "Découvrir PHARE",
      href: "/services",
      type: "phare"
    },
    {
      badge: "Financement",
      title: "Bawon soutient les projets et entreprises",
      text: "Financement, accompagnement, investissement et croissance des entreprises haïtiennes.",
      cta: "Trouver un financement",
      href: "https://bawon-eta.vercel.app/",
      type: "bawon"
    },
    {
      badge: "Actualités du marché",
      title: "Nouveautés, promotions et opportunités",
      text: "Suivez les nouveaux vendeurs, les offres spéciales, les produits populaires et les annonces importantes.",
      cta: "Voir les nouveautés",
      href: "/shop?sort=new",
      type: "news"
    }
  ],
  moreCategories: [
    "En vedette",
    "Maison et Cuisine",
    "Vêtements femme",
    "Chaussures femme",
    "Lingerie et Pyjamas",
    "Vêtements homme",
    "Chaussures homme",
    "Sports et Activités d'extérieur",
    "Bijoux et Accessoires",
    "Beauté et Santé",
    "Jouets et Jeux",
    "Automobile",
    "Mode Enfant",
    "Chaussures enfant",
    "Bébé et Maternité",
    "Sacs et Bagages",
    "Arts, Artisanat et Couture",
    "Électroniques",
    "Outillage et Amélioration de l'habitat",
    "Électroménagers",
    "Fournitures de bureau et scolaires",
    "Accessoires animaux",
    "Téléphones et Accessoires",
    "Alimentation et Épicerie",
    "Livres et médias",
    "Meubles"
  ],
  fallbackVendors: [
    {
      name: "Boutique Lakay",
      category: "Mode & accessoires",
      location: "Port-au-Prince",
      href: "/shop?vendor=boutique-lakay"
    },
    {
      name: "Atelye Kreyòl",
      category: "Artisanat local",
      location: "Jacmel",
      href: "/shop?vendor=atelye-kreyol"
    },
    {
      name: "Saveurs d’Haïti",
      category: "Épicerie & produits locaux",
      location: "Cap-Haïtien",
      href: "/shop?vendor=saveurs-haiti"
    }
  ],
  sections: {
    internal: {
      badge: "Sélection prioritaire",
      title: "Nos produits mis en avant",
      text: "Une sélection spéciale de produits recommandés par Maché."
    },
    sponsored: {
      badge: "Publicité",
      title: "Produits sponsorisés",
      text: "Des produits proposés par nos vendeurs partenaires."
    },
    best: {
      badge: "Sélection Maché",
      title: "Meilleures ventes",
      text: "Les produits qui attirent le plus les clients actuellement."
    },
    new: {
      badge: "Nouveautés",
      title: "Nouveaux produits",
      text: "Les derniers produits ajoutés par les vendeurs."
    },
    promo: {
      badge: "Offres limitées",
      title: "Promotions du moment",
      text: "Des offres à ne pas manquer sur les produits populaires."
    },
    vendors: {
      badge: "Boutiques",
      title: "Nouveaux vendeurs",
      text: "Découvrez les dernières boutiques arrivées sur Maché."
    },
    recommended: {
      badge: "Pour vous",
      title: "Vous pourriez aimer",
      text: "Des suggestions basées sur les tendances et les catégories populaires."
    }
  }
};

/*
  Rangée de produits.

  Registre d'un site de commerce : le rayon prime sur son titre. L'en-tête
  tient sur une ligne, la grille descend jusqu'à six colonnes sur grand
  écran, et l'accroche marketing disparaît — elle poussait les produits
  sous la ligne de flottaison.
*/
function ProductSection({
  badge,
  title,
  href,
  products
}: {
  badge: string;
  title: string;
  text?: string;
  href: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="container-page py-5">
      <div className="rounded-[12px] border border-[var(--mache-line)] bg-white p-4 md:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--mache-line)] pb-3">
          <div className="min-w-0">
            <h2 className="truncate text-[19px] font-[900] tracking-[-0.02em] text-[#071f3d] md:text-[22px]">
              {title}
            </h2>
            <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#d20a1e]">
              {badge}
            </p>
          </div>

          <Link
            href={href}
            className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#071f3d] underline-offset-2 hover:text-[#d20a1e] hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="container-page py-5">
      <div className="rounded-[12px] border border-[var(--mache-line)] bg-white p-4 md:p-5">
        <h2 className="text-[19px] font-[900] tracking-[-0.02em] text-[#071f3d] md:text-[22px]">
          Une marketplace pensée pour Haïti
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.whyChooseUs.map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-[10px] border border-[var(--mache-line)] bg-[#fbfbfc] p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#fff1f1] text-[18px]">
                {item.icon}
              </div>

              <div className="min-w-0">
                <h3 className="text-[13.5px] font-[800] text-[#071f3d]">{item.title}</h3>
                <p className="mt-1 text-[12px] leading-[1.6] text-slate-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VendorCtaSection() {
  return (
    <section className="container-page py-5">
      <div className="overflow-hidden rounded-[12px] bg-[#071f3d] px-5 py-6 text-white md:px-8 md:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#ffcc33]">
              Rejoindre Maché
            </p>

            <h2 className="mt-2 text-[22px] font-[900] tracking-[-0.02em] md:text-[27px]">
              Vendez, représentez ou collaborez avec nous.
            </h2>

            <p className="mt-2 max-w-2xl text-[13px] leading-[1.7] text-white/70">
              Maché accompagne les vendeurs, les agents et les partenaires qui
              veulent développer le commerce haïtien en ligne.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Link
              href="/sell"
              className="rounded-[8px] bg-[#d20a1e] px-4 py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-[#071f3d]"
            >
              Devenir vendeur
            </Link>

            <Link
              href="/verify-agent"
              className="rounded-[8px] border border-white/20 bg-white/10 px-4 py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-[#071f3d]"
            >
              Vérifier un agent
            </Link>

            <Link
              href="/contact"
              className="rounded-[8px] border border-white/20 bg-white/10 px-4 py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-[#071f3d]"
            >
              Devenir partenaire
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="container-page py-5 pb-10">
      <div className="rounded-[12px] border border-[var(--mache-line)] bg-white p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-[18px] font-[900] tracking-[-0.02em] text-[#071f3d]">
              Recevez les nouveautés et les promotions
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Nouveaux produits, boutiques à découvrir et offres importantes.
            </p>
          </div>

          <form className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              aria-label="Votre adresse e-mail"
              className="h-11 min-w-0 flex-1 rounded-[8px] border border-[var(--mache-line)] px-3.5 text-[13px] outline-none transition-all focus:border-[#d20a1e] focus:ring-4 focus:ring-red-100"
            />

            <button
              type="submit"
              className="h-11 shrink-0 rounded-[8px] bg-[#d20a1e] px-5 text-[13px] font-bold text-white transition-colors hover:bg-black"
            >
              S’abonner
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function HomePageClient({
  products,
  vendors
}: {
  products: Product[];
  vendors: VendorCard[];
}) {
  const [active, setActive] = useState(0);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const slide = content.slides[active];

  const allProducts = products;

  const internalProducts = allProducts
    .filter((product) => product.featured)
    .slice(0, 6);

  const sponsoredProducts = allProducts
    .filter((product) => product.isSponsored)
    .slice(0, 6);

  const bestSellingProducts = allProducts
    .filter((product) => !product.featured && !product.isSponsored)
    .slice(0, 6);

  const newProducts = [...allProducts].slice(0, 6);

  const promoProducts = allProducts
    .filter((product) => product.compareAtPrice)
    .slice(0, 6);

  const recommendedProducts = allProducts.slice(1, 7);

  const displayedVendors =
    vendors.length > 0 ? vendors : content.fallbackVendors;

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % content.slides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main
      className="bg-[#f5f6f8]"
      onClick={() => setShowMoreCategories(false)}
    >
      {/*
        Bandeau d'accueil resserré. Il occupait plus d'un écran de haut avec
        un titre en 8xl : sur un site de commerce, les produits doivent être
        visibles sans faire défiler la page.
      */}
      <section className="relative overflow-hidden border-b border-[var(--mache-line)] bg-gradient-to-br from-white via-white to-[#fff1f1]">
        <img
          src="/images/logo-haiti-mache-hibiscus.png"
          alt=""
          className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] opacity-[0.04]"
        />

        <div className="container-page grid items-center gap-8 py-8 md:py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-3 inline-flex rounded-[4px] bg-[#d20a1e] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              {slide.badge}
            </p>

            <h1 className="max-w-2xl text-[clamp(28px,4.2vw,46px)] font-[900] leading-[1.05] tracking-[-0.035em] text-[#071f3d]">
              {slide.title.includes("Maché") ? (
                <>
                  Tout Ayiti.
                  <br />
                  Tout en un seul{" "}
                  <span className="text-[#d20a1e]">Maché.</span>
                </>
              ) : (
                slide.title
              )}
            </h1>

            <p className="mt-3.5 max-w-xl text-[14.5px] leading-[1.75] text-[#23344d]">
              {slide.text}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href={slide.href}
                className="rounded-[8px] bg-[#d20a1e] px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-black"
              >
                {slide.cta}
              </Link>

              <Link
                href="/shop"
                className="rounded-[8px] border border-slate-300 bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#071f3d] transition-colors hover:border-[#d20a1e] hover:text-[#d20a1e]"
              >
                {content.catalogButton}
              </Link>
            </div>
          </div>

          <div className="min-h-[240px]">
            {slide.type === "haiti" && (
              <img
                src="/images/carte-haiti-mache.png"
                alt="Carte d’Haïti Maché"
                className="mx-auto max-h-[300px] w-full object-contain drop-shadow-xl"
              />
            )}

            {slide.type === "products" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {allProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {slide.type === "phare" && (
              <div className="flex min-h-[240px] items-center justify-center rounded-[12px] bg-[#071f3d] p-8 text-center text-white">
                <div>
                  <div className="text-[44px] font-[900] tracking-[-0.03em]">PHARE</div>
                  <p className="mt-2 text-[13px] text-white/80">
                    Exportation • Importation • Diaspora • Logistique
                  </p>
                </div>
              </div>
            )}

            {slide.type === "bawon" && (
              <div className="flex min-h-[240px] items-center justify-center rounded-[12px] bg-[#d20a1e] p-8 text-center text-white">
                <div>
                  <div className="text-[44px] font-[900] tracking-[-0.03em]">Bawon</div>
                  <p className="mt-2 text-[13px] text-white/85">
                    Financement • Investissement • Entreprises
                  </p>
                </div>
              </div>
            )}

            {slide.type === "news" && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  ["Nouveaux vendeurs", "/shop"],
                  ["Dernières promotions", "/shop?promo=true"],
                  ["Produits populaires", "/shop?sort=best"],
                  ["Actualités du marché", "/shop?sort=new"]
                ].map(([item, href]) => (
                  <Link
                    key={item}
                    href={href}
                    className="rounded-[10px] border border-[var(--mache-line)] bg-white p-4 transition-colors hover:border-[#d20a1e]"
                  >
                    <div className="text-[14px] font-[800] text-[#071f3d]">{item}</div>
                    <div className="mt-1 text-[12px] text-[#d20a1e]">Découvrir →</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container-page pb-4">
          <div className="flex justify-center gap-1.5">
            {content.slides.map((item, index) => (
              <button
                key={item.badge}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  active === index ? "w-7 bg-[#d20a1e]" : "w-1.5 bg-slate-300"
                }`}
                aria-label={`Afficher ${item.badge}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-b border-[var(--mache-line)] bg-white">
        <div className="container-page grid gap-2 py-3 sm:grid-cols-2 md:grid-cols-4">
          {content.advantages.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-colors hover:bg-[#fbfbfc]"
            >
              <div className="text-[20px]">{item.icon}</div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-[800] text-[#071f3d]">
                  {item.title}
                </div>
                <div className="truncate text-[11.5px] text-slate-500">{item.text}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative border-y bg-[#fff1f1]">
        <div
          className="container-page flex items-center gap-1.5 overflow-x-auto py-2.5 text-[13.5px] font-[800] text-[#071f3d] md:justify-between md:gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {content.mainCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="flex shrink-0 items-center rounded-[8px] px-3 py-2 transition-colors hover:bg-white hover:text-[#d20a1e]"
            >
              <span className="mr-1.5 text-[18px]">{category.icon}</span>
              {category.title}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setShowMoreCategories((value) => !value)}
            className="shrink-0 rounded-[8px] bg-black px-3.5 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-[#d20a1e]"
          >
            ••• {content.moreButton}
          </button>
        </div>

        {showMoreCategories && (
          <div
            className="fixed left-1/2 top-[120px] z-[999] w-[92%] max-w-6xl -translate-x-1/2 rounded-[2rem] border bg-white p-5 shadow-2xl md:top-[210px] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div>
                <div className="text-xl font-black text-[#071f3d] md:text-2xl">
                  {content.moreTitle}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Explorez toutes les catégories disponibles sur Maché.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreCategories(false)}
                className="rounded-full bg-slate-100 px-4 py-2 text-xl font-black text-slate-500 transition-all hover:bg-black hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid max-h-[430px] grid-cols-2 gap-3 overflow-y-auto pr-2 md:grid-cols-3 lg:grid-cols-4">
              {content.moreCategories.map((item) => (
                <Link
                  key={item}
                  href={`/shop?category=${encodeURIComponent(
                    item.toLowerCase()
                  )}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#071f3d] transition-all duration-200 hover:border-[#d20a1e] hover:bg-[#fff1f1] hover:text-[#d20a1e]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <ProductSection
        badge={content.sections.internal.badge}
        title={content.sections.internal.title}
        text={content.sections.internal.text}
        href="/shop?featured=true"
        products={internalProducts}
      />

      <ProductSection
        badge={content.sections.sponsored.badge}
        title={content.sections.sponsored.title}
        text={content.sections.sponsored.text}
        href="/shop?sponsored=true"
        products={sponsoredProducts}
      />

      <ProductSection
        badge={content.sections.best.badge}
        title={content.sections.best.title}
        text={content.sections.best.text}
        href="/shop?sort=best"
        products={bestSellingProducts}
      />

      <ProductSection
        badge={content.sections.new.badge}
        title={content.sections.new.title}
        text={content.sections.new.text}
        href="/shop?sort=new"
        products={newProducts}
      />

      <ProductSection
        badge={content.sections.promo.badge}
        title={content.sections.promo.title}
        text={content.sections.promo.text}
        href="/shop?promo=true"
        products={promoProducts}
      />

      <section className="container-page py-5">
        <div className="rounded-[12px] border border-[var(--mache-line)] bg-white p-4 md:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--mache-line)] pb-3">
            <div className="min-w-0">
              <h2 className="truncate text-[19px] font-[900] tracking-[-0.02em] text-[#071f3d] md:text-[22px]">
                {content.sections.vendors.title}
              </h2>
              <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#d20a1e]">
                {content.sections.vendors.badge}
              </p>
            </div>

            <Link
              href="/shop"
              className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#071f3d] underline-offset-2 hover:text-[#d20a1e] hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayedVendors.map((vendor) => (
              <Link
                key={vendor.name}
                href={vendor.href}
                className="flex items-center gap-3 rounded-[10px] border border-[var(--mache-line)] bg-[#fbfbfc] p-3.5 transition-colors hover:border-[#d20a1e] hover:bg-white"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#fff1f1] text-[20px]">
                  🏪
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[14px] font-[900] text-[#071f3d]">
                    {vendor.name}
                  </h3>
                  <p className="truncate text-[12px] text-slate-500">{vendor.category}</p>
                  <p className="truncate text-[11.5px] text-slate-400">{vendor.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/*
        Argumentaire placé après les rayons : sur un site de commerce, les
        produits passent avant le discours. Il séparait auparavant le
        bandeau d'accueil du premier rayon.
      */}
      <WhyChooseUsSection />

      <VendorCtaSection />

      <ProductSection
        badge={content.sections.recommended.badge}
        title={content.sections.recommended.title}
        text={content.sections.recommended.text}
        href="/shop?recommended=true"
        products={recommendedProducts}
      />

      <NewsletterSection />
    </main>
  );
}
