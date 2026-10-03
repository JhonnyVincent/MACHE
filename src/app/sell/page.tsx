import { Link } from "next-view-transitions";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Vendre sur MACHE : ouvrir sa boutique en ligne en Haïti",
  description:
    "Vendeur, grossiste ou marque : ouvrez votre boutique sur MACHE et vendez en Haïti et à la diaspora. Inscription en quelques minutes.",
  path: "/sell",
});

const sellerProfiles = [
  {
    title: "Vendeur",
    href: "/sell/vendeur",
    description:
      "Pour vendre vos produits, seul ou avec une boutique. Un vendeur peut aussi acheter auprès des grossistes et des marques.",
    points: ["Boutique et catalogue", "Commandes et livraisons", "Accès aux grossistes"],
  },
  {
    title: "Fournisseur",
    href: "/sell/fournisseur",
    description: "Pour vendre en volume aux boutiques, aux revendeurs et aux partenaires.",
    points: ["Prix de gros", "Commandes en volume", "Contrats"],
  },
  {
    title: "Marque officielle",
    href: "/sell/marque-officielle",
    description: "Pour les marques qui veulent une boutique vérifiée et une image soignée.",
    points: ["Badge officiel", "Boutique vérifiée", "Visibilité auprès des revendeurs"],
  },
];

const steps = [
  ["Créer votre compte", "Quelques minutes, avec votre adresse e-mail."],
  ["Choisir votre profil", "Vendeur, fournisseur ou marque officielle."],
  ["Présenter votre boutique", "Votre nom, votre logo, vos coordonnées."],
  ["Ajouter vos produits", "Photos, prix, stock et livraison."],
  ["Recevoir vos commandes", "Vous suivez tout depuis votre espace vendeur."],
];

const plans = [
  ["Starter", "Gratuit", "Pour commencer simplement."],
  ["Pro", "Mensuel", "Pour les vendeurs actifs."],
  ["Business", "Sur devis", "Pour les boutiques, marques et fournisseurs."],
];

export default function SellPage() {
  return (
    <main>
      {/* Même fond blanc que la carte : l'image et la page ne font qu'un. */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold tracking-label text-[var(--mache-primary)]">
              Vendre sur MACHE
            </p>

            <h1 className="mt-3 max-w-2xl text-hero text-[var(--mache-text)]">
              Ouvrez votre boutique et vendez partout en Haïti.
            </h1>

            <p className="mt-5 max-w-xl text-md leading-relaxed text-[var(--mache-muted)]">
              Vendeurs, grossistes et marques : une place de marché pour présenter vos produits,
              recevoir vos commandes et suivre vos livraisons, avec votre propre boutique.
            </p>

            {/*
              Un seul bouton d'inscription, et non « créer un compte » à
              côté de « se connecter » : les deux mènent au même endroit,
              le panneau vendeur, qui gère lui-même l'inscription et la
              connexion.

              Le tarif est accessible dès l'accroche : un vendeur se
              demande d'abord ce que ça va lui coûter, et ne pas répondre
              ici se lit comme un prix qu'on préfère ne pas montrer.
            */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard/seller/inscription" className="btn-primary">
                Ouvrir ma boutique
              </Link>
              <Link href="/sell/tarifs" className="btn-secondary">
                Voir les tarifs
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/carte-haiti-mache.webp"
              width={1000}
              height={800}
              alt="Carte d'Haïti aux couleurs de MACHE"
              className="w-full max-w-[440px] object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl text-[var(--mache-text)] sm:text-4xl">Trois façons de vendre</h2>
          <p className="mt-3 text-md leading-relaxed text-[var(--mache-muted)]">
            Chaque profil a sa propre page, ses propres outils et sa propre formule.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {sellerProfiles.map((profile) => (
            <Link
              key={profile.title}
              href={profile.href}
              className="group flex flex-col rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-7 transition-colors hover:border-[var(--mache-text)]"
            >
              <h3 className="font-display text-2xl font-semibold text-[var(--mache-text)]">{profile.title}</h3>

              <p className="mt-3 text-base leading-relaxed text-[var(--mache-muted)]">{profile.description}</p>

              <ul className="mt-5 space-y-2 border-t border-[var(--mache-line)] pt-5">
                {profile.points.map((point) => (
                  <li key={point} className="flex gap-3 text-base">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--mache-primary)]" />
                    {point}
                  </li>
                ))}
              </ul>

              <span className="mt-auto pt-6 text-base font-semibold text-[var(--mache-primary)]">
                Voir le profil <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="guide-vendeur" className="bg-[var(--mache-bg-2)] py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl text-[var(--mache-text)] sm:text-4xl">Cinq étapes pour commencer</h2>
            <p className="mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">
              Le parcours est le même pour tous les profils. Vous ouvrez la boutique, puis vous la
              complétez à votre rythme.
            </p>
          </div>

          <ol className="divide-y divide-[var(--mache-line)] border-y border-[var(--mache-line)]">
            {steps.map(([title, text], index) => (
              <li key={title} className="flex gap-6 py-5">
                <span className="w-8 shrink-0 font-display text-2xl font-semibold text-[var(--mache-primary)]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-md font-semibold text-[var(--mache-text)]">{title}</p>
                  <p className="mt-0.5 text-base text-[var(--mache-muted)]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl text-[var(--mache-text)] sm:text-4xl">Des formules simples</h2>
            <p className="mt-3 max-w-md text-md leading-relaxed text-[var(--mache-muted)]">
              On commence gratuitement et on choisit plus tard, selon l&apos;activité. Le détail est
              sur la page des tarifs.
            </p>
            <Link href="/sell/tarifs" className="mt-6 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline">
              Voir tous les tarifs →
            </Link>
          </div>

          <dl className="grid gap-5 sm:grid-cols-3">
            {plans.map(([name, price, text]) => (
              <div key={name} className="rounded-[8px] border border-[var(--mache-line)] bg-[var(--mache-white)] p-6">
                <dt className="text-sm font-semibold text-[var(--mache-muted)]">{name}</dt>
                <dd className="mt-2 font-display text-2xl font-semibold text-[var(--mache-text)]">{price}</dd>
                <dd className="mt-2 text-base text-[var(--mache-muted)]">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[8px] bg-[var(--mache-dark)] p-8 text-white sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl">Une question avant de vous lancer ?</h2>
            <p className="mt-2 text-md leading-relaxed text-white/75">
              L&apos;équipe MACHE vous aide à choisir le bon profil, que vous soyez vendeur, boutique,
              fournisseur ou marque officielle.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/seller/inscription"
              className="rounded-[6px] bg-[var(--mache-primary)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--mache-primary-dark)]"
            >
              Ouvrir ma boutique
            </Link>
            <Link
              href="/contact"
              className="rounded-[6px] border border-white/40 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white hover:text-[var(--mache-text)]"
            >
              Contacter l&apos;équipe
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
