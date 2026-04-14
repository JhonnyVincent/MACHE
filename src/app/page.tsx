import Link from "next/link";
import { featuredProducts, featuredVendors } from "@/lib/mock-data";
import { ProductCard } from "@/components/product-card";

const categories = [
  {
    title: "Vêtements",
    count: "248 produits",
    image:
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&q=80"
  },
  {
    title: "Alimentation",
    count: "186 produits",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
  },
  {
    title: "Accessoires",
    count: "124 produits",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80"
  },
  {
    title: "Maison & Déco",
    count: "97 produits",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80"
  }
];

const promos = [
  {
    badge: "FLASH",
    title: "Mode caribéenne",
    sub: "Jusqu’à -30% cette semaine",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop"
  },
  {
    badge: "EXPORT",
    title: "Produits diaspora",
    sub: "Sélection prête pour l’international",
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop"
  },
  {
    badge: "PREMIUM",
    title: "Artisanat & luxe",
    sub: "Pièces plus haut de gamme",
    image:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop"
  }
];

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
                Mache rassemble vendeurs particuliers, vendeurs business,
                fournisseurs, export et vérification agent dans une plateforme
                premium, crédible et pensée pour durer.
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
            <div className="market-strip-title">Suivi de commande</div>
            <div className="market-strip-text">
              Architecture prête pour commande, suivi, paiement et livraison.
            </div>
          </div>
          <div className="market-strip-card">
            <div className="market-strip-title">Paiements internationaux</div>
            <div className="market-strip-text">
              Stripe, PayPal, méthodes locales et cash on delivery prévus.
            </div>
          </div>
          <div className="market-strip-card">
            <div className="market-strip-title">Agents vérifiables</div>
            <div className="market-strip-text">
              Vérification publique de l’identité et du statut agent.
            </div>
          </div>
          <div className="market-strip-card">
            <div className="market-strip-title">Confiance vendeur</div>
            <div className="market-strip-text">
              Validation documents, catégories autorisées et anti-fraude.
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6">
          <h2 className="section-title">Catégories</h2>
          <p className="section-subtitle">
            Une présentation plus proche de ton ancien site, adaptée à Mache.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div key={category.title} className="card overflow-hidden">
              <div className="h-32 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-sm font-bold">{category.title}</h3>
                <p className="mt-1 text-xs text-[var(--mache-muted)]">
                  {category.count}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-4">
        <div className="mb-6">
          <h2 className="section-title">Produits vedettes</h2>
          <p className="section-subtitle">
            Cartes produits prêtes pour marketplace premium.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6">
          <h2 className="section-title">Deals du moment</h2>
          <p className="section-subtitle">
            On récupère la logique promo de ton ancien site.
          </p>
        </div>

        <div className="promo-grid">
          {promos.map((promo) => (
            <div key={promo.title} className="promo-card">
              <img src={promo.image} alt={promo.title} />
              <div className="promo-body">
                <span className="promo-badge">{promo.badge}</span>
                <div className="promo-title">{promo.title}</div>
                <div className="promo-sub">{promo.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="sband">
          <div className="sbg">
            <div>
              <div className="sbk">Programme vendeur</div>
              <h2 className="sbh">
                Ouvre ta boutique <br /> en 5 minutes
              </h2>
              <p className="sbp">
                Rejoins l’écosystème Mache et vends localement et
                internationalement avec une vraie logique marketplace.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary">
                  Démarrer gratuitement
                </Link>
                <Link href="/dashboard/seller" className="btn-secondary">
                  Voir le dashboard
                </Link>
              </div>

              <div className="sbsteps">
                <div className="sbstep">
                  <div className="n">1</div>
                  <p>Créer ton compte</p>
                </div>
                <div className="sbstep">
                  <div className="n">2</div>
                  <p>Ajouter tes produits</p>
                </div>
                <div className="sbstep">
                  <div className="n">3</div>
                  <p>Commencer à vendre</p>
                </div>
              </div>
            </div>

            <div className="sbcards">
              <div className="sbcard">
                <div className="sbcard-ico">📊</div>
                <div>
                  <h4>Dashboard complet</h4>
                  <p>Ventes, commandes, promotions et suivi vendeur.</p>
                </div>
              </div>

              <div className="sbcard">
                <div className="sbcard-ico">🧾</div>
                <div>
                  <h4>Factures & structure PDF</h4>
                  <p>Architecture prête pour les factures Mache.</p>
                </div>
              </div>

              <div className="sbcard">
                <div className="sbcard-ico">🛡️</div>
                <div>
                  <h4>Sécurité & conformité</h4>
                  <p>Validation vendeur, score de risque et revue manuelle.</p>
                </div>
              </div>

              <div className="sbcard">
                <div className="sbcard-ico">🌍</div>
                <div>
                  <h4>Paiements mondiaux</h4>
                  <p>Prévu pour international, diaspora et méthodes locales.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-4">
        <div className="mb-6">
          <h2 className="section-title">Vendeurs recommandés</h2>
          <p className="section-subtitle">
            On garde aussi la logique marketplace humaine et crédible.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {featuredVendors.map((vendor) => (
            <div key={vendor.name} className="card p-6">
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
    </main>
  );
}
