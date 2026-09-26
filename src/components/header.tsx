"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/*
  Le bandeau défilant renvoie vers Bawon, et annonce ses services.

  « Paiement sécurisé » en a été retiré. Affichée dans l'en-tête de
  MACHÉ, sur chaque page, cette mention se lit comme une promesse de
  MACHÉ — or MACHÉ n'encaisse rien : le paiement se fait en main propre
  à la livraison. Un client qui la lisait pouvait croire que ses données
  bancaires seraient protégées par un dispositif qui n'existe pas.

  Les cinq autres mentions décrivent des services de Bawon, ce que le
  lien indique.
*/
const tickerTranslations = {
  fr: [
    "Trouver un exportateur / importateur",
    "Trouver un financement",
    "Se faire accompagner pour créer son entreprise",
    "Investir dans des projets",
    "Développer son entreprise"
  ],
  ht: [
    "Jwenn yon ekspòtatè / enpòtatè",
    "Jwenn finansman",
    "Jwenn sipò pou kreye biznis ou",
    "Envesti nan pwojè",
    "Devlope biznis ou"
  ]
};

/*
  LE BANDEAU NE POINTE PLUS NULLE PART, ET C'EST VOULU.

  Il renvoyait chaque ligne vers un ancien déploiement de BAWON, retiré
  depuis : les liens seraient tombés dans le vide.

  Et on ne les a pas repointés vers une page de MACHÉ. Ces lignes —
  trouver un financement, investir dans des projets, se faire
  accompagner pour créer son entreprise — sont des services de BAWON.
  Les faire mener à MACHÉ reviendrait à lui faire promettre du
  financement et de l'accompagnement qu'il n'offre pas. Un lien mort
  est ennuyeux ; une promesse fausse coûte la confiance d'un commerçant
  qui l'aura crue.

  Le texte reste : il annonce ce que l'écosystème propose. Dès que la
  nouvelle adresse de BAWON est connue, il suffit de la remettre ici et
  de redonner leur lien aux lignes.
*/

const translations = {
  fr: {
    delivery: "Livraison partout en Haïti",
    searchPlaceholder: "Rechercher un produit, une boutique...",
    login: "Se connecter",
    register: "S’inscrire",
    sellerLogin: "Espace vendeur",
    account: "Mon compte",
    favorites: "Favoris",
    cart: "Panier",
    newArrivals: "Nouveautés",
    catalog: "Tout le catalogue",
    wholesale: "Acheter en gros",
    regions: "Haïti",
    sellers: "Vendre sur MACHÉ",
    verifyAgent: "Vérifier un agent",
    help: "Aide"
  },
  ht: {
    delivery: "Livrezon toupatou an Ayiti",
    searchPlaceholder: "Chèche yon pwodwi, yon boutik...",
    login: "Konekte",
    register: "Kreye kont",
    sellerLogin: "Espas vandè",
    account: "Kont mwen",
    favorites: "Favori",
    cart: "Panye",
    newArrivals: "Nouvo pwodwi",
    catalog: "Tout katalòg la",
    wholesale: "Achte an gwo",
    regions: "Ayiti",
    sellers: "Vann sou MACHÉ",
    verifyAgent: "Verifye yon ajan",
    help: "Èd"
  }
};

type Lang = keyof typeof translations;

/*
  Le compteur du panier est passé par le serveur.

  Il lisait auparavant le panier stocké dans le navigateur. Depuis que le
  panier vit dans Medusa, cette lecture serait restée bloquée à zéro
  pendant que le vrai panier se remplissait : deux compteurs, deux
  vérités, et le client croit avoir perdu ses articles.
*/
export function Header({ cartCount = 0 }: { cartCount?: number }) {
  const count = cartCount;

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
      <div className="overflow-hidden bg-[#d20a1e] py-2 text-sm font-black uppercase tracking-label text-white">
        <div className="mache-ticker flex w-max gap-12 whitespace-nowrap">
          {[...tickerTranslations[lang], ...tickerTranslations[lang]].map(
            (item, index) => (
              <span key={`${item}-${index}`}>✦ {item}</span>
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

            <Link href="/compte/connexion">
              {t.login}
            </Link>

            <Link href="/compte/inscription">
              {t.register}
            </Link>

            {/*
              La porte des vendeurs, nommée. Le bandeau ne proposait que
              la connexion acheteur : un commerçant s'y connectait, puis
              cherchait sa boutique dans un espace client qui n'en a
              aucune.
            */}
            <Link href="/dashboard/seller/connexion" className="font-semibold">
              {t.sellerLogin}
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
            <div className="text-4xl font-black tracking-tightest text-[#071f3d]">
              Maché
            </div>

            <div className="text-xs font-black uppercase text-[#071f3d]">
              Tout Ayiti. Tout en un seul Maché.
            </div>
          </div>
        </Link>

        <form action="/shop" method="GET" className="hidden w-full md:flex">
          <label htmlFor="site-search" className="sr-only">
            {t.searchPlaceholder}
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            className="w-full rounded-l-xl border border-r-0 px-6 py-4"
            placeholder={t.searchPlaceholder}
          />
          <button
            type="submit"
            className="rounded-r-xl bg-[var(--mache-primary)] px-6 py-4 font-bold text-white"
            aria-label="Rechercher"
          >
            🔍
          </button>
        </form>

        <div className="flex justify-end gap-7 text-center">
          <Link href="/dashboard/buyer">
            <div>👤</div>
            {t.account}
          </Link>

          <Link href="/favorites">
            <div>♡</div>
            {t.favorites}
          </Link>

          <Link href="/cart">
            🛍️ {t.cart} ({count})
          </Link>
        </div>
      </div>

      <nav className="bg-black text-white">
        <div className="container-page flex h-16 items-center gap-6 overflow-x-auto whitespace-nowrap">
          <Link href="/shop">
            ▦ {t.catalog}
          </Link>

          <Link href="/shop?sort=recent">
            🟢 {t.newArrivals}
          </Link>

          <Link href="/gros">
            📦 {t.wholesale}
          </Link>

          <Link href="/haiti">
            🗺️ {t.regions}
          </Link>

          <Link href="/sell">
            🏪 {t.sellers}
          </Link>

          <Link href="/verify-agent">
            ✅ {t.verifyAgent}
          </Link>

          <Link href="/contact">
            🎧 {t.help}
          </Link>
        </div>
      </nav>
    </header>
  );
}
