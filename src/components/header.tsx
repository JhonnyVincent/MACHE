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
    sellers: "Vendeurs",
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
    sellers: "Vandè",
    brands: "Mak"
  }
};

type Lang = keyof typeof translations;

const navLinkClass =
  "relative inline-flex items-center transition-all duration-300 hover:scale-105 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:transition-all after:duration-300 hover:after:w-full";

export function Header() {
  const { count, openCart } = useCart();
  const [lang, setLang] = useState<Lang>("fr");
  const t = translations[lang];

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mache_locale="))
      ?.split("=")[1] as Lang | undefined;

    if (saved && translations[saved]) setLang(saved);
  }, []);

  function changeLang(newLang: Lang) {
    document.cookie = `mache_locale=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">

      {/* 🔴 TICKER */}
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

      {/* 🔵 TOP BAR */}
      <div className="border-b bg-black text-white">
        <div className="container-page flex h-10 items-center justify-between">
          <div>🚚 {t.delivery}</div>

          <div className="flex items-center gap-5">
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              className="bg-transparent text-white"
            >
              <option value="fr">FR</option>
              <option value="ht">HT</option>
            </select>

            <Link href="/login">{t.login}</Link>
            <Link href="/register">{t.register}</Link>
          </div>
        </div>
      </div>

      {/* 🔷 MAIN HEADER */}
      <div className="container-page grid grid-cols-[260px_1fr_280px] items-center gap-8 py-5">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-4">
          <img
            src="/images/logo-haiti-mache-hibiscus.png"
            alt="Logo Maché"
            className="h-20 w-20"
          />
          <div>
            <div className="text-5xl font-black text-[#071f3d]">Maché</div>
            <div className="text-xs font-black uppercase text-[#071f3d]">
              Tout Ayiti. Tout en un seul Maché.
            </div>
          </div>
        </Link>

        {/* SEARCH */}
        <div className="hidden md:flex">
          <input
            className="w-full rounded-xl border px-6 py-4"
            placeholder={t.searchPlaceholder}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-7 text-center">

          {/* ✅ FIX ICI */}
          <Link href="/dashboard/seller">
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

      {/* 🔻 NAV */}
      <nav className="bg-black text-white">
        <div className="container-page flex h-16 items-center gap-6">
          <Link href="/shop?sort=best">🔥 {t.bestSellers}</Link>
          <Link href="/shop?sort=new">🟢 {t.newArrivals}</Link>
          <Link href="/shop?promo=true">🏷️ {t.promotions}</Link>
          <Link href="/shop">▦ {t.catalog}</Link>
          <Link href="/legal/vendors">🏪 {t.sellers}</Link>
          <Link href="/shop?brands=true">🏅 {t.brands}</Link>
        </div>
      </nav>
    </header>
  );
}
