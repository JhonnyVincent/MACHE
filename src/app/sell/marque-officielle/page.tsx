import Link from "next/link";

const benefits = [
  "Badge marque officielle",
  "Boutique premium",
  "Image de marque contrôlée",
  "Meilleure visibilité",
  "Support prioritaire",
  "Campagnes sponsorisées",
];

const tools = [
  ["Badge officiel", "Affichez une identité vérifiée pour rassurer les clients."],
  ["Boutique premium", "Présentez votre marque avec bannière, logo, produits, avis et branding."],
  ["Publicité", "Sponsorisez vos produits dans les zones importantes de Maché."],
  ["Analytics premium", "Suivez performance, revenus, produits populaires et campagnes."],
  ["Catalogue officiel", "Organisez vos collections, nouveautés, promotions et produits phares."],
  ["Support business", "Bénéficiez d’un accompagnement adapté aux marques et entreprises."],
];

const steps = [
  "Créer un compte marque",
  "Envoyer les documents officiels",
  "Préparer le branding",
  "Publier le catalogue",
  "Activer visibilité premium",
];

const plans = [
  {
    name: "Business",
    price: "Sur devis",
    text: "Pour marques locales, boutiques premium et entreprises vérifiées.",
  },
  {
    name: "Premium",
    price: "Contrat",
    text: "Pour marques officielles avec campagnes, support et visibilité renforcée.",
  },
];

export default function SellMarqueOfficiellePage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1800&auto=format&fit=crop"
            alt="Marque officielle Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href="/sell" className="text-sm font-bold text-white/70 hover:text-white">
              ← Retour à Devenir vendeur
            </Link>

            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              Profil vendeur · Marque officielle
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Donnez à votre marque une boutique officielle sur Maché.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Le profil Marque officielle est pensé pour les entreprises qui veulent une présence
              premium, un badge vérifié, une boutique soignée et une visibilité renforcée.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte marque
              </Link>

              <Link href="/contact" className="btn-secondary border-white/30 text-white">
                Contacter l’équipe
              </Link>
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
                  <h2 className="text-2xl font-black">Marque Soleil</h2>
                  <p className="text-sm text-neutral-500">
                    Marque officielle · Vérifiée
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[#071f3d] p-4 text-white">
                <p className="text-sm text-white/60">Boutique officielle</p>
                <p className="mt-1 text-xl font-black">/store/marque-soleil</p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {["Badge", "Pub", "Stats"].map((item) => (
                  <div key={item} className="rounded-2xl bg-neutral-50 p-3 text-center">
                    <p className="font-black">{item}</p>
                    <p className="mt-1 text-xs text-neutral-500">Premium</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-black">⭐ 4.9 / 5</p>
                  <p className="text-sm text-neutral-500">Support prioritaire</p>
                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[var(--mache-primary)]">
                  Officiel
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Avantages marque
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Une présence premium pour inspirer confiance.
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
              Outils premium
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Branding, visibilité et confiance.
            </h2>

            <p className="mt-4 text-neutral-500">
              Une marque officielle a besoin d’un espace plus contrôlé, plus propre et plus visible
              qu’une boutique classique.
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
              Des offres pour marques sérieuses.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Les marques officielles peuvent avoir des besoins spécifiques : badge, support,
              campagnes sponsorisées, branding, statistiques et accompagnement.
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
              Étapes marque officielle
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Lancer votre boutique officielle.
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
              Marque, entreprise ou distributeur officiel ?
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Construisons une présence premium pour votre marque.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Maché peut vous accompagner pour préparer votre boutique officielle, vos campagnes,
              votre catalogue et votre visibilité sur la marketplace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer un compte marque
              </Link>

              <Link href="/contact" className="btn-secondary">
                Contacter l’équipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
