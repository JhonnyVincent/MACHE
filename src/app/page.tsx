import Link from "next/link";
import { featuredProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";
import { HomeTicker } from "@/components/home-ticker";

const mainCategories = [
  { title: "Artisanat", icon: "🧺", href: "/shop?category=artisanat" },
  { title: "Beauté", icon: "🌺", href: "/shop?category=beaute" },
  { title: "Maison", icon: "🪑", href: "/shop?category=maison" },
  { title: "Mode", icon: "👕", href: "/shop?category=mode" },
  { title: "Saveurs", icon: "🍲", href: "/shop?category=saveurs" }
];

const moreCategories = [
  "En vedette",
  "Maison et Cuisine",
  "Vêtements femme",
  "Grandes tailles femme",
  "Chaussures femme",
  "Lingerie et Pyjamas femme",
  "Vêtements homme",
  "Chaussures homme",
  "Grandes tailles homme",
  "Pyjamas et Sous-vêtements homme",
  "Sports et Activités d'extérieur",
  "Bijoux et Accessoires",
  "Beauté et Santé",
  "Jouets et Jeux",
  "Automobile",
  "Mode Enfant",
  "Chaussures enfant",
  "Bébé et Maternité",
  "Sacs et Bagages",
  "Pelouses et Jardins",
  "Arts, Artisanat et Couture",
  "Électroniques",
  "Commerce, Industrie et Science",
  "Outillage et Amélioration de l'habitat",
  "Électroménagers",
  "Fournitures de bureau et scolaires",
  "Ménage et Santé",
  "Accessoires animaux",
  "Téléphones et Accessoires",
  "Maison intelligente",
  "Instruments de musique",
  "Alimentation et Épicerie",
  "Livres et médias",
  "Vêtements de plage",
  "Meubles"
];

const advantages = [
  ["🚚", "Livraison rapide", "Partout en Haïti"],
  ["🛡️", "Paiement sécurisé", "Transactions protégées"],
  ["🏅", "Produits authentiques", "Sélectionnés avec soin"],
  ["🎧", "Support client", "Toujours à votre écoute"]
];

const homeSlides = [
  {
    badge: "Image officielle",
    title: "Tout Ayiti. Tout en un seul Maché.",
    text: "Des produits authentiques, des vendeurs locaux, une fierté nationale.",
    href: "/shop",
    cta: "Découvrir",
    image: "/images/carte-haiti-mache.png",
    fixed: true
  },
  {
    badge: "Produit du mois",
    title: "Les produits les plus vendus du moment",
    text: "Une sélection qui pourra évoluer automatiquement selon les ventes, les vues et les tendances.",
    href: "/shop?sort=best",
    cta: "Voir les meilleures ventes"
  },
  {
    badge: "Partenaire",
    title: "PHARE accompagne l’importation et l’exportation",
    text: "Un espace pourra mettre en avant les partenaires logistiques, export, import et diaspora.",
    href: "/services",
    cta: "Découvrir PHARE"
  },
  {
    badge: "Financement",
    title: "Bawon soutient les projets et entreprises",
    text: "Maché pourra présenter des partenaires qui financent ou accompagnent les vendeurs et entreprises.",
    href: "/services",
    cta: "Voir les solutions"
  },
  {
    badge: "Newsletter",
    title: "Les nouvelles du pays et du marché",
    text: "Actualités, promotions, nouveaux contrats, produits populaires et annonces importantes.",
    href: "/newsletter",
    cta: "Lire la newsletter"
  }
];

export default function HomePage() {
  const firstSlide = homeSlides[0];

  return (
    <main className="bg-[#fffaf6]">
      <HomeTicker />

      {/* HERO PRINCIPAL - image fixe numéro 1 */}
      <section className="container-page pt-8">
        <div className="grid items-center gap-8 rounded-3xl bg-[#f6eadf] px-8 py-12 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.25em] text-[#d20a1e]">
              {firstSlide.badge}
            </p>

            <h1 className="text-5xl font-black leading-tight text-[#071f3d] md:text-7xl">
              Tout Ayiti.
              <br />
              Tout en un seul{" "}
              <span className="text-[#d20a1e]">Maché.</span>
            </h1>

            <p className="mt-6 max-w-md text-xl font-medium leading-relaxed text-[#23344d]">
              {firstSlide.text}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop" className="btn-primary">
                Découvrir
              </Link>
              <Link href="/shop" className="btn-secondary">
                Voir le catalogue
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src={firstSlide.image}
              alt="Carte d’Haïti Maché"
              className="max-h-[470px] w-full object-contain"
            />
          </div>
        </div>

        <div className="mx-auto -mt-5 grid max-w-6xl gap-4 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-4">
          {advantages.map(([icon, title, text]) => (
            <div
              key={title}
              className="flex items-center gap-4 border-slate-200 md:border-r md:last:border-r-0"
            >
              <div className="text-3xl">{icon}</div>
              <div>
                <div className="font-bold text-[#071f3d]">{title}</div>
                <div className="text-sm text-slate-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MENU CATEGORIES APRES HERO */}
      <section className="border-y bg-white">
        <div className="container-page flex h-20 items-center justify-between gap-4 overflow-x-auto whitespace-nowrap text-lg font-bold text-[#071f3d]">
          {mainCategories.map((category) => (
            <Link key={category.title} href={category.href}>
              <span className="mr-2 text-3xl">{category.icon}</span>
              {category.title}
            </Link>
          ))}

          <details className="group relative">
            <summary className="cursor-pointer list-none rounded-full bg-[#0b6fd3] px-5 py-3 text-white">
              ••• Plus
            </summary>

            <div className="absolute right-0 z-30 mt-4 grid w-[760px] grid-cols-3 gap-2 rounded-2xl border bg-white p-6 text-sm font-semibold text-[#071f3d] shadow-2xl">
              {moreCategories.map((item) => (
                <Link
                  key={item}
                  href={`/shop?category=${encodeURIComponent(item.toLowerCase())}`}
                  className="rounded-lg px-3 py-2 hover:bg-[#fff1f1] hover:text-[#d20a1e]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* FUTURS SLIDES DYNAMIQUES */}
      <section className="container-page py-12">
        <div className="mb-6">
          <h2 className="section-title">À la une sur Maché</h2>
          <p className="section-subtitle">
            Cette zone pourra venir de Supabase : pubs, partenaires, produits du mois,
            newsletters, contrats et meilleures ventes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {homeSlides.slice(1).map((slide) => (
            <Link
              key={slide.title}
              href={slide.href}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#d20a1e]">
                {slide.badge}
              </div>
              <h3 className="mt-3 text-xl font-black text-[#071f3d]">
                {slide.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {slide.text}
              </p>
              <div className="mt-5 font-bold text-[#d20a1e]">{slide.cta} →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="container-page py-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Nos incontournables</h2>
            <p className="section-subtitle">
              Les premières grandes catégories de Maché.
            </p>
          </div>
          <Link href="/shop" className="font-bold text-[#d20a1e]">
            Voir toutes les catégories →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {mainCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="card p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-5xl">{category.icon}</div>
              <h3 className="mt-4 font-bold text-[#071f3d]">
                {category.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Produits d’Haïti</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUITS */}
      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Meilleures ventes</h2>
            <p className="section-subtitle">
              Pour l’instant, les produits viennent de l’équipe Maché. Plus tard,
              cette section pourra se mettre à jour automatiquement.
            </p>
          </div>
          <Link href="/shop" className="font-bold text-[#d20a1e]">
            Voir tous les produits →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="container-page py-12">
        <div className="rounded-3xl bg-[#071f3d] p-8 text-white md:flex md:items-center md:justify-between md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f5b01b]">
              Devenir vendeur
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Vendez vos produits sur Maché
            </h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Aujourd’hui, Maché démarre avec sa propre équipe. Demain, les vendeurs
              pourront publier leurs produits, acheter de la visibilité et toucher plus
              de clients.
            </p>
          </div>

          <Link
            href="/sell"
            className="mt-6 inline-flex rounded-xl bg-[#d20a1e] px-6 py-4 font-bold text-white md:mt-0"
          >
            Rejoindre Maché
          </Link>
        </div>
      </section>
    </main>
  );
}
