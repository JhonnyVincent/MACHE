"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SitePromotion } from "@/lib/medusa/promotions";

/*
  Le bandeau défilant renvoie vers Bawon, et annonce ses services.

  « Paiement sécurisé » en a été retiré. Affichée dans l'en-tête de
  MACHÉ, sur chaque page, cette mention se lit comme une promesse de
  MACHÉ — or MACHÉ n'encaisse rien : le paiement se fait en main propre
  à la livraison. Un client qui la lisait pouvait croire que ses données
  bancaires seraient protégées par un dispositif qui n'existe pas.

  Le bandeau porte désormais les promotions en cours de MACHÉ, et rien
  d'autre : voir plus bas.
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
export function Header({ cartCount = 0,
  promotions = [],
}: { cartCount?: number;
  promotions?: SitePromotion[];
}) {
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
      {/*
        LE BANDEAU NE DIT QUE DES CHOSES VRAIES, OU RIEN.

        Il annonçait un texte écrit en dur, identique depuis des mois.
        Un bandeau qui ne change jamais cesse d'être lu : on apprend en
        trois visites qu'il ne dit rien de neuf, et le jour où il
        annonce une vraie remise, plus personne ne le regarde.

        Il porte maintenant les promotions RÉELLEMENT en cours, celles
        de MACHÉ — pas celles d'une boutique, qui lui donneraient une
        vitrine que les autres n'ont pas.

        Aucune promotion : pas de bandeau. Plutôt que d'inventer une
        remise pour meubler, ou de laisser une bande rouge vide qui
        n'est que du bruit. Et cela lui rend son sens : s'il est là,
        c'est qu'il y a quelque chose.
      */}
      {promotions.length > 0 && (
        <div className="overflow-hidden bg-[var(--mache-primary)] py-2 text-sm font-black uppercase tracking-label text-white">
          <div className="mache-ticker flex w-max gap-12 whitespace-nowrap">
            {[...promotions, ...promotions].map((promotion, index) => (
              <Link
                key={`${promotion.id}-${index}`}
                href="/shop"
                className="hover:text-black hover:underline"
              >
                ✦ {promotion.label}
              </Link>
            ))}
          </div>
        </div>
      )}

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
          {/*
            UNE SEULE PORTE, ET ELLE AIGUILLE.

            Il y en avait quatre qui se chevauchaient : « Se connecter »,
            « S'inscrire » et « Espace vendeur » dans la barre du haut,
            plus « Mon compte » ici. Un commerçant cliquait sur la
            première, se retrouvait dans un espace client sans boutique,
            et concluait que son compte était cassé.

            Celle-ci mène à /dashboard, qui demande à chaque espace qui
            vous êtes et vous y envoie — et qui montre les portes si vous
            n'êtes connecté nulle part. Personne n'a plus à deviner
            laquelle est la sienne.
          */}
          <Link href="/dashboard">
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
