"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { featuredProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

const mainCategories = [
  { title: "Artisanat", icon: "🧺", href: "/shop?category=artisanat" },
  { title: "Beauté", icon: "🌺", href: "/shop?category=beaute" },
  { title: "Maison", icon: "🪑", href: "/shop?category=maison" },
  { title: "Mode", icon: "👕", href: "/shop?category=mode" },
  { title: "Saveurs", icon: "🍲", href: "/shop?category=saveurs" }
];

const moreCategories = [
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
];

const advantages = [
  ["🚚", "Livraison rapide", "Partout en Haïti"],
  ["🛡️", "Paiement sécurisé", "Transactions protégées"],
  ["🏅", "Produits authentiques", "Sélectionnés avec soin"],
  ["🎧", "Support client", "Toujours à votre écoute"]
];

const slides = [
  {
    badge: "Image officielle",
    title: "Tout Ayiti. Tout en un seul Maché.",
    text: "Des produits authentiques, des vendeurs locaux, une fierté nationale.",
    cta: "Découvrir",
    href: "/shop",
    type: "haiti"
  },
  {
    badge: "Produit du mois",
    title: "Les produits les plus vendus du moment",
    text: "Plus tard, cette section viendra automatiquement de Supabase selon les ventes, vues et tendances.",
    cta: "Voir les meilleures ventes",
    href: "/shop?sort=best",
    type: "products"
  },
  {
    badge: "Partenaire export",
    title: "PHARE accompagne l’importation et l’exportation",
    text: "Un espace pour connecter Haïti, la diaspora, les exportateurs et les importateurs.",
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
    badge: "Newsletter & vendeurs",
    title: "Les dernières infos du pays et du marché",
    text: "Nouveaux vendeurs, promotions, contrats, annonces et opportunités à soutenir.",
    cta: "Voir les nouveautés",
    href: "/shop?sort=new",
    type: "news"
  }
];

export default function HomePage() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="bg-white">
      <section className="container-page pt-8">
        <div className="relative overflow-hidden rounded-3xl border bg-white p-8 shadow-sm lg:p-14">
          <img
            src="/images/logo-haiti-mache-hibiscus.png"
            alt=""
            className="pointer-events-none absolute -right-16 -top-24 h-[520px] w-[520px] opacity-[0.04]"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.25em] text-[#d20a1e]">
                {slide.badge}
              </p>

              <h1 className="text-5xl font-black leading-tight text-[#071f3d] md:text-7xl">
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

              <p className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-[#23344d]">
                {slide.text}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={slide.href} className="btn-primary">
                  {slide.cta}
                </Link>
                <Link href="/shop" className="btn-secondary">
                  Voir le catalogue
                </Link>
              </div>
            </div>

            <div className="min-h-[360px]">
              {slide.type === "haiti" && (
                <img
                  src="/images/carte-haiti-mache.png"
                  alt="Carte d’Haïti Maché"
                  className="mx-auto max-h-[440px] w-full object-contain"
                />
              )}

              {slide.type === "products" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {featuredProducts.slice(0, 2).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {slide.type === "phare" && (
                <div className="flex h-full min-h-[360px] items-center justify-center rounded-3xl bg-[#071f3d] p-10 text-center text-white">
                  <div>
                    <div className="text-6xl font-black">PHARE</div>
                    <p className="mt-4 text-white/75">
                      Exportation • Importation • Diaspora • Logistique
                    </p>
                  </div>
                </div>
              )}

              {slide.type === "bawon" && (
                <div className="flex h-full min-h-[360px] items-center justify-center rounded-3xl bg-[#d20a1e] p-10 text-center text-white">
                  <div>
                    <div className="text-6xl font-black">Bawon</div>
                    <p className="mt-4 text-white/80">
                      Financement • Investissement • Entreprises
                    </p>
                  </div>
                </div>
              )}

              {slide.type === "news" && (
                <div className="grid gap-4">
                  {["Nouveaux vendeurs", "Dernières promotions", "Produits populaires", "Actualités du marché"].map(
                    (item) => (
                      <div key={item} className="rounded-2xl border bg-white p-6 shadow-sm">
                        <div className="font-black text-[#071f3d]">{item}</div>
                        <p className="mt-2 text-sm text-slate-500">
                          Cette donnée pourra venir automatiquement de Supabase.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-8 flex justify-center gap-2">
            {slides.map((item, index) => (
              <button
                key={item.badge}
                onClick={() => setActive(index)}
                className={`h-3 rounded-full transition-all ${
                  active === index ? "w-10 bg-[#d20a1e]" : "w-3 bg-slate-300"
                }`}
                aria-label={`Afficher ${item.badge}`}
              />
            ))}
          </div>
        </div>

        <div className="mx-auto -mt-5 grid max-w-6xl gap-4 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-4">
          {advantages.map(([icon, title, text]) => (
            <div
              key={title}
              className="flex items-center gap-4 border-slate-200 md:border-r md:last:border-r-0"
            >
              <div className="text-3xl">{icon}</div>
              <div>
                <div className="font-bold text-[#071f3d]">{title}</div>
                <div className="text-sm text-slate-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="container-page flex h-20 items-center justify-between gap-4 overflow-x-auto whitespace-nowrap text-lg font-bold text-[#071f3d]">
          {mainCategories.map((category) => (
            <Link key={category.title} href={category.href}>
              <span className="mr-2 text-3xl">{category.icon}</span>
              {category.title}
            </Link>
          ))}

          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-full bg-[#0b6fd3] px-5 py-3 text-white">
              ••• Plus
            </summary>

            <div className="absolute right-0 z-30 mt-4 grid w-[760px] grid-cols-3 gap-2 rounded-2xl border bg-white p-6 text-sm font-semibold text-[#071f3d] shadow-2xl">
              {moreCategories.map((item) => (
                <Link
                  key={item}
                  href={`/shop?category=${encodeURIComponent(item.toLowerCase())}`}
                  className="rounded-lg px-3 py-2 hover:bg-[#fff1f1] hover:text-[#d20a1e]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Meilleures ventes</h2>
            <p className="section-subtitle">
              Pour l’instant, les produits viennent de l’équipe Maché. Plus tard,
              cette section pourra se mettre à jour automatiquement.
            </p>
          </div>
          <Link href="/shop" className="font-bold text-[#d20a1e]">
            Voir tous les produits →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
