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
  catalogButton: "Voir le catalogue",
  bestSalesButton: "Voir tous les produits",
  advantages: [
    ["🚚", "Livraison rapide", "Partout en Haïti"],
    ["🛡️", "Paiement sécurisé", "Transactions protégées"],
    ["✅", "Produits authentiques", "Sélectionnés avec soin"],
    ["🎧", "Support client", "Toujours à votre écoute"]
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
  section: {
    badge: "Sélection Maché",
    title: "Meilleures ventes",
    text: "Pour l’instant, les produits viennent de l’équipe Maché. Plus tard, cette section pourra se mettre à jour automatiquement avec Supabase."
  }
};

export default function HomePage() {
  const [active, setActive] = useState(0);
  const slide = content.slides[active];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % content.slides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="bg-[#f5f6f8]">
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
                onClick={() => setActive(index)}
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
          {content.advantages.map(([icon, title, text]) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{icon}</div>
              <div>
                <div className="font-black text-[#071f3d]">{title}</div>
                <div className="text-sm text-slate-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="container-page flex h-24 items-center justify-between gap-4 overflow-x-auto whitespace-nowrap text-lg font-black text-[#071f3d]">
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

          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-full bg-black px-5 py-3 text-white transition-all duration-300 hover:bg-[#d20a1e]">
              ••• {content.moreButton}
            </summary>

            <div className="absolute right-0 z-30 mt-4 grid w-[760px] grid-cols-3 gap-2 rounded-2xl border bg-white p-6 text-sm font-semibold text-[#071f3d] shadow-2xl">
              {content.moreCategories.map((item) => (
                <Link
                  key={item}
                  href={`/shop?category=${encodeURIComponent(
                    item.toLowerCase()
                  )}`}
                  className="rounded-lg px-3 py-2 hover:bg-[#fff1f1] hover:text-[#d20a1e]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d20a1e]">
              {content.section.badge}
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.03em] text-[#071f3d]">
              {content.section.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-500">
              {content.section.text}
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden rounded-xl bg-black px-5 py-3 font-black text-white transition-all duration-300 hover:bg-[#d20a1e] md:inline-flex"
          >
            {content.bestSalesButton} →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="transition-all duration-300 hover:-translate-y-2"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
