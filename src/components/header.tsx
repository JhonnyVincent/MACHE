"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
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
    track: "Suivre ma livraison",
    openShop: "Ouvrir une boutique",
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
    track: "Swiv livrezon mwen",
    openShop: "Louvri yon boutik",
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

/* Les services de la bande défilante du haut. */
const SERVICES = [
  { key: "track", icon: "🚚", href: "/dashboard/buyer/orders" },
  { key: "verifyAgent", icon: "✅", href: "/verify-agent" },
  { key: "openShop", icon: "🏪", href: "/sell" },
] as const;

/* La langue choisie, lue dans son cookie. */
function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const saved = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mache_locale="))
      ?.split("=")[1] as Lang | undefined;

    if (saved && translations[saved]) setLang(saved);
  }, []);

  return lang;
}

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
  const pathname = usePathname();

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

      {/*
        LA BANDE NOIRE DU HAUT DÉFILE EN CONTINU, DE DROITE À GAUCHE.

        Elle porte les trois services qu'on cherche sans savoir où ils
        sont : suivre sa livraison, vérifier un agent, ouvrir une
        boutique. Elle s'arrête au survol (pour pouvoir cliquer), et
        reste immobile pour qui a demandé moins d'animations.

        La langue reste à droite, fixe : un sélecteur qui défile ne
        s'attrape pas.
      */}
      <div className="border-b bg-black text-white">
        <div className="flex h-10 items-center">
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="mache-ticker mache-ticker-fast flex w-max gap-16 whitespace-nowrap text-sm">
              {[0, 1].flatMap((copy) =>
                SERVICES.map((service) => (
                  <Link
                    key={`${copy}-${service.href}`}
                    href={service.href}
                    aria-hidden={copy === 1 ? true : undefined}
                    tabIndex={copy === 1 ? -1 : undefined}
                    className="hover:text-[var(--mache-primary-strong)] hover:underline"
                  >
                    {service.icon} {t[service.key]}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="shrink-0 px-4">
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              aria-label="Langue"
              className="bg-black text-white outline-none"
            >
              <option value="fr">FR</option>
              <option value="ht">HT</option>
            </select>
          </div>
        </div>
      </div>

      {/*
        Trois colonnes sur grand écran, deux sur téléphone.

        Les colonnes étaient figées à 260 et 280 pixels, sur tous les
        écrans : sur un téléphone de 390 pixels, « Mon compte », « Favoris »
        et « Panier » débordaient jusqu'à 516 pixels — et comme la page
        masque ce qui dépasse, le panier était coupé, hors d'atteinte.
      */}
      <div className="container-page grid grid-cols-[1fr_auto] items-center gap-4 py-3 md:grid-cols-[260px_1fr_280px] md:gap-8 md:py-5">
        <Link href="/" className="flex min-w-0 items-center gap-2 md:gap-4">
          <img
            src="/images/logo-haiti-mache-hibiscus.png"
            alt="Logo Maché"
            className="h-12 w-12 shrink-0 md:h-20 md:w-20"
          />

          <div className="min-w-0">
            <div className="text-2xl font-black tracking-tightest text-[#071f3d] md:text-4xl">
              Maché
            </div>

            <div className="hidden text-xs font-black uppercase text-[#071f3d] sm:block">
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

        <div className="flex justify-end gap-4 text-center text-sm md:gap-7 md:text-base">
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

      {/*
        Sur l'accueil, le menu noir descend sous le grand bandeau (voir
        src/app/page.tsx). Partout ailleurs, il reste ici.
      */}
      {pathname !== "/" && <MainNav />}
    </header>
  );
}

/*
  LE MENU NOIR. Exporté pour que l'accueil le place sous son grand
  bandeau ; ailleurs, l'en-tête l'affiche lui-même.
*/
export function MainNav() {
  const lang = useLang();
  const t = translations[lang];

  return (
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
  );
}
