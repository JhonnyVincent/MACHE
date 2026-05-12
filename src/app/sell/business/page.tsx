import Link from "next/link";

const benefits = [
  "Gérer un gros catalogue",
  "Suivre les commandes",
  "Analyser les ventes",
  "Ajouter des employés",
  "Sponsoriser des produits",
  "Utiliser les outils SaaS avancés",
];

const tools = [
  ["Catalogue", "Ajoutez plus de produits, variantes, prix, promotions et catégories."],
  ["Commandes", "Suivez les commandes, statuts, clients et livraisons depuis un seul espace."],
  ["Analytics", "Analysez revenus, meilleurs produits, performance et évolution des ventes."],
  ["Publicité", "Boostez vos produits avec la mise en avant sponsorisée."],
  ["Employés", "Ajoutez du staff pour gérer produits, commandes ou support."],
  ["Export futur", "Préparez votre boutique pour des ventes plus larges et partenaires."],
];

const steps = [
  "Créer un compte business",
  "Ajouter les infos boutique",
  "Envoyer les documents",
  "Importer ou créer le catalogue",
  "Activer ventes, stock et publicité",
];

const plans = [
  {
    name: "Pro",
    price: "Mensuel",
    text: "Pour boutiques actives avec catalogue, commandes et visibilité.",
  },
  {
    name: "Business",
    price: "Sur devis",
    text: "Pour entreprises, gros stock, employés, support et options avancées.",
  },
];

export default function SellBusinessPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1800&auto=format&fit=crop"
            alt="Business vendeur Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href="/sell" className="text-sm font-bold text-white/70 hover:text-white">
              ← Retour à Devenir vendeur
            </Link>

            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              Profil vendeur · Business
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Développez votre boutique avec un vrai espace business.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Le profil Business est conçu pour les boutiques, entreprises et vendeurs réguliers
              qui ont besoin de stock, commandes, employés, analytics et publicité.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=seller_business" className="btn-primary">
                Créer un compte business
              </Link>

              <Link href="/contact" className="btn-secondary border-white/30 text-white">
                Demander un devis
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5 text-neutral-950">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo-haiti-mache-hibiscus.png"
                  alt="Haiti Maché"
                  className="h-14 w-14 rounded-2xl object-contain"
                />
                <div>
                  <p className="font-black">Dashboard business</p>
                  <p className="text-sm text-neutral-500">Boutique professionnelle</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Commandes", "128"],
                  ["Revenus", "245k HTG"],
                  ["Produits", "86"],
                  ["Publicités", "7"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-sm text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border p-4">
                <p className="font-black">Actions prioritaires</p>
                <div className="mt-3 space-y-2">
                  {[
                    "Préparer 12 commandes",
                    "Relancer 3 produits sponsorisés",
                    "Vérifier 8 stocks faibles",
                  ].map((task) => (
                    <p key={task} className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
                      {task}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#071f3d] p-4 text-white">
                <p className="text-sm text-white/60">Boutique publique</p>
                <p className="mt-1 text-xl font-black">/store/business-shop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Avantages business
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Pour les vendeurs qui veulent grandir.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefits.map((item) => (
            <div key={item} className="card p-5">
              <p className="font-bold">✓ {item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-14">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Outils inclus
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Marketplace + SaaS avancé.
            </h2>

            <p className="mt-4 text-neutral-500">
              Le profil Business peut vendre sur Maché et utiliser les outils internes pour gérer
              son activité commerciale.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map(([title, text]) => (
              <div key={title} className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Formules recommandées
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Des plans pour boutiques actives.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Le business peut commencer avec une formule Pro puis passer en Business selon le
              volume, les employés, les publicités et les besoins de support.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.name} className="card p-6">
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className="mt-3 text-3xl font-black text-[var(--mache-primary)]">
                  {plan.price}
                </p>
                <p className="mt-3 text-sm leading-7 text-neutral-500">{plan.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="guide-vendeur" className="bg-[#071f3d] py-14 text-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase text-orange-300">
              Étapes business
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Lancer votre boutique business.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#071f3d]">
                  {index + 1}
                </div>
                <p className="mt-4 text-sm font-bold leading-6 text-white/85">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="card p-6">
            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte Haiti Maché"
              className="mx-auto max-h-[360px] object-contain"
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Besoin d’un accompagnement ?
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Faites grandir votre boutique avec Maché.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              L’équipe Maché peut vous aider à choisir la bonne formule, préparer votre catalogue
              et activer les outils adaptés à votre business.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register?role=seller_business" className="btn-primary">
                Créer un compte business
              </Link>

              <Link href="/contact" className="btn-secondary">
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
