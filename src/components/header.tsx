"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { SocialLinks } from "@/components/social-links";
import { CurrencyPicker } from "@/components/currency-picker";
import { BagIcon, BoxIcon, GridIcon, HeartIcon, HelpIcon, MapIcon, SearchIcon, ShieldIcon, SparkIcon, StoreIcon, TruckIcon, UserIcon } from "@/components/icons";
import type { SitePromotion } from "@/lib/medusa/promotions";

/*
  Le bandeau défilant renvoie vers Bawon, et annonce ses services.

  « Paiement sécurisé » en a été retiré. Affichée dans l'en-tête de
  MACHE, sur chaque page, cette mention se lit comme une promesse de
  MACHE — or MACHE n'encaisse rien : le paiement se fait en main propre
  à la livraison. Un client qui la lisait pouvait croire que ses données
  bancaires seraient protégées par un dispositif qui n'existe pas.

  Le bandeau porte désormais les promotions en cours de MACHE, et rien
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
    sellers: "Vendre sur MACHE",
    verifyAgent: "Vérifier un agent",
    findSupplier: "Trouver un fournisseur",
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
    sellers: "Vann sou MACHE",
    verifyAgent: "Verifye yon ajan",
    findSupplier: "Jwenn yon founisè",
    help: "Èd"
  }
};

type Lang = keyof typeof translations;

/* Les services de la bande défilante du haut. */
const SERVICES = [
  { key: "track", Icon: TruckIcon, href: "/dashboard/buyer/orders" },
  { key: "verifyAgent", Icon: ShieldIcon, href: "/verify-agent" },
  { key: "openShop", Icon: StoreIcon, href: "/sell" },
  /* Les boutiques qui se déclarent fournisseur ou grossiste. */
  { key: "findSupplier", Icon: BoxIcon, href: "/gros" },
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
        de MACHE — pas celles d'une boutique, qui lui donneraient une
        vitrine que les autres n'ont pas.

        Aucune promotion : pas de bandeau. Plutôt que d'inventer une
        remise pour meubler, ou de laisser une bande rouge vide qui
        n'est que du bruit. Et cela lui rend son sens : s'il est là,
        c'est qu'il y a quelque chose.
      */}
      {promotions.length > 0 && (
        <div className="overflow-hidden bg-[var(--mache-primary)] py-2 text-sm font-semibold text-white">
          <div className="mache-ticker flex w-max gap-12 whitespace-nowrap">
            {[...promotions, ...promotions].map((promotion, index) => (
              <Link
                key={`${promotion.id}-${index}`}
                href="/shop"
                className="hover:text-black hover:underline"
              >
                {promotion.label}
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
      <div className="bg-[var(--mache-dark)] text-white">
        <div className="flex h-9 items-center">
          <div className="relative min-w-0 flex-1 overflow-hidden">
            {/*
              Assez de copies pour couvrir tout l'écran : avec une seule
              série de services, la bande laissait un grand vide avant de
              revenir au début. Six séries de quatre : la même longueur
              qu'avant l'ajout de « Trouver un fournisseur », donc la même
              vitesse. Un nombre pair, pour que la boucle se referme.
              Seule la première série est lue : les copies sont cachées
              aux lecteurs d'écran.
            */}
            <div className="mache-ticker mache-ticker-fast flex w-max items-center whitespace-nowrap text-sm font-medium">
              {Array.from({ length: 6 }).flatMap((_, copy) =>
                SERVICES.map((service) => (
                  <Link
                    key={`${copy}-${service.href}`}
                    href={service.href}
                    aria-hidden={copy > 0 ? true : undefined}
                    tabIndex={copy > 0 ? -1 : undefined}
                    className="inline-flex items-center gap-2 px-8 hover:text-[var(--mache-primary-strong)] hover:underline"
                  >
                    <service.Icon className="h-4 w-4" /> {t[service.key]}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/*
            Les réseaux de MACHE, fixes eux aussi. Masqués sur téléphone,
            où la bande n'a pas la place : ils sont dans le pied de page.
          */}
          <SocialLinks className="hidden shrink-0 border-l border-white/20 pl-4 sm:flex" size={17} />

          <div className="shrink-0 pl-4">
            <CurrencyPicker />
          </div>

          <div className="shrink-0 px-4">
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              aria-label="Langue"
              className="bg-[var(--mache-dark)] text-sm text-white outline-none"
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
            src="/images/logo-mache.webp"
            alt="Logo Mache"
            width={80}
            height={80}
            fetchPriority="high"
            className="h-12 w-12 shrink-0 md:h-20 md:w-20"
          />

          <div className="min-w-0">
            <div className="font-display text-3xl font-semibold leading-none tracking-tight text-[var(--mache-navy)] md:text-4xl">
              Mache
            </div>

            <div className="mt-1.5 hidden text-xs font-medium text-[var(--mache-muted)] sm:block">
              Tout Ayiti. Tout en un seul Mache.
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
            className="w-full rounded-l-[6px] border border-r-0 border-[var(--mache-line)] bg-[var(--mache-white)] px-4 py-3"
            placeholder={t.searchPlaceholder}
          />
          <button
            type="submit"
            className="rounded-r-[6px] bg-[var(--mache-primary)] px-5 py-3 font-semibold text-white hover:bg-[var(--mache-primary-dark)]"
            aria-label="Rechercher"
          >
            <SearchIcon className="mx-auto h-5 w-5" />
          </button>
        </form>

        <div className="flex justify-end gap-4 text-center text-sm md:gap-7">
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
            <UserIcon className="mx-auto mb-0.5 h-6 w-6" />
            {t.account}
          </Link>

          <Link href="/favorites">
            <HeartIcon className="mx-auto mb-0.5 h-6 w-6" />
            {t.favorites}
          </Link>

          <Link href="/cart">
            <BagIcon className="mx-auto mb-0.5 h-6 w-6" />
            {t.cart} ({count})
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
    <nav className="bg-[var(--mache-dark)] text-white">
        <div className="container-page flex h-14 items-center gap-8 overflow-x-auto whitespace-nowrap text-base font-medium">
          <Link href="/shop" className="inline-flex items-center gap-2">
            <GridIcon className="h-5 w-5" /> {t.catalog}
          </Link>

          <Link href="/shop?sort=recent" className="inline-flex items-center gap-2">
            <SparkIcon className="h-5 w-5" /> {t.newArrivals}
          </Link>

          <Link href="/gros" className="inline-flex items-center gap-2">
            <BoxIcon className="h-5 w-5" /> {t.wholesale}
          </Link>

          <Link href="/haiti" className="inline-flex items-center gap-2">
            <MapIcon className="h-5 w-5" /> {t.regions}
          </Link>

          <Link href="/sell" className="inline-flex items-center gap-2">
            <StoreIcon className="h-5 w-5" /> {t.sellers}
          </Link>

          <Link href="/verify-agent" className="inline-flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" /> {t.verifyAgent}
          </Link>

          <Link href="/contact" className="inline-flex items-center gap-2">
            <HelpIcon className="h-5 w-5" /> {t.help}
          </Link>
        </div>
    </nav>
  );
}
