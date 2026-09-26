/*
  LE GRAND BANDEAU DE L'ACCUEIL, EN DÉFILEMENT.

  La première diapositive est TOUJOURS la carte d'Haïti : c'est
  l'identité de MACHÉ, et c'est elle que voit en premier quelqu'un qui
  arrive. Les suivantes défilent vers la gauche — nouveautés,
  partenaires, meilleures ventes, rayons fait main, fait maison, bio —
  et n'existent que si la donnée qui les justifie existe (voir
  `src/lib/medusa/home.ts`).

  Aucune image de stock. Les seules images sont la carte et le logo,
  qui appartiennent au projet, et les vraies photos des articles mis en
  ligne par les vendeurs.
*/

import Link from "next/link";
import { Slider } from "@/components/slider";
import type { HeroSlide } from "@/lib/medusa/home";

export type HeroCount = { label: string; value: number };

const chip =
  "inline-block rounded-[3px] px-2 py-1 text-xs font-bold uppercase tracking-widest";

const primaryButton =
  "rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-[var(--mache-primary-dark)]";

const secondaryButton =
  "rounded-[6px] border border-[var(--mache-text)] px-5 py-2.5 text-md font-bold text-[var(--mache-text)] transition-colors hover:bg-[var(--mache-text)] hover:text-white";

/* Les points du défilement sont posés en bas : chaque diapositive leur laisse la place. */
const frame = "container-page grid h-full items-center gap-6 py-8 pb-14 lg:py-12 lg:pb-16";

function MapSlide({ counts }: { counts: HeroCount[] }) {
  const shown = counts.filter((count) => count.value > 0);

  return (
    <div className="h-full bg-gradient-to-br from-white via-white to-[var(--mache-bg-2)]">
      <div className={`${frame} lg:grid-cols-[1.15fr_0.85fr]`}>
        <div>
          <span className={`${chip} bg-[var(--mache-primary)] text-white`}>
            Marketplace haïtienne
          </span>

          <h1 className="mt-4 text-hero font-black tracking-tightest text-[var(--mache-text)]">
            Acheter chez les vendeurs d&apos;Haïti,
            <br className="hidden sm:block" /> au même endroit.
          </h1>

          <p className="mt-4 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">
            Des boutiques indépendantes, des marques et des fournisseurs
            réunis sur une seule place de marché. Chaque vendeur garde sa
            boutique ; vous n&apos;avez qu&apos;un panier.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
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
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
              {shown.map((count) => (
                <div key={count.label}>
                  <dt className="text-xs font-semibold uppercase tracking-label text-[var(--mache-muted)]">
                    {count.label}
                  </dt>
                  <dd className="mt-0.5 text-2xl font-black leading-none text-[var(--mache-text)]">
                    {count.value}
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
            src="/images/carte-haiti-mache.png"
            alt="Carte d'Haïti aux couleurs de MACHÉ"
            className="w-full max-w-[420px] object-contain"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-haiti-mache-hibiscus.png"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-2 right-2 w-24 object-contain opacity-90"
          />
        </div>
      </div>
    </div>
  );
}

function ProductsSlide({ slide }: { slide: Extract<HeroSlide, { kind: "products" }> }) {
  return (
    <div className="h-full bg-gradient-to-br from-[var(--mache-primary-soft)] via-white to-white">
      <div className={`${frame} lg:grid-cols-[1fr_1fr]`}>
        <div>
          <span className={`${chip} bg-[var(--mache-text)] text-white`}>{slide.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-black tracking-tightest text-[var(--mache-text)] sm:text-4xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-[var(--mache-muted)]">{slide.text}</p>
          <div className="mt-6">
            <Link href={slide.href} className={primaryButton}>
              {slide.cta}
            </Link>
          </div>
        </div>

        {/* De vraies photos d'articles en ligne, chacune menant à sa fiche. */}
        <div className="grid grid-cols-4 gap-2 lg:ml-auto lg:w-full lg:max-w-[420px] lg:grid-cols-2 lg:gap-3">
          {slide.products.map((product) => (
            <Link
              key={product.href}
              href={product.href}
              className="group block overflow-hidden rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)]"
            >
              <div className="aspect-square overflow-hidden bg-[var(--mache-bg-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function PartnersSlide({ slide }: { slide: Extract<HeroSlide, { kind: "partners" }> }) {
  const [first] = slide.partners;

  return (
    <div className="h-full bg-[var(--mache-dark)] text-white">
      <div className={`${frame} lg:grid-cols-[1.1fr_0.9fr]`}>
        <div>
          <span className={`${chip} bg-white/10 text-white`}>Nos partenaires</span>
          <h2 className="mt-4 text-3xl font-black tracking-tightest sm:text-4xl">
            Ils travaillent avec MACHÉ
          </h2>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-white/75">
            {first.name} — {first.does.charAt(0).toLowerCase() + first.does.slice(1)}
            {!first.mediated && " En direct, selon ses propres critères."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={first.href} target="_blank" rel="noopener noreferrer" className={primaryButton}>
              Découvrir {first.name} <span aria-hidden="true">↗</span>
              <span className="sr-only"> (site externe)</span>
            </a>
            <Link
              href="/partenaires"
              className="rounded-[6px] border border-white/60 px-5 py-2.5 text-md font-bold text-white transition-colors hover:bg-white hover:text-[var(--mache-dark)]"
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
              className="block rounded-[12px] border border-white/15 bg-white/5 p-6 transition-colors hover:bg-white/10"
            >
              <span className="block text-4xl font-black tracking-tightest">{partner.name}</span>
              <span className="mt-2 block text-base text-white/70">{partner.does}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function InviteSlide({ slide }: { slide: Extract<HeroSlide, { kind: "invite" }> }) {
  return (
    <div className="h-full bg-gradient-to-br from-[var(--mache-gold-soft)] via-white to-white">
      <div className={`${frame} lg:grid-cols-[1.1fr_0.9fr]`}>
        <div>
          <span className={`${chip} bg-[var(--mache-gold)] text-white`}>{slide.eyebrow}</span>
          <h2 className="mt-4 text-3xl font-black tracking-tightest text-[var(--mache-text)] sm:text-4xl">
            {slide.title}
          </h2>
          <p className="mt-3 max-w-lg text-md leading-relaxed text-[var(--mache-muted)]">{slide.text}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/sell" className={primaryButton}>
              Ouvrir ma boutique
            </Link>
            <Link href={slide.rayonHref} className={secondaryButton}>
              Voir le rayon
            </Link>
          </div>
        </div>

        {/*
          Ce qu'on y trouvera : ses vrais sous-rayons, qui existent au
          catalogue. Aucun article n'est montré, puisqu'il n'y en a pas
          encore.
        */}
        <div className="rounded-[12px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-6">
          {slide.icon && (
            <span className="text-5xl" aria-hidden="true">
              {slide.icon}
            </span>
          )}
          <p className="mt-3 text-sm font-semibold uppercase tracking-label text-[var(--mache-muted)]">
            Ce qu&apos;on y rangera
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {slide.subLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-[6px] border border-[var(--mache-line)] px-3 py-1.5 text-sm font-medium text-[var(--mache-text)] hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel({ slides, counts }: { slides: HeroSlide[]; counts: HeroCount[] }) {
  return (
    <section className="border-b border-[var(--mache-line)]">
      <Slider variant="hero" label="À la une sur MACHÉ" autoplayMs={7000}>
        <MapSlide counts={counts} />
        {slides.map((slide) => {
          if (slide.kind === "products") return <ProductsSlide key={slide.key} slide={slide} />;
          if (slide.kind === "partners") return <PartnersSlide key={slide.key} slide={slide} />;
          return <InviteSlide key={slide.key} slide={slide} />;
        })}
      </Slider>
    </section>
  );
}
