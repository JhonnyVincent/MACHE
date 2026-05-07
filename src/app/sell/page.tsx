import Link from "next/link";

const sellerProfiles = [
  {
    title: "Petit vendeur",
    href: "/sell/particulier",
    badge: "Simple",
    description: "Pour vendre quelques produits rapidement avec un espace facile à gérer.",
    points: ["Vente locale", "Peu de stock", "Dashboard simple"],
  },
  {
    title: "Business",
    href: "/sell/business",
    badge: "Pro",
    description: "Pour les boutiques avec catalogue, commandes, livraisons et publicité.",
    points: ["Gros stock", "Analytics", "Produits sponsorisés"],
  },
  {
    title: "Fournisseur",
    href: "/sell/fournisseur",
    badge: "B2B",
    description: "Pour vendre en volume aux boutiques, revendeurs et partenaires.",
    points: ["Prix de gros", "Commandes volume", "Contrats"],
  },
  {
    title: "Marque officielle",
    href: "/sell/marque-officielle",
    badge: "Premium",
    description: "Pour les marques qui veulent une boutique vérifiée et une image forte.",
    points: ["Badge officiel", "Boutique premium", "Visibilité"],
  },
];

const modes = [
  {
    title: "Marketplace",
    text: "Vendez vos produits directement sur Maché.",
  },
  {
    title: "SaaS vendeur",
    text: "Gérez stock, produits, ventes et activité business.",
  },
  {
    title: "Marketplace + SaaS",
    text: "Vendez et gérez votre business depuis un seul espace.",
  },
];

const steps = [
  "Créer votre compte vendeur",
  "Choisir votre profil",
  "Ajouter vos informations",
  "Préparer vos produits",
  "Recevoir vos commandes",
];

const plans = [
  {
    name: "Starter",
    price: "Gratuit",
    text: "Pour commencer simplement.",
  },
  {
    name: "Pro",
    price: "Mensuel",
    text: "Pour vendeurs actifs.",
  },
  {
    name: "Business",
    price: "Sur devis",
    text: "Pour boutiques, marques et fournisseurs.",
  },
];

export default function SellPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1800&auto=format&fit=crop"
            alt="Vendre sur Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              Marketplace + SaaS vendeur
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Vendez sur Maché. Gérez votre boutique. Développez votre business.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Une plateforme pensée pour les particuliers, boutiques, fournisseurs et marques :
              vente en ligne, stock, commandes, publicité, dashboard vendeur et outils business.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte vendeur
              </Link>

              <Link
                href="/login?next=/dashboard/seller"
                className="btn-secondary bg-white text-[#071f3d]"
              >
                Se connecter vendeur
              </Link>

              <Link href="/contact" className="btn-secondary border-white/30 text-white">
                Nous contacter
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-3xl font-black">4+</p>
                <p className="text-sm text-white/65">types de vendeurs</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-3xl font-black">15</p>
                <p className="text-sm text-white/65">modules vendeurs</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-3xl font-black">360°</p>
                <p className="text-sm text-white/65">vente + SaaS + pub</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5 text-neutral-950">
              <div className="h-32 rounded-3xl bg-gradient-to-r from-orange-100 to-red-100" />

              <div className="-mt-10 flex items-end gap-4 px-4">
                <img
                  src="/images/logo-haiti-mache-hibiscus.png"
                  alt="Haiti Maché"
                  className="h-20 w-20 rounded-3xl border-4 border-white bg-white object-contain"
                />

                <div className="pb-2">
                  <h2 className="text-2xl font-black">Boutique Soleil</h2>
                  <p className="text-sm text-neutral-500">
                    Vendeur vérifié · Port-au-Prince
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#071f3d] p-4 text-white">
                <p className="text-sm text-white/60">Boutique publique</p>
                <p className="mt-1 text-xl font-black">/store/ma-boutique</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {["Stock", "Commandes", "Pub"].map((item) => (
                  <div key={item} className="rounded-2xl bg-neutral-50 p-3 text-center">
                    <p className="font-black">{item}</p>
                    <p className="mt-1 text-xs text-neutral-500">Actif</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-black">⭐ 4.8 / 5</p>
                  <p className="text-sm text-neutral-500">Temps de réponse rapide</p>
                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[var(--mache-primary)]">
                  Vérifié
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Choisissez votre profil
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Un espace adapté à chaque vendeur.
          </h2>

          <p className="mt-4 text-neutral-500">
            Chaque profil aura ses propres avantages, formules, modules SaaS et outils de vente.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {sellerProfiles.map((profile) => (
            <Link key={profile.title} href={profile.href} className="card group p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[var(--mache-primary)]">
                {profile.badge}
              </span>

              <h3 className="mt-4 text-2xl font-black group-hover:text-[var(--mache-primary)]">
                {profile.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-neutral-500">
                {profile.description}
              </p>

              <div className="mt-5 space-y-2">
                {profile.points.map((point) => (
                  <p key={point} className="text-sm font-medium">
                    ✓ {point}
                  </p>
                ))}
              </div>

              <p className="mt-6 text-sm font-black text-[var(--mache-primary)]">
                Voir le profil →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Marketplace ou SaaS
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Une seule plateforme, plusieurs façons de l’utiliser.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Certains vendeurs veulent vendre sur Maché. D’autres veulent seulement gérer leur
              stock et leur activité. Les plus avancés feront les deux.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modes.map((mode) => (
              <div key={mode.title} className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">{mode.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-500">{mode.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="card p-6">
            <h2 className="text-3xl font-black">Simulation dashboard vendeur</h2>

            <p className="mt-3 text-neutral-500">
              Un aperçu rapide de l’espace vendeur : simple, clair et orienté action.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Commandes", "24 nouvelles"],
                ["Stock faible", "8 produits"],
                ["Revenus", "245k HTG"],
                ["Publicités", "3 actives"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-neutral-50 p-5">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-sm text-neutral-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border p-5">
              <p className="font-black">À faire aujourd’hui</p>
              <div className="mt-3 space-y-2">
                {[
                  "Préparer 3 commandes",
                  "Ajouter du stock sur 5 produits",
                  "Vérifier une publicité sponsorisée",
                ].map((task) => (
                  <p key={task} className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
                    {task}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border bg-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1400&auto=format&fit=crop"
              alt="Dashboard vendeur Maché"
              className="h-[520px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="guide-vendeur" className="bg-[#071f3d] py-14 text-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase text-orange-300">
              Guide vendeur
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Devenir vendeur en quelques étapes.
            </h2>

            <p className="mt-4 text-white/65">
              Un parcours simple pour créer, vérifier et lancer votre activité.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-[#071f3d]">
                  {index + 1}
                </div>

                <p className="mt-4 text-sm font-bold leading-6 text-white/85">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Formules vendeurs
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Des formules simples au départ, évolutives ensuite.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Chaque profil vendeur pourra avoir ses propres options Marketplace, SaaS ou Hybrid.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="card p-6">
                <h3 className="text-xl font-black">{plan.name}</h3>

                <p className="mt-3 text-2xl font-black text-[var(--mache-primary)]">
                  {plan.price}
                </p>

                <p className="mt-3 text-sm leading-7 text-neutral-500">{plan.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="card p-6">
            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte Haiti Maché"
              className="mx-auto max-h-[380px] object-contain"
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Besoin d’aide ?
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Une question, un problème ou un devis business ?
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              L’équipe Maché peut accompagner les vendeurs, boutiques, fournisseurs et marques
              officielles pour choisir le bon profil et les bons modules.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                Contacter l’équipe
              </Link>

              <Link href="/register?role=seller" className="btn-secondary">
                Créer mon compte vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-white/70">
                Devenir vendeur Maché
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                Commencez petit. Grandissez avec Maché.
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Créez votre compte vendeur, choisissez votre profil et activez les outils adaptés :
                marketplace, SaaS ou les deux.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte vendeur
              </Link>

              <Link
                href="/login?next=/dashboard/seller"
                className="btn-secondary bg-white text-[#071f3d]"
              >
                J’ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
