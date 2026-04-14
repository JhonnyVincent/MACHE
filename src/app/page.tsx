import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="container-page py-12 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="badge">Haïti · Caraïbe · Diaspora · Monde</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              La marketplace moderne pour acheter, vendre, exporter et vérifier.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-300">
              Mache réunit une expérience marketplace, revente entre particuliers,
              boutique vendeurs et contrôle de confiance pour bâtir une vraie plateforme
              premium et durable.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop" className="btn-primary">
                Explorer la boutique
              </Link>
              <Link href="/sell" className="btn-secondary">
                Devenir vendeur
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="badge">Paiements évolutifs</span>
              <span className="badge">Agents vérifiables</span>
              <span className="badge">Risque & fraude</span>
              <span className="badge">Supabase ready</span>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1400&auto=format&fit=crop"
              alt="Mache marketplace"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Acheter</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Explore produits, vendeurs, catégories et export.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold">Vendre</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Particuliers, vendeurs pro, fournisseurs et boutique Mache.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold">Vérifier</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Vérification publique d’agent et logique de confiance.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
