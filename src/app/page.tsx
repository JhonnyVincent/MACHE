import Link from "next/link";
import { featuredProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";
import { HomeTicker } from "@/components/home-ticker";

const categories = [
  { title: "Artisanat", icon: "🧺", href: "/shop?category=artisanat" },
  { title: "Beauté", icon: "🌺", href: "/shop?category=beaute" },
  { title: "Maison", icon: "🪑", href: "/shop?category=maison" },
  { title: "Mode", icon: "👕", href: "/shop?category=mode" },
  { title: "Saveurs", icon: "🍲", href: "/shop?category=saveurs" },
  { title: "& Plus", icon: "•••", href: "/shop" }
];

const advantages = [
  ["🚚", "Livraison rapide", "Partout en Haïti"],
  ["🛡️", "Paiement sécurisé", "Transactions protégées"],
  ["🏅", "Produits authentiques", "Sélectionnés avec soin"],
  ["🎧", "Support client", "Toujours à votre écoute"]
];

export default function HomePage() {
  return (
    <main className="bg-[#fffaf6]">
      <HomeTicker />

      <section className="border-b bg-white">
        <div className="container-page flex flex-wrap items-center justify-center gap-4 py-5 md:justify-between">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="flex min-w-[135px] items-center justify-center gap-3 rounded-xl border bg-white px-5 py-4 font-semibold text-[#071f3d] shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{category.icon}</span>
              <span>{category.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pt-8">
        <div className="grid items-center gap-8 rounded-3xl bg-[#f6eadf] px-8 py-12 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
          <div>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.25em] text-[#d20a1e]">
              Marketplace haïtienne
            </p>

            <h1 className="text-5xl font-black leading-tight text-[#071f3d] md:text-7xl">
              Tout Ayiti.
              <br />
              Tout en un seul{" "}
              <span className="text-[#d20a1e]">Maché.</span>
            </h1>

            <p className="mt-6 max-w-md text-xl font-medium leading-relaxed text-[#23344d]">
              Des produits authentiques, des vendeurs locaux, une fierté
              nationale.
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
              src="/images/haiti-mache.png"
              alt="Carte d’Haïti illustrée avec des produits haïtiens"
              className="max-h-[470px] w-full object-contain"
            />
          </div>
        </div>

        <div className="mx-auto -mt-5 grid max-w-6xl gap-4 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-4">
          {advantages.map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-4 border-slate-200 md:border-r md:last:border-r-0">
              <div className="text-3xl">{icon}</div>
              <div>
                <div className="font-bold text-[#071f3d]">{title}</div>
                <div className="text-sm text-slate-500">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Nos incontournables</h2>
            <p className="section-subtitle">
              Les premières catégories fortes de Maché.
            </p>
          </div>
          <Link href="/shop" className="font-bold text-[#d20a1e]">
            Voir toutes les catégories →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.slice(0, 5).map((category) => (
            <Link key={category.title} href={category.href} className="card p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
              <div className="text-5xl">{category.icon}</div>
              <h3 className="mt-4 font-bold text-[#071f3d]">{category.title}</h3>
              <p className="mt-1 text-sm text-slate-500">Produits d’Haïti</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Meilleures ventes</h2>
            <p className="section-subtitle">
              Pour l’instant, les produits viennent de l’équipe Maché.
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
              Aujourd’hui, Maché démarre avec sa propre équipe. Demain, les
              vendeurs vérifiés pourront publier leurs produits et toucher plus
              de clients.
            </p>
          </div>

          <Link href="/sell" className="mt-6 inline-flex rounded-xl bg-[#d20a1e] px-6 py-4 font-bold text-white md:mt-0">
            Rejoindre Maché
          </Link>
        </div>
      </section>
    </main>
  );
}
