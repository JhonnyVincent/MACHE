"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types";

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
  ]
};

export function HomePageClient({
  products,
  vendors
}: {
  products: Product[];
  vendors: VendorCard[];
}) {
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  return (
    <main
      className="bg-[#f5f6f8]"
      onClick={() => setShowMoreCategories(false)}
    >
      <section className="relative border-y bg-[#fff1f1]">
        <div
          className="container-page flex min-h-24 items-center gap-3 overflow-x-auto py-4 text-base font-black text-[#071f3d] md:justify-between md:gap-4 md:text-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {content.mainCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="flex shrink-0 items-center rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white hover:text-[#d20a1e] hover:shadow-sm"
            >
              <span className="mr-2 text-3xl">{category.icon}</span>
              {category.title}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setShowMoreCategories((value) => !value)}
            className="shrink-0 rounded-full bg-black px-5 py-3 text-sm text-white transition-all duration-300 hover:bg-[#d20a1e] md:px-6 md:py-4 md:text-base"
          >
            ••• {content.moreButton}
          </button>
        </div>

        {showMoreCategories && (
          <div
            className="fixed left-1/2 top-[120px] z-[999] w-[92%] max-w-6xl -translate-x-1/2 rounded-[2rem] border bg-white p-5 shadow-2xl md:top-[210px] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b pb-4">
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
              {content.mainCategories.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-[#071f3d] transition-all duration-200 hover:border-[#d20a1e] hover:bg-[#fff1f1] hover:text-[#d20a1e]"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
