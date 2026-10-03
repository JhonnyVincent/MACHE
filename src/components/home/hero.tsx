/*
  LE GRAND BANDEAU DE L'ACCUEIL, EN DÉFILEMENT.

  La première diapositive est TOUJOURS la carte d'Haïti : c'est
  l'identité de MACHE, et c'est elle que voit en premier quelqu'un qui
  arrive. Les suivantes défilent vers la gauche — nouvelles boutiques
  (en grille), promotions, partenaires — et n'existent que si la donnée qui les justifie existe (voir
  `src/lib/medusa/home.ts`).

  Aucune image de stock. Les seules images sont la carte et le logo,
  qui appartiennent au projet, les logos que les boutiques ont
  déposés, et les vraies photos des articles mis en ligne.
*/

import { Link } from "next-view-transitions";
import { Slider } from "@/components/slider";
import type { HeroSlide } from "@/lib/medusa/home";
import { CountUp } from "@/components/anim/count-up";

export type HeroCount = { label: string; value: number };

/* Une petite ligne d'introduction au-dessus du titre : du texte, pas une pastille. */
const chip = "inline-block text-sm font-semibold tracking-label";

const primaryButton =
  "inline-flex items-center rounded-[6px] bg-[var(--mache-primary)] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)]";

const secondaryButton =
  "inline-flex items-center rounded-[6px] border border-[var(--mache-text)] px-5 py-3 text-base font-semibold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white";

/* Les points du défilement sont posés en bas : chaque diapositive leur laisse la place. */
const frame = "container-page grid h-full items-center gap-6 py-8 pb-14 lg:py-12 lg:pb-16";

/* Fond blanc franc : celui de la carte. Image et page ne font qu'un. */
function MapSlide({ counts }: { counts: HeroCount[] }) {
  const shown = counts.filter((count) => count.value > 0);

  return (
    <div className="h-full bg-white">
      <div className={`${frame} lg:grid-cols-[1.15fr_0.85fr]`}>
        <div>
          <span className={`${chip} text-[var(--mache-primary)]`}>Marketplace haïtienne</span>

          <h1 className="mt-3 text-hero text-[var(--mache-text)]">
            Acheter chez les vendeurs d&apos;Haïti,
            <br className="hidden sm:block" /> au même endroit.
          </h1>

          <p className="mt-5 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">
            Des boutiques indépendantes, des marques et des fournisseurs
            réunis sur une seule place de marché. Chaque vendeur garde sa
            boutique ; vous n&apos;avez qu&apos;un panier.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={primaryButton}>
              Voir le catalogue
            </Link>
            <Link href="/sell" className={secondaryButton}>
              Ouvrir ma boutique
            </Link>
          </div>

          {/*
            Compteurs tirés de ce qui a réellement été chargé. À zéro, ils
            ne s'affichent pas : « 0 boutique » en gros sur l'accueil
            n'aide personne, et un chiffre rond inventé encore moins.
          */}
          {shown.length > 0 && (
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-3 border-t border-[var(--mache-line)] pt-5">
              {shown.map((count) => (
                <div key={count.label}>
                  <dt className="text-sm text-[var(--mache-muted)]">
                    {count.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold leading-none text-[var(--mache-text)]">
                    <CountUp value={count.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/*
          Les deux seuls visuels réellement possédés par le projet : le
          logo hibiscus et la carte d'Haïti.
        */}
        <div className="relative hidden justify-center lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/carte-haiti-mache.webp"
            width={1000}
            height={800}
            alt="Carte d'Haïti aux couleurs de MACHE"
            className="w-full max-w-[460px] object-contain mix-blend-multiply"
          />
        </div>
      </div>
    </div>
  );
}

/*
  NOS NOUVELLES BOUTIQUES, EN GRILLE. Le logo quand la boutique en a
  un, ses initiales sinon — jamais un visuel inventé.
*/
function ShopsSlide({ slide }: { slide: Extract<HeroSlide, { kind: "shops" }> }) {
  return (
    <div className="h-full bg-[var(--mache-bg-2)]">
      <div className={`${frame} lg:grid-cols-[0.9fr_1.1fr]`}>
        <div>
          <span className={`${chip} text-[var(--mache-muted)]`}>Nouvelles boutiques</span>
          <h2 className="mt-3 text-3xl text-[var(--mache-text)] sm:text-4xl">
            Ils viennent d&apos;ouvrir sur MACHE
          </h2>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-[var(--mache-muted)]">
            Des vendeurs d&apos;Haïti et de la diaspora, chacun avec sa boutique.
          </p>
          <div className="mt-6">
            <Link href="/shop" className={primaryButton}>
              Voir leurs articles
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
          {slide.sellers.map((seller) => (
            <li key={seller.id}>
              <Link
                href={`/store/${seller.handle}`}
                className="flex h-full flex-col items-center gap-2 rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-3 text-center transition-transform duration-200 hover:shadow-card-hover motion-reduce:transform-none"
              >
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-base font-black text-[var(--mache-muted)]">
                  {seller.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img loading="lazy" decoding="async" src={seller.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    seller.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="line-clamp-2 text-sm font-semibold text-[var(--mache-text)]">{seller.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/*
  NOS PROMOTIONS : les codes de MACHE réellement actifs, et de vraies
  photos d'articles réellement moins chers que d'habitude. Rien
  d'autre : pas de « −50 % » décoratif.
*/
function PromotionsSlide({ slide }: { slide: Extract<HeroSlide, { kind: "promotions" }> }) {
  return (
    <div className="h-full bg-[var(--mache-primary)] text-white">
      <div className={`${frame} lg:grid-cols-[1fr_1fr]`}>
        <div>
          <span className={`${chip} text-white/80`}>Nos promotions</span>
          <h2 className="mt-3 text-3xl sm:text-4xl">En ce moment sur MACHE</h2>
          {slide.labels.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {slide.labels.map((label) => (
                <li key={label} className="rounded-[6px] bg-white/15 px-3 py-1.5 text-md font-bold">
                  {label}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <Link
              href="/shop?sort=deals"
              className="rounded-[6px] bg-white px-5 py-2.5 text-md font-bold text-[var(--mache-primary)] transition-opacity hover:opacity-90"
            >
              Voir les promotions
            </Link>
          </div>
        </div>

        {slide.products.length > 0 && (
          <div className="grid grid-cols-4 gap-2 lg:ml-auto lg:w-full lg:max-w-[420px] lg:grid-cols-2 lg:gap-3">
            {slide.products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group block overflow-hidden rounded-[8px] bg-white"
              >
                <div className="aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 "
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnersSlide({ slide }: { slide: Extract<HeroSlide, { kind: "partners" }> }) {
  const [first] = slide.partners;

  return (
    /* Fond bleu soutenu — ni ciel ni nuit —, voulu par MACHE pour les partenaires. */
    <div className="h-full bg-[var(--mache-navy)] text-white">
      <div className={`${frame} lg:grid-cols-[1.1fr_0.9fr]`}>
        <div>
          <span className={`${chip} text-white/70`}>Nos partenaires</span>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Ils travaillent avec MACHE
          </h2>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-white/75">
            {first.name} : {first.does.charAt(0).toLowerCase() + first.does.slice(1)}
            {!first.mediated && " En direct, selon ses propres critères."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={first.href} target="_blank" rel="noopener noreferrer" className={primaryButton}>
              Découvrir {first.name} <span aria-hidden="true">↗</span>
              <span className="sr-only"> (site externe)</span>
            </a>
            <Link
              href="/partenaires"
              className="rounded-[6px] border border-white/60 px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-white hover:text-[var(--mache-navy)]"
            >
              Tous nos partenaires
            </Link>
          </div>
        </div>

        {/* Des noms, pas de logos : afficher une marque demande un accord écrit. */}
        <div className="grid gap-3">
          {slide.partners.slice(0, 3).map((partner) => (
            <a
              key={partner.name}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[8px] border border-white/20 p-6 transition-colors hover:bg-white/10"
            >
              <span className="block font-display text-3xl font-semibold">{partner.name}</span>
              <span className="mt-2 block text-base text-white/70">{partner.does}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel({ slides, counts }: { slides: HeroSlide[]; counts: HeroCount[] }) {
  return (
    <section>
      <Slider variant="hero" label="À la une sur MACHE" autoplayMs={7000}>
        <MapSlide counts={counts} />
        {slides.map((slide) => {
          if (slide.kind === "shops") return <ShopsSlide key={slide.key} slide={slide} />;
          if (slide.kind === "promotions") return <PromotionsSlide key={slide.key} slide={slide} />;
          return <PartnersSlide key={slide.key} slide={slide} />;
        })}
      </Slider>
    </section>
  );
}
