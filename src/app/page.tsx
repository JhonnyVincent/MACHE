"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { featuredProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

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
  bestSalesButton: "Voir tous les produits",

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
      title: "PHARE accompagne l’importation et l’exportation",
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
    "Grandes tailles femme",
    "Chaussures femme",
    "Lingerie et Pyjamas femme",
    "Vêtements homme",
    "Chaussures homme",
    "Grandes tailles homme",
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

  vendors: [
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
    recommended: {
      badge: "Pour vous",
      title: "Vous pourriez aimer",
      text: "Des suggestions basées sur les tendances et les catégories populaires."
    },
    continueShopping: {
      badge: "Reprendre",
      title: "Continuer vos achats",
      text: "Retrouvez rapidement les produits que vous avez consultés."
    },
    vendors: {
      badge: "Boutiques",
      title: "Nouveaux vendeurs",
      text: "Découvrez les dernières boutiques arrivées sur Maché."
    }
  }
};

function ProductSection({
  badge,
  title,
  text,
  href,
  products
}: {
  badge: string;
  title: string;
  text: string;
  href: string;
  products: typeof featuredProducts;
}) {
  return (
    <section className="container-page py-10">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d20a1e]">
            {badge}
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.03em] text-[#071f3d]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-500">{text}</p>
        </div>

        <Link
          href={href}
          className="hidden rounded-xl bg-black px-5 py-3 font-black text-white transition-all duration-300 hover:bg-[#d20a1e] md:inline-flex"
        >
          Voir plus →
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="transition-all duration-300 hover:-translate-y-2"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [active, setActive] = useState(0);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const slide = content.slides[active];

  const bestSellingProducts = featuredProducts;
  const newProducts = featuredProducts.slice().reverse();
  const promoProducts = featuredProducts.slice(0, 3);
  const recommendedProducts = featuredProducts.slice(1);
  const recentlyViewedProducts = featuredProducts.slice(0, 3);

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
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-[#fff1f1]">
        <img
          src="/images/logo-haiti-mache-hibiscus.png"
          alt=""
          className="pointer-events-none absolute -right-32 -top-40 h-[650px] w-[650px] opacity-[0.04]"
        />

        <div className="container-page grid min-h-[620px] items-center gap-12 py-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-[#d20a1e] px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg">
              {slide.badge}
            </p>

            <h1 className="max-w-3xl text-6xl font-black leading-[0.92] tracking-[-0.05em] text-[#071f3d] md:text-8xl">
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

            <p className="mt-7 max-w-2xl text-xl font-medium leading-relaxed text-[#23344d]">
              {slide.text}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href={slide.href}
                className="rounded-xl bg-[#d20a1e] px-8 py-4 text-base font-black text-white shadow-xl shadow-red-200 transition-all duration-300 hover:-translate-y-1 hover:bg-black"
              >
                {slide.cta}
              </Link>

              <Link
                href="/shop"
                className="rounded-xl border border-slate-300 bg-white px-8 py-4 text-base font-black text-[#071f3d] transition-all duration-300 hover:-translate-y-1 hover:border-[#d20a1e] hover:text-[#d20a1e]"
              >
                {content.catalogButton}
              </Link>
            </div>
          </div>

          <div className="min-h-[460px]">
            {slide.type === "haiti" && (
              <img
                src="/images/carte-haiti-mache.png"
                alt="Carte d’Haïti Maché"
                className="mx-auto max-h-[520px] w-full object-contain drop-shadow-2xl"
              />
            )}

            {slide.type === "products" && (
              <div className="grid gap-5 sm:grid-cols-2">
                {featuredProducts.slice(0, 2).map((product) => (
                  <div
                    key={product.id}
                    className="transition-all duration-300 hover:-translate-y-2"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}

            {slide.type === "phare" && (
              <div className="flex min-h-[460px] items-center justify-center rounded-[2rem] bg-[#071f3d] p-10 text-center text-white shadow-xl">
                <div>
                  <div className="text-7xl font-black">PHARE</div>
                  <p className="mt-4 text-lg text-white/80">
                    Exportation • Importation • Diaspora • Logistique
                  </p>
                </div>
              </div>
            )}

            {slide.type === "bawon" && (
              <div className="flex min-h-[460px] items-center justify-center rounded-[2rem] bg-[#d20a1e] p-10 text-center text-white shadow-xl">
                <div>
                  <div className="text-7xl font-black">Bawon</div>
                  <p className="mt-4 text-lg text-white/85">
                    Financement • Investissement • Entreprises
                  </p>
                </div>
              </div>
            )}

            {slide.type === "news" && (
              <div className="grid gap-4">
                {[
                  "Nouveaux vendeurs",
                  "Dernières promotions",
                  "Produits populaires",
                  "Actualités du marché"
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="text-xl font-black text-[#071f3d]">
                      {item}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Cette donnée pourra venir automatiquement de Supabase.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="container-page pb-8">
          <div className="flex justify-center gap-2">
            {content.slides.map((item, index) => (
              <button
                key={item.badge}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(index);
                }}
                className={`h-3 rounded-full transition-all ${
                  active === index ? "w-12 bg-[#d20a1e]" : "w-3 bg-slate-300"
                }`}
                aria-label={`Afficher ${item.badge}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-white shadow-sm">
        <div className="container-page grid gap-4 py-5 md:grid-cols-4">
          {content.advantages.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#d20a1e] hover:shadow-lg"
            >
              <div className="text-4xl">{item.icon}</div>
              <div>
                <div className="font-black text-[#071f3d]">{item.title}</div>
                <div className="text-sm text-slate-500">{item.text}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative border-y bg-white">
        <div
          className="container-page flex h-24 items-center justify-between gap-4 whitespace-nowrap text-lg font-black text-[#071f3d]"
          onClick={(e) => e.stopPropagation()}
        >
          {content.mainCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="rounded-xl px-4 py-3 transition-all duration-300 hover:bg-[#fff1f1] hover:text-[#d20a1e]"
            >
              <span className="mr-2 text-3xl">{category.icon}</span>
              {category.title}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setShowMoreCategories((value) => !value)}
            className="rounded-full bg-black px-6 py-4 text-white transition-all duration-300 hover:bg-[#d20a1e]"
          >
            ••• {content.moreButton}
          </button>
        </div>

        {showMoreCategories && (
          <div
            className="fixed left-1/2 top-[210px] z-[999] w-[92%] max-w-6xl -translate-x-1/2 rounded-[2rem] border bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div>
                <div className="text-2xl font-black text-[#071f3d]">
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

      <section className="container-page py-10">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d20a1e]">
            {content.sections.vendors.badge}
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.03em] text-[#071f3d]">
            {content.sections.vendors.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
            {content.sections.vendors.text}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {content.vendors.map((vendor) => (
            <Link
              key={vendor.name}
              href={vendor.href}
              className="rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#d20a1e] hover:shadow-xl"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1f1] text-3xl">
                🏪
              </div>
              <h3 className="text-2xl font-black text-[#071f3d]">
                {vendor.name}
              </h3>
              <p className="mt-2 font-semibold text-slate-500">
                {vendor.category}
              </p>
              <p className="mt-1 text-sm text-slate-400">{vendor.location}</p>
              <div className="mt-5 font-black text-[#d20a1e]">
                Voir la boutique →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection
        badge={content.sections.recommended.badge}
        title={content.sections.recommended.title}
        text={content.sections.recommended.text}
        href="/shop?recommended=true"
        products={recommendedProducts}
      />

      <ProductSection
        badge={content.sections.continueShopping.badge}
        title={content.sections.continueShopping.title}
        text={content.sections.continueShopping.text}
        href="/shop?recent=true"
        products={recentlyViewedProducts}
      />
    </main>
  );
}
