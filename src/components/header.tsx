"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";

const tickerTranslations = {
  fr: [
    "Trouver un exportateur / importateur",
    "Trouver un financement",
    "Se faire accompagner pour créer son entreprise",
    "Investir dans des projets",
    "Paiement sécurisé",
    "Développer son entreprise"
  ],
  ht: [
    "Jwenn yon ekspòtatè / enpòtatè",
    "Jwenn finansman",
    "Jwenn sipò pou kreye biznis ou",
    "Envesti nan pwojè",
    "Peman sekirize",
    "Devlope biznis ou"
  ]
};

const tickerLink = "https://bawon-eta.vercel.app/";

const translations = {
  fr: {
    delivery: "Livraison partout en Haïti",
    searchPlaceholder: "Rechercher un produit, une boutique...",
    login: "Se connecter",
    register: "S’inscrire",
    account: "Mon compte",
    favorites: "Favoris",
    cart: "Panier",
    bestSellers: "Meilleures ventes",
    newArrivals: "Nouveautés",
    promotions: "Promotions",
    catalog: "Tout le catalogue",
    sellers: "Vendre sur Maché",
    brands: "Marques"
  },
  ht: {
    delivery: "Livrezon toupatou an Ayiti",
    searchPlaceholder: "Chèche yon pwodwi, yon boutik...",
    login: "Konekte",
    register: "Kreye kont",
    account: "Kont mwen",
    favorites: "Favori",
    cart: "Panye",
    bestSellers: "Pi byen vann",
    newArrivals: "Nouvo pwodwi",
    promotions: "Pwomosyon",
    catalog: "Tout katalòg la",
    sellers: "Vann sou Maché",
    brands: "Mak"
  }
};

type Lang = keyof typeof translations;

export function Header() {
  const { count, openCart } = useCart();

  const [lang, setLang] = useState<Lang>("fr");

  const t = translations[lang];

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mache_locale="))
      ?.split("=")[1] as Lang | undefined;

    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);

  function changeLang(newLang: Lang) {
    document.cookie = `mache_locale=${newLang}; path=/; max-age=31536000`;

    setLang(newLang);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="overflow-hidden bg-[#d20a1e] py-2 text-sm font-black uppercase tracking-wide text-white">
        <div className="mache-ticker flex w-max gap-12 whitespace-nowrap">
          {[...tickerTranslations[lang], ...tickerTranslations[lang]].map(
            (item, index) => (
              <a
                key={`${item}-${index}`}
                href={tickerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black hover:underline"
              >
                ✦ {item}
              </a>
            )
          )}
        </div>
      </div>

      <div className="border-b bg-black text-white">
        <div className="container-page flex h-10 items-center justify-between">
          <div>🚚 {t.delivery}</div>

          <div className="flex items-center gap-5">
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              className="bg-transparent text-white outline-none"
            >
              <option value="fr">FR</option>
              <option value="ht">HT</option>
            </select>

            <Link href="/login">
              {t.login}
            </Link>

            <Link href="/register">
              {t.register}
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page grid grid-cols-[260px_1fr_280px] items-center gap-8 py-5">
        <Link href="/" className="flex items-center gap-4">
          <img
            src="/images/logo-haiti-mache-hibiscus.png"
            alt="Logo Maché"
            className="h-20 w-20"
          />

          <div>
            <div className="text-5xl font-black text-[#071f3d]">
              Maché
            </div>

            <div className="text-xs font-black uppercase text-[#071f3d]">
              Tout Ayiti. Tout en un seul Maché.
            </div>
          </div>
        </Link>

        <div className="hidden md:flex">
          <input
            className="w-full rounded-xl border px-6 py-4"
            placeholder={t.searchPlaceholder}
          />
        </div>

        <div className="flex justify-end gap-7 text-center">
          <Link href="/dashboard">
            <div>👤</div>
            {t.account}
          </Link>

          <Link href="/favorites">
            <div>♡</div>
            {t.favorites}
          </Link>

          <button onClick={openCart}>
            🛍️ {t.cart} ({count})
          </button>
        </div>
      </div>

      <nav className="bg-black text-white">
        <div className="container-page flex h-16 items-center gap-6 overflow-x-auto whitespace-nowrap">
          <Link href="/shop?sort=best">
            🔥 {t.bestSellers}
          </Link>

          <Link href="/shop?sort=new">
            🟢 {t.newArrivals}
          </Link>

          <Link href="/shop?promo=true">
            🏷️ {t.promotions}
          </Link>

          <Link href="/shop">
            ▦ {t.catalog}
          </Link>

          <Link href="/sell">
            🏪 {t.sellers}
          </Link>

          <Link href="/shop?brands=true">
            🏅 {t.brands}
          </Link>
        </div>
      </nav>
    </header>
  );
}
