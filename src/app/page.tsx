import Link from "next/link";
import { featuredProducts, featuredVendors } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

export default function HomePage() {
  return (
    <main>
      <section className="container-page py-12 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="badge">Haïti · Caraïbe · Diaspora · Monde</span>

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              La marketplace premium pour acheter, vendre, exporter et vérifier en toute confiance.
            </h1>

            <p className="mt-5 max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-300">
              Mache réunit une expérience marketplace moderne inspirée d’Amazon,
              AliExpress, Vinted et Shopify pour créer une plateforme forte,
              crédible et pensée pour Haïti, la Caraïbe et la diaspora.
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
              <span className="badge">Marketplace internationale</span>
              <span className="badge">Vendeurs vérifiés</span>
              <span className="badge">Agents vérifiables</span>
              <span className="badge">Architecture paiement prête</span>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1400&auto=format&fit=crop"
              alt="Marketplace Mache"
              className="h-full min-h-[400px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="section-title">Catégories phares</h2>
          <p className="section-subtitle">
            Une vitrine moderne pour les produits d’Haïti, de la Caraïbe et de la diaspora.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Mode",
              text: "Vêtements, accessoires, créations locales et tendances diaspora."
            },
            {
              title: "Épicerie",
              text: "Produits alimentaires, café, épices, saveurs créoles et export."
            },
            {
              title: "Artisanat",
              text: "Objets faits main, cuir, artisanat premium et pièces authentiques."
            },
            {
              title: "Export",
              text: "Fournisseurs, logistique, shipping et ouverture internationale."
            }
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Produits mis en avant</h2>
            <p className="section-subtitle">
              Des produits premium, crédibles et prêts à convertir.
            </p>
          </div>

          <Link href="/shop" className="btn-secondary">
            Voir toute la boutique
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="section-title">Vendeurs recommandés</h2>
          <p className="section-subtitle">
            Particuliers, business, fournisseurs et boutique Mache.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredVendors.map((vendor) => (
            <div key={vendor.name} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{vendor.name}</h3>
                {vendor.verified ? <span className="badge">Vérifié</span> : null}
              </div>

              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {vendor.kind}
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {vendor.region}
              </p>
              <p className="mt-4 font-semibold">⭐ {vendor.rating}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="section-title">Confiance et sécurité</h2>
          <p className="section-subtitle">
            Une architecture pensée pour protéger les acheteurs, les vendeurs et la plateforme.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Validation vendeur</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Vérification des documents, conformité et catégories autorisées.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Fraude & risque</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Détection d’anomalies, revue manuelle et blocage si nécessaire.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Agents vérifiables</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Vérification publique des agents terrain avec code officiel.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <span className="badge">Export</span>
            <h2 className="mt-4 text-2xl font-bold">
              Exportez depuis la Caraïbe vers le monde
            </h2>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              Mache prépare une vraie logique d’export avec fournisseurs,
              paiements, shipping, suivi et conformité.
            </p>
            <Link href="/export" className="btn-primary mt-6">
              Découvrir l’export
            </Link>
          </div>

          <div className="card p-6">
            <span className="badge">Trust</span>
            <h2 className="mt-4 text-2xl font-bold">
              Vérifiez un agent avant toute interaction
            </h2>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              Entrez un code agent pour voir son nom, sa zone, son statut et sa validité.
            </p>
            <Link href="/verify-agent" className="btn-secondary mt-6">
              Vérifier un agent
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="section-title">FAQ rapide</h2>
          <p className="section-subtitle">
            Les réponses qui rassurent dès l’accueil.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Qui peut vendre ?</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Particuliers, vendeurs professionnels, fournisseurs et la plateforme Mache.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Comment un produit est publié ?</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Publication automatique seulement si les conditions métier sont validées.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Les paiements sont-ils prêts ?</h3>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Oui, l’architecture prévoit Stripe, PayPal, méthodes locales et COD.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
