import Link from "next/link";

const products = [
  {
    name: "Chemise premium",
    price: "2 500 HTG",
    tag: "En stock",
  },
  {
    name: "Sac tendance",
    price: "4 800 HTG",
    tag: "Sponsorisé",
  },
  {
    name: "Produit local",
    price: "1 750 HTG",
    tag: "Nouveau",
  },
  {
    name: "Accessoire boutique",
    price: "950 HTG",
    tag: "Populaire",
  },
  {
    name: "Article maison",
    price: "3 200 HTG",
    tag: "Livraison",
  },
  {
    name: "Pack business",
    price: "12 000 HTG",
    tag: "Lot",
  },
];

const categories = [
  "Tous",
  "Mode",
  "Accessoires",
  "Maison",
  "Beauté",
  "Promos",
];

const stats = [
  ["4.8/5", "note vendeur"],
  ["92%", "réponse rapide"],
  ["120+", "produits"],
  ["24h", "préparation"],
];

export default function StorePage({
  params,
}: {
  params: { slug: string };
}) {
  const storeName = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1800&auto=format&fit=crop"
            alt="Boutique vendeur Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative py-12">
          <Link
            href="/sell"
            className="text-sm font-bold text-white/70 hover:text-white"
          >
            ← Devenir vendeur
          </Link>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="h-40 rounded-[1.5rem] bg-gradient-to-r from-orange-200 via-white to-red-200" />

            <div className="-mt-12 flex flex-col gap-5 px-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <img
                  src="/images/logo-haiti-mache-hibiscus.png"
                  alt="Logo boutique"
                  className="h-28 w-28 rounded-3xl border-4 border-white bg-white object-contain"
                />

                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black sm:text-5xl">
                      {storeName}
                    </h1>

                    <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-white">
                      Vérifié
                    </span>

                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">
                      Business
                    </span>
                  </div>

                  <p className="mt-2 max-w-2xl text-white/70">
                    Boutique officielle sur Maché · Produits disponibles en
                    Haïti · Livraison selon zone.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pb-2">
                <Link
                  href="/contact"
                  className="btn-secondary bg-white text-[#071f3d]"
                >
                  Contacter
                </Link>

                <Link href="/shop" className="btn-primary">
                  Voir produits
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-sm text-white/65">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="space-y-5">
            <div className="card p-6">
              <h2 className="text-xl font-black">
                À propos de la boutique
              </h2>

              <p className="mt-3 text-sm leading-7 text-neutral-500">
                {storeName} vend des produits sélectionnés sur Maché avec une
                attention particulière à la qualité, au service client et à la
                disponibilité locale.
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <p>📍 Zone : Port-au-Prince</p>
                <p>🚚 Livraison : disponible selon adresse</p>
                <p>⏱️ Préparation : environ 24h</p>
                <p>✅ Statut : vendeur vérifié</p>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-black">Catégories</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category}
                    href="/shop"
                    className="rounded-full border px-4 py-2 text-sm font-bold transition hover:border-[var(--mache-primary)] hover:text-[var(--mache-primary)]"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-black">Confiance</h2>

              <div className="mt-4 space-y-3">
                {[
                  "Vendeur vérifié",
                  "Produits contrôlés",
                  "Temps de réponse rapide",
                  "Support Maché disponible",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
                  Produits boutique
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Sélection de {storeName}
                </h2>
              </div>

              <Link href="/shop" className="btn-secondary">
                Voir toute la boutique
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <div key={product.name} className="card overflow-hidden p-0">
                  <div className="relative h-48 bg-neutral-100">
                    <img
                      src={`https://images.unsplash.com/photo-${
                        [
                          "1523381210434-271e8be1f52b",
                          "1542291026-7eec264c27ff",
                          "1503342217505-b0a15ec3261c",
                          "1511556820780-d912e42b4980",
                          "1483985988355-763728e1935b",
                          "1555529669-e69e7aa0ba9a",
                        ][index]
                      }?q=80&w=900&auto=format&fit=crop`}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />

                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black">
                      {product.tag}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-black">{product.name}</h3>

                    <p className="mt-2 text-2xl font-black text-[var(--mache-primary)]">
                      {product.price}
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      Disponible chez {storeName}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href="/shop"
                        className="btn-primary flex-1 text-center"
                      >
                        Voir
                      </Link>

                      <Link
                        href="/contact"
                        className="btn-secondary flex-1 text-center"
                      >
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-white/70">
                Vous voulez une boutique comme celle-ci ?
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                Créez votre boutique vendeur sur Maché.
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Lancez votre espace vendeur, publiez vos produits et développez
                votre activité avec la marketplace + les outils SaaS Maché.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                href="/register?role=seller_business"
                className="btn-primary"
              >
                Devenir vendeur
              </Link>

              <Link
                href="/sell"
                className="btn-secondary bg-white text-[#071f3d]"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
