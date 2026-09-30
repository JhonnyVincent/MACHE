/*
  LES RANGÉES DU BAS DE L'ACCUEIL, DANS L'ORDRE VOULU PAR MACHE :

  - Nouveautés : trois rangées de six, les derniers articles en ligne ;
  - Nouvelles boutiques, puis Nos suggestions : elles défilent seules,
    de droite à gauche ;
  - la FAQ, juste avant le pied de page.

  Composants serveur : les données arrivent déjà chargées
  (src/lib/medusa/home.ts). Aucun article, aucune boutique n'est
  inventé pour remplir une rangée : il y en a moins, la rangée est plus
  courte ; il n'y en a pas, elle n'apparaît pas.
*/

import type { ReactNode } from "react";
import { Link } from "next-view-transitions";
import { VerifiedBadge } from "@/components/verified-badge";
import { ProductCard } from "@/components/home/rails";
import { HOME_FAQ } from "@/lib/faq";
import type { StoreProduct, StoreSeller } from "@/lib/medusa/catalog";

function Heading({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="container-page mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[var(--mache-muted)]">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="text-base font-semibold text-[var(--mache-primary)] hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Nouveautés : trois rangées de six                                          */
/* -------------------------------------------------------------------------- */

/*
  Toujours trois rangées, quelle que soit la largeur : six articles sur
  téléphone (deux par rangée), douze sur tablette, dix-huit sur
  ordinateur. Les autres restent dans « Toutes les nouveautés ».
*/
function visibility(index: number) {
  if (index >= 12) return "hidden lg:block";
  if (index >= 6) return "hidden sm:block";
  return "";
}

export function NewArrivals({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mache-reveal py-6">
      <Heading
        title="Nouveautés"
        subtitle="Les derniers articles mis en ligne sur MACHE"
        href="/shop?sort=recent"
        linkLabel="Toutes les nouveautés"
      />
      <ul className="container-page grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {products.slice(0, 18).map((product, index) => (
          <li key={product.id} className={visibility(index)}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Défilement continu, de droite à gauche                                     */
/* -------------------------------------------------------------------------- */

/*
  La rangée est répétée pour que la boucle se referme sans à-coup. Les
  copies sont cachées aux lecteurs d'écran et hors du parcours au
  clavier ; elles disparaissent pour qui a demandé moins d'animations,
  et la rangée se fait alors glisser à la main.

  Le défilement s'arrête au survol et quand un lien de la rangée a le
  focus clavier.
*/
function Marquee<T>({
  label,
  items,
  keyOf,
  render,
  itemClassName,
}: {
  label: string;
  items: T[];
  keyOf: (item: T) => string;
  render: (item: T, hidden: boolean) => ReactNode;
  itemClassName: string;
}) {
  /* Assez d'éléments pour couvrir un grand écran, et un nombre pair de copies. */
  const copies = Math.max(2, Math.ceil(10 / items.length) * 2);

  return (
    <div role="region" aria-label={label} className="overflow-hidden motion-reduce:overflow-x-auto">
      <ul className="mache-marquee mache-marquee-medium mache-spotlight flex w-max py-4">
        {Array.from({ length: copies }).flatMap((_, copy) =>
          items.map((item) => (
            <li
              key={`${copy}-${keyOf(item)}`}
              aria-hidden={copy > 0 ? true : undefined}
              className={`shrink-0 pr-4 ${itemClassName} ${copy > 0 ? "motion-reduce:hidden" : ""}`}
            >
              {render(item, copy > 0)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/* Nouvelles boutiques : de grandes cartes, la bannière en haut. */
export function NewShopsMarquee({ sellers }: { sellers: StoreSeller[] }) {
  if (sellers.length === 0) return null;

  return (
    <section className="mache-reveal py-6">
      <Heading
        title="Nouvelles boutiques"
        subtitle="Les vendeurs qui viennent d'ouvrir sur MACHE"
        href="/shop"
        linkLabel="Tout le catalogue"
      />
      <Marquee
        label="Nouvelles boutiques"
        items={sellers}
        keyOf={(seller) => seller.id}
        itemClassName="w-[300px] sm:w-[380px]"
        render={(seller, hidden) => (
          <Link
            href={`/store/${seller.handle}`}
            tabIndex={hidden ? -1 : undefined}
            className="group block h-full overflow-hidden rounded-[12px] border border-[var(--mache-line)] bg-[var(--mache-white)] transition-shadow hover:shadow-[0_10px_28px_rgba(16,24,32,0.14)]"
          >
            <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[var(--mache-primary-soft)] to-[var(--mache-bg-2)] sm:h-48">
              {seller.banner ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={seller.banner}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 motion-reduce:transform-none"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-full items-center justify-center text-6xl font-black tracking-tighter text-[var(--mache-primary)] opacity-25"
                >
                  {seller.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mache-line)] bg-white text-base font-black text-[var(--mache-muted)]">
                {seller.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={seller.logo} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold text-[var(--mache-text)] group-hover:underline">
                  {seller.name}
                </span>
                {seller.description && (
                  <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--mache-muted)]">
                    {seller.description}
                  </span>
                )}
                {seller.isPremium && (
                  <span className="mt-1 inline-block">
                    <VerifiedBadge compact />
                  </span>
                )}
              </span>
            </div>
          </Link>
        )}
      />
    </section>
  );
}

/* Nos suggestions (d'après les favoris) — ou « À découvrir » sans favoris. */
export function SuggestionsMarquee({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle: string;
  href?: string;
  products: StoreProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mache-reveal py-6">
      <Heading title={title} subtitle={subtitle} href={href} linkLabel="Tout voir" />
      <Marquee
        label={title}
        items={products}
        keyOf={(product) => product.id}
        itemClassName="w-[190px] sm:w-[230px]"
        render={(product, hidden) =>
          hidden ? (
            <div inert className="h-full">
              <ProductCard product={product} />
            </div>
          ) : (
            <ProductCard product={product} />
          )
        }
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Gagner de l'argent avec MACHE, sans ouvrir de boutique                     */
/* -------------------------------------------------------------------------- */

/*
  Deux rôles qui existent vraiment dans MACHE :

  - le POINT RELAIS : le module de livraison sait déposer un colis dans
    un commerce et l'y faire remettre contre le code de l'acheteur, et
    le point est affiché avec son adresse et ses horaires ;
  - l'AGENT : il porte un code que chacun peut vérifier sur la page
    publique /verify-agent, et suit ses colis depuis son espace.

  Ce que la section ne dit pas : un montant. Aucun n'est fixé ; la
  rémunération se convient avec MACHE avant de commencer, et c'est
  exactement ce qui est écrit. Un chiffre inventé ici serait une
  promesse que personne n'a faite.

  Les candidatures arrivent dans la messagerie de MACHE, objet déjà
  rempli : l'équipe sait tout de suite de quoi il s'agit.
*/
const EARN_ROLES = [
  {
    key: "relais",
    icon: "📍",
    title: "Devenir point relais",
    who: "Boutique, pharmacie, cybercafé, dépôt…",
    points: [
      "Chaque retrait fait entrer un client dans votre commerce.",
      "Votre point est affiché sur MACHE, avec son adresse et ses horaires.",
      "Vous gardez le colis et le remettez contre le code de l'acheteur.",
    ],
    cta: "Devenir point relais",
    href: `/contact?sujet=autre&objet=${encodeURIComponent("Devenir point relais")}`,
    tone: "border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] via-white to-[#dcfce7]",
    accent: "text-[#15803d]",
  },
  {
    key: "agent",
    icon: "🛵",
    title: "Devenir agent vérifié",
    who: "Livreur, coursier, moto-taxi…",
    points: [
      "Vous livrez les colis MACHE dans votre zone.",
      "Votre carte porte un code que chaque client vérifie sur MACHE : on vous ouvre en confiance.",
      "Vos colis et leurs étapes se suivent depuis votre téléphone.",
    ],
    cta: "Devenir agent",
    href: `/contact?sujet=autre&objet=${encodeURIComponent("Devenir agent MACHE")}`,
    tone: "border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] via-white to-[#dbeafe]",
    accent: "text-[#1d4ed8]",
  },
];

export function EarnWithMache() {
  return (
    <section className="mache-reveal container-page py-8">
      <div className="overflow-hidden rounded-[16px] bg-gradient-to-br from-[#111827] via-[#1e293b] to-[#1e3a8a] p-6 text-white sm:p-10">
        <div className="max-w-2xl">
          <span className="inline-block rounded-[3px] bg-[var(--mache-primary)] px-2 py-1 text-xs font-bold uppercase tracking-widest">
            Sans ouvrir de boutique
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tightest sm:text-4xl">
            Gagnez de l&apos;argent avec MACHE
          </h2>
          <p className="mt-3 text-md leading-relaxed text-white/80">
            Faites de votre commerce un point relais, ou devenez agent vérifié
            dans votre quartier. MACHE grandit avec ceux qui livrent et qui
            accueillent.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {EARN_ROLES.map((role) => (
            <Link
              key={role.key}
              href={role.href}
              className={`group flex flex-col rounded-[12px] border p-6 text-[var(--mache-text)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)] motion-reduce:transform-none ${role.tone}`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none"
                >
                  {role.icon}
                </span>
                <span>
                  <span className="block text-xl font-black">{role.title}</span>
                  <span className="block text-sm text-[var(--mache-muted)]">{role.who}</span>
                </span>
              </span>

              <ul className="mt-5 space-y-2.5">
                {role.points.map((point) => (
                  <li key={point} className="flex gap-2 text-base leading-snug">
                    <span aria-hidden="true" className={`font-black ${role.accent}`}>✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-sm text-[var(--mache-muted)]">
                Rémunéré en fonction des colis livrés. Montants et conditions
                fixés avec MACHE avant de commencer : rien ne vous engage sans
                que vous les connaissiez.
              </p>

              <span className={`mt-auto pt-5 text-base font-bold ${role.accent}`}>
                {role.cta} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

/*
  Les mêmes réponses que la page /faq, tirées du même fichier
  (src/lib/faq.tsx) : elles ne peuvent pas se contredire.
*/
export function HomeFaq() {
  return (
    <section className="mache-reveal container-page py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight text-[var(--mache-text)] sm:text-2xl">
          Questions fréquentes
        </h2>
        <Link href="/faq" className="text-base font-semibold text-[var(--mache-primary)] hover:underline">
          Toutes les questions →
        </Link>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {HOME_FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-[10px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-4 transition-shadow open:shadow-[0_6px_18px_rgba(16,24,32,0.08)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-md font-bold text-[var(--mache-text)]">
              {item.q}
              <span
                aria-hidden="true"
                className="text-xl text-[var(--mache-primary)] transition-transform duration-200 group-open:rotate-45 motion-reduce:transform-none"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">{item.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-4 text-base text-[var(--mache-muted)]">
        Votre question n&apos;est pas là ?{" "}
        <Link href="/contact" className="font-semibold text-[var(--mache-primary)] hover:underline">
          Écrivez-nous
        </Link>
        .
      </p>
    </section>
  );
}
