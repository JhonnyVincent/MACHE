import Link from "next/link";
import { featuredProducts, featuredVendors } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

export default function HomePage() {
  return (
    <main>
      <section className="container-page pt-8">
        <div className="market-hero">
          <div className="market-hero-grid">
            <div className="market-hero-copy">
              <span className="market-hero-kicker">Marketplace Caribbean</span>

              <h1 className="market-hero-title">
                Le commerce moderne entre <em>Haïti</em>, la <em>Caraïbe</em> et la <em>diaspora</em>.
              </h1>

              <p className="market-hero-text">
                Mache transforme ton ancien concept marketplace en une vraie plateforme premium :
                achat, vente, export, vérification agent, vendeurs particuliers, vendeurs business
                et croissance internationale.
              </p>

              <div className="market-hero-actions">
                <Link href="/shop" className="btn-primary">
                  Explorer la boutique
                </Link>
                <Link href="/sell" className="btn-secondary">
                  Devenir vendeur
                </Link>
              </div>
            </div>

            <div className="market-hero-visual">
              <img
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop"
                alt="Mache marketplace"
              />
            </div>
          </div>
        </div>

        <div className="market-strip">
          <div className="market-strip-card">
            <div className="market-strip-title">Marketplace internationale</div>
            <div className="market-strip-text">
              Acheteurs, vendeurs, fournisseurs et diaspora sur une seule plateforme.
            </div>
          </div>

          <div className="market-strip-card">
            <div className="market-strip-title">Agents vérifiables</div>
            <div className="market-strip-text">
              Vérifie un agent publiquement avant toute interaction terrain.
            </div>
          </div>

          <div className="market-strip-card">
            <div className="market-strip-title">Paiements évolutifs</div>
            <div className="market-strip-text">
              Structure prête pour Stripe, PayPal, méthodes locales et cash delivery.
            </div>
          </div>

          <div className="market-strip-card">
            <div className="market-strip-title">Sécurité & conformité</div>
            <div className="market-strip-text">
              Vérification vendeur, logique de risque et contrôle anti-fraude.
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6">
          <h2 className="section-title">Produits mis en avant</h2>
          <p className="section-subtitle">
            Des cartes produit modernes, inspirées marketplace, prêtes pour Mache.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <div className="mb-6">
          <h2 className="section-title">Vendeurs recommandés</h2>
          <p className="section-subtitle">
            Une structure crédible pour vendeurs particuliers, business et boutique Mache.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredVendors.map((vendor) => (
            <div key={vendor.name} className="card vendor-card">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{vendor.name}</h3>
                {vendor.verified ? <span className="badge">Vérifié</span> : null}
              </div>

              <p className="mt-2 text-sm text-[var(--mache-muted)]">{vendor.kind}</p>
              <p className="mt-1 text-sm text-[var(--mache-muted)]">{vendor.region}</p>
              <p className="mt-4 font-semibold">⭐ {vendor.rating}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card info-card">
            <h3 className="text-lg font-semibold">Vendre sur Mache</h3>
            <p className="mt-3 text-sm text-[var(--mache-muted)]">
              Particuliers, business et fournisseurs peuvent publier selon la logique de validation Mache.
            </p>
            <Link href="/sell" className="btn-primary mt-5">
              Commencer
            </Link>
          </div>

          <div className="card info-card">
            <h3 className="text-lg font-semibold">Export</h3>
            <p className="mt-3 text-sm text-[var(--mache-muted)]">
              Prépare tes produits pour l’export depuis la Caraïbe vers le reste du monde.
            </p>
            <Link href="/export" className="btn-secondary mt-5">
              Voir l’export
            </Link>
          </div>

          <div className="card info-card">
            <h3 className="text-lg font-semibold">Verify Agent</h3>
            <p className="mt-3 text-sm text-[var(--mache-muted)]">
              Vérifie l’identité, la zone et le statut d’un agent terrain.
            </p>
            <Link href="/verify-agent" className="btn-secondary mt-5">
              Vérifier
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
