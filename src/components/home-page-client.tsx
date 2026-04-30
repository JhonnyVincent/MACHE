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
  slides: [
    {
      badge: "Marketplace haïtienne",
      title: "Tout Ayiti. Tout en un seul Maché.",
      text: "Achetez local, découvrez des vendeurs fiables et soutenez les produits haïtiens avec une expérience simple, rapide et sécurisée.",
      cta: "Acheter maintenant",
      href: "/shop",
      type: "haiti"
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
    <main className="bg-[#f5f6f8]">

      {/* 🔥 SECTION MODIFIÉE */}
      <section className="relative border-y bg-[#fff1f1]">
        <div
          className="container-page flex h-24 items-center justify-between gap-4 whitespace-nowrap text-lg font-black text-[#071f3d]"
          onClick={(e) => e.stopPropagation()}
        >
          {content.mainCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white hover:text-[#d20a1e] hover:shadow-sm"
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
          <div className="fixed left-1/2 top-[210px] z-[999] w-[92%] max-w-6xl -translate-x-1/2 rounded-[2rem] border bg-white p-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-3">
              {content.mainCategories.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl bg-slate-50 px-4 py-3 hover:bg-[#fff1f1]"
                >
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
