import Link from "next/link";

const benefits = [
  "Vendre en volume",
  "Travailler avec des boutiques",
  "Créer des prix de gros",
  "Recevoir des demandes business",
  "Préparer l’export futur",
  "Gérer plusieurs clients",
];

const tools = [
  ["Commandes volume", "Recevez et organisez les grosses commandes des boutiques et revendeurs."],
  ["Prix de gros", "Préparez des prix adaptés aux quantités et contrats business."],
  ["Catalogue fournisseur", "Présentez vos produits, lots, catégories et disponibilités."],
  ["Partenaires", "Travaillez avec livraison, export, marketing et services professionnels."],
  ["SaaS stock", "Suivez vos quantités, disponibilités, alertes et mouvements de produits."],
  ["Devis business", "Orientez les clients professionnels vers un contact ou devis personnalisé."],
];

const steps = [
  "Créer un compte fournisseur",
  "Ajouter votre activité",
  "Envoyer les documents",
  "Créer le catalogue gros",
  "Recevoir demandes et commandes",
];

const plans = [
  {
    name: "Business",
    price: "Sur devis",
    text: "Pour fournisseurs avec gros volume, partenaires et besoins avancés.",
  },
  {
    name: "Partenaire",
    price: "Contrat",
    text: "Pour grossistes, importateurs, exportateurs et acteurs stratégiques.",
  },
];

export default function SellFournisseurPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1800&auto=format&fit=crop"
            alt="Fournisseur Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href="/sell" className="text-sm font-bold text-white/70 hover:text-white">
              ← Retour à Devenir vendeur
            </Link>

            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              Profil vendeur · Fournisseur / Grossiste
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Vendez en gros aux boutiques et partenaires.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Le profil Fournisseur est pensé pour les grossistes, distributeurs, importateurs
              et vendeurs qui veulent gérer du volume, des lots et des relations business.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte fournisseur
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
                  <p className="font-black">Espace fournisseur</p>
                  <p className="text-sm text-neutral-500">Volume · B2B · Devis</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Lots actifs", "42"],
                  ["Demandes", "18"],
                  ["Clients B2B", "12"],
                  ["Stock total", "4.2k"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-sm text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border p-4">
                <p className="font-black">Demandes récentes</p>

                <div className="mt-3 space-y-2">
                  {[
                    "Boutique demande 200 unités",
                    "Revendeur veut un prix de gros",
                    "Partenaire livraison à confirmer",
                  ].map((task) => (
                    <p key={task} className="rounded-xl bg-orange-50 px-4 py-3 text-sm">
                      {task}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#071f3d] p-4 text-white">
                <p className="text-sm text-white/60">Catalogue fournisseur</p>
                <p className="mt-1 text-xl font-black">/store/grossiste-haiti</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Avantages fournisseur
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Pensé pour le volume et les relations business.
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
              Outils fournisseur
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Marketplace B2B + SaaS stock.
            </h2>

            <p className="mt-4 text-neutral-500">
              Le fournisseur peut utiliser Maché pour présenter son catalogue, recevoir des demandes,
              gérer son stock et préparer des ventes en volume.
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
              Des offres adaptées aux gros volumes.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Les fournisseurs ont souvent besoin d’un accompagnement personnalisé : volumes,
              contrats, logistique, visibilité, partenaires et options SaaS avancées.
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
              Étapes fournisseur
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Lancer votre espace fournisseur.
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
              Grossiste, importateur ou distributeur ?
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Parlons de votre volume et de vos besoins.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Maché peut vous aider à structurer votre présence, vos prix, vos lots et vos futurs
              partenariats de livraison ou d’export.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte fournisseur
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
