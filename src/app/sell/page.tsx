import Link from "next/link";

const sellerTypes = [
  {
    title: "Petit vendeur",
    badge: "Simple",
    description:
      "Idéal pour vendre localement avec peu de stock, depuis un téléphone, sans complexité.",
    points: ["Peu de produits", "Vente locale", "Dashboard simple", "Support progressif"],
  },
  {
    title: "Vendeur business",
    badge: "Pro",
    description:
      "Pour les boutiques avec gros catalogue, employés, analytics, publicité et livraisons.",
    points: ["Gros stock", "Multi-livraison", "Analytics", "Publicités"],
  },
  {
    title: "Fournisseur / Grossiste",
    badge: "B2B",
    description:
      "Pour vendre en gros à d’autres vendeurs, boutiques, revendeurs ou partenaires.",
    points: ["Prix de gros", "Commandes volume", "Export futur", "Partenaires"],
  },
  {
    title: "Marque officielle",
    badge: "Vérifié",
    description:
      "Pour les marques qui veulent une boutique officielle avec badge, confiance et visibilité.",
    points: ["Badge officiel", "Boutique premium", "Avis clients", "Visibilité forte"],
  },
];

const saasFeatures = [
  "Gestion stock",
  "Gestion produits",
  "Commandes internes",
  "Ventes physiques + online",
  "Analytics revenus",
  "QR code vente",
  "Employés / staff",
  "Multi-boutiques",
  "Publicités",
  "POS / caisse futur",
];

const dashboardItems = [
  "Commandes reçues",
  "Produits publiés",
  "Stock faible",
  "Revenus estimés",
  "Publicités actives",
  "Notifications vendeur",
];

const plans = [
  {
    name: "Gratuit",
    price: "0 HTG",
    description: "Pour commencer à vendre rapidement.",
    features: ["10 produits", "Boutique simple", "Commission standard", "Support basique"],
  },
  {
    name: "Pro",
    price: "Mensuel",
    description: "Pour les vendeurs réguliers.",
    features: ["Plus de produits", "Analytics", "Produits sponsorisés", "Visibilité boostée"],
  },
  {
    name: "Business",
    price: "Sur devis",
    description: "Pour entreprises, grossistes et marques.",
    features: ["Employés", "Export", "API future", "Support prioritaire"],
  },
];

const trustItems = [
  "CIN ou passeport",
  "Téléphone vérifié",
  "Adresse ou localisation",
  "Documents business",
  "Validation manuelle",
  "Badges vendeur",
];

const futureFeatures = [
  {
    title: "IA vendeur",
    text: "Génération de descriptions, amélioration des titres, suggestions de prix et aide à la vente.",
  },
  {
    title: "Anti-fraude",
    text: "Détection spam, faux produits, multi-comptes et comportements suspects.",
  },
  {
    title: "Payouts",
    text: "Paiements vendeurs via MonCash, NatCash, banque, PayPal et autres solutions futures.",
  },
  {
    title: "Widgets boutique",
    text: "Personnalisation bannière, sliders, couleurs, promos et homepage boutique.",
  },
];

export default function SellPage() {
  return (
    <main className="container-page py-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6 sm:p-8">
          <div className="inline-flex rounded-full border px-4 py-2 text-sm font-medium text-neutral-600">
            Marketplace + SaaS vendeur
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Vendez partout en Haïti avec Maché
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-neutral-500">
            Maché aide les particuliers, boutiques, grossistes et entreprises à vendre en ligne,
            gérer leurs produits, suivre leurs commandes et développer leur business avec un vrai
            dashboard vendeur moderne.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register?role=seller" className="btn-primary">
              Créer un compte vendeur
            </Link>

            <Link
              href="/login?next=/dashboard/seller"
              className="btn-secondary"
            >
              Se connecter vendeur
            </Link>

            <Link href="/contact" className="btn-secondary">
              Nous contacter
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <p className="text-2xl font-black">4+</p>
              <p className="text-sm text-neutral-500">types de vendeurs</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-2xl font-black">15</p>
              <p className="text-sm text-neutral-500">modules vendeurs</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-2xl font-black">360°</p>
              <p className="text-sm text-neutral-500">vente + SaaS + pub</p>
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-white to-red-100" />

          <div className="relative flex h-full min-h-[420px] flex-col justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo-haiti-mache-hibiscus.png"
                alt="Haiti Maché"
                className="h-14 w-14 rounded-2xl object-contain"
              />

              <div>
                <p className="font-bold">Haiti Maché</p>
                <p className="text-sm text-neutral-500">Seller Platform</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-neutral-500">
                Exemple boutique publique
              </p>

              <h2 className="mt-2 text-2xl font-black">
                /store/nom-boutique
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Bannière, logo, produits, badges, statistiques, livraison et
                réseaux sociaux.
              </p>
            </div>

            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte Haiti Maché"
              className="mx-auto max-h-56 object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className="text-3xl font-black">Types de vendeurs</h2>

          <p className="mt-2 text-neutral-500">
            Maché doit accueillir particuliers, boutiques, grossistes et
            marques officielles.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sellerTypes.map((item) => (
            <div key={item.title} className="card p-5">
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">
                {item.badge}
              </span>

              <h3 className="mt-4 text-xl font-bold">{item.title}</h3>

              <p className="mt-2 text-sm text-neutral-500">
                {item.description}
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                {item.points.map((point) => (
                  <li key={point}>✓ {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-6">
          <h2 className="text-3xl font-black">SaaS vendeur</h2>

          <p className="mt-3 text-neutral-500">
            Maché peut devenir une vraie plateforme SaaS pour gérer ventes,
            inventaire, employés et activité commerciale.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {saasFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border p-3 text-sm font-medium"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Dashboard vendeur moderne
          </h2>

          <p className="mt-3 text-neutral-500">
            Suivez commandes, revenus, produits, publicités et activité
            vendeur depuis un seul espace.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {dashboardItems.map((item) => (
              <div key={item} className="rounded-2xl bg-neutral-50 p-4">
                <p className="font-semibold">{item}</p>

                <p className="mt-1 text-sm text-neutral-500">
                  Module vendeur
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/login?next=/dashboard/seller"
              className="btn-primary"
            >
              Ouvrir le dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-2xl font-black">Gestion stock</h2>

          <p className="mt-3 text-neutral-500">
            Inventaire, variantes, alertes stock faible et gestion des
            quantités.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-black">Gestion produits</h2>

          <p className="mt-3 text-neutral-500">
            Images, prix, promotions, catégories, validation et visibilité.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-black">Commandes</h2>

          <p className="mt-3 text-neutral-500">
            Suivi commandes, notifications vendeur et gestion clients.
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Boutique vendeur publique
          </h2>

          <p className="mt-3 text-neutral-500">
            Chaque vendeur pourra avoir une boutique publique complète :
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Bannière",
              "Logo",
              "Produits",
              "Avis clients",
              "Badges",
              "Catégories",
              "Temps de réponse",
              "Réseaux sociaux",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border p-3 text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link href="/vendors" className="btn-secondary">
              Voir les vendeurs
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Livraison avancée
          </h2>

          <p className="mt-3 text-neutral-500">
            Plusieurs modes de livraison selon vendeur, ville et catégorie.
          </p>

          <div className="mt-6 space-y-3">
            {[
              "Livraison Maché",
              "Partenaire livraison",
              "Livraison vendeur",
              "Retrait magasin",
              "GPS & OTP plus tard",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-neutral-50 p-4 font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className="text-3xl font-black">
            Publicités & produits sponsorisés
          </h2>

          <p className="mt-2 text-neutral-500">
            Les vendeurs pourront payer pour améliorer leur visibilité.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            "Homepage",
            "Top catégories",
            "Produits sponsorisés",
            "Push notifications",
          ].map((item) => (
            <div key={item} className="card p-5">
              <h3 className="font-bold">{item}</h3>

              <p className="mt-2 text-sm text-neutral-500">
                Visibilité premium marketplace.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className="text-3xl font-black">
            Abonnements vendeurs
          </h2>

          <p className="mt-2 text-neutral-500">
            Marketplace + SaaS + commissions.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="card p-6">
              <h3 className="text-2xl font-black">{plan.name}</h3>

              <p className="mt-2 text-3xl font-black">{plan.price}</p>

              <p className="mt-2 text-sm text-neutral-500">
                {plan.description}
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-3xl font-black">Commissions</h2>

          <p className="mt-3 text-neutral-500">
            Taux différents selon type de vendeur.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border p-4">
              <p className="font-bold">Particulier</p>

              <p className="text-sm text-neutral-500">
                Exemple : 15%
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="font-bold">Business</p>

              <p className="text-sm text-neutral-500">
                Exemple : 8%
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="font-bold">Contrat spécial</p>

              <p className="text-sm text-neutral-500">
                Marques et grossistes.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Vérification vendeur
          </h2>

          <p className="mt-3 text-neutral-500">
            Sécurité et confiance marketplace.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-neutral-50 p-4 text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Vérifié", "Business", "Premium", "Export"].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border px-3 py-1 text-sm font-bold"
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className="text-3xl font-black">
            Modules avancés marketplace
          </h2>

          <p className="mt-2 text-neutral-500">
            Les futures briques importantes de Maché.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {futureFeatures.map((item) => (
            <div key={item.title} className="card p-5">
              <h3 className="text-xl font-bold">{item.title}</h3>

              <p className="mt-3 text-sm text-neutral-500">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Dashboard super admin vendeur
          </h2>

          <p className="mt-3 text-neutral-500">
            Gestion approbation boutiques, commissions, publicités,
            revenus et modération vendeurs.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-3xl font-black">
            Partenaires vendeurs
          </h2>

          <p className="mt-3 text-neutral-500">
            Livraison, export, marketing, comptabilité et services
            business.
          </p>
        </div>
      </section>

      <section className="mt-14 overflow-hidden rounded-3xl bg-neutral-950 p-8 text-white">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-orange-300">
              Devenir vendeur Maché
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Commencez à vendre aujourd’hui.
            </h2>

            <p className="mt-4 max-w-2xl text-white/70">
              Particulier, boutique, grossiste ou marque officielle :
              Maché prépare les outils pour vendre, gérer et développer
              votre activité.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/register?role=seller"
              className="btn-primary"
            >
              Créer un compte vendeur
            </Link>

            <Link
              href="/contact"
              className="btn-secondary bg-white text-neutral-950"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
