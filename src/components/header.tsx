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

      {/* TICKER ROUGE */}
      <div className="overflow-hidden bg-[#d20a1e] py-2 text-sm font-black uppercase tracking-wide text-white">
        <div className="mache-ticker flex w-max gap-12 whitespace-nowrap">
          {[...tickerTranslations[lang], ...tickerTranslations[lang]].map(
            (item, index) => (
              <a
                key={`${item}-${index}`}
                href={tickerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                ✦ {item}
              </a>
            )
          )}
        </div>
      </div>

      {/* LIGNE LIVRAISON → NOIRE */}
      <div className="border-b bg-black text-base font-semibold text-white">
        <div className="container-page flex h-10 items-center justify-between">
          <div>🚚 {t.delivery}</div>

          <div className="flex items-center gap-5">
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              className="bg-transparent font-bold text-white outline-none"
            >
              <option value="fr">FR</option>
              <option value="ht">HT</option>
            </select>

            <select className="bg-transparent font-bold text-white outline-none">
              <option>HTG</option>
              <option>USD</option>
              <option>CAD</option>
            </select>

            <Link href="/login">{t.login}</Link>
            <Link href="/register">{t.register}</Link>
          </div>
        </div>
      </div>

      {/* LOGO + SEARCH */}
      <div className="bg-white">
        <div className="container-page grid min-h-[120px] grid-cols-[260px_1fr_280px] items-center gap-8 py-5">
          <Link href="/" className="flex items-center gap-4">
            <img
              src="/images/logo-haiti-mache-hibiscus.png"
              alt="Logo Maché"
              className="h-20 w-20 object-contain"
            />

            <div>
              <div className="text-5xl font-black leading-none tracking-[-0.06em] text-[#071f3d]">
                Maché
              </div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#071f3d]">
                Tout Ayiti. Tout en un seul Maché.
              </div>
            </div>
          </Link>

          <div className="hidden md:flex">
            <div className="flex w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <input
                className="flex-1 px-6 py-4 text-sm text-[#071f3d] outline-none"
                placeholder={t.searchPlaceholder}
              />
              <button className="bg-[#d20a1e] px-7 text-2xl text-white">
                🔍
              </button>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-7 text-center font-bold text-[#071f3d] md:flex">
            <Link href="/dashboard/user" className="text-sm">
              <div className="text-3xl">👤</div>
              {t.account}
            </Link>

            <Link href="/favorites" className="text-sm">
              <div className="text-3xl">♡</div>
              {t.favorites}
            </Link>

            <button onClick={openCart} className="relative text-sm">
              <div className="text-3xl">🛍️</div>
              {t.cart}
              <span className="absolute -right-3 -top-2 rounded-full bg-[#d20a1e] px-2 py-0.5 text-xs text-white">
                {count}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MENU → NOIR + TEXTE AGRANDI */}
      <nav className="bg-black text-white">
        <div className="container-page flex h-16 items-center justify-between gap-4 overflow-x-auto whitespace-nowrap text-base font-black uppercase">
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
