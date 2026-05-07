import Link from "next/link";

const benefits = [
  "Commencer avec peu de produits",
  "Vendre localement en Haïti",
  "Gérer depuis un téléphone",
  "Dashboard simple",
  "Boutique publique",
  "SaaS stock optionnel",
];

const steps = [
  "Créer un compte vendeur",
  "Choisir Petit vendeur",
  "Ajouter téléphone et adresse",
  "Publier vos premiers produits",
  "Recevoir vos premières commandes",
];

const tools = [
  ["Produits", "Ajoutez images, prix, description et stock."],
  ["Commandes", "Suivez les commandes reçues simplement."],
  ["Stock", "Recevez une alerte quand un produit est presque épuisé."],
  ["Boutique", "Ayez une page publique pour vos produits."],
];

export default function SellParticulierPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#071f3d] text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?q=80&w=1800&auto=format&fit=crop"
            alt="Petit vendeur Maché"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="container-page relative grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href="/sell" className="text-sm font-bold text-white/70 hover:text-white">
              ← Retour à Devenir vendeur
            </Link>

            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">
              Profil vendeur · Particulier
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              Commencez à vendre simplement sur Maché.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Le profil Petit vendeur est pensé pour les personnes qui veulent vendre quelques
              produits, tester le marché et gérer leur activité sans complexité.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?role=seller" className="btn-primary">
                Créer mon compte vendeur
              </Link>

              <Link href="/contact" className="btn-secondary border-white/30 text-white">
                Besoin d’aide ?
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
                  <p className="font-black">Dashboard simple</p>
                  <p className="text-sm text-neutral-500">Petit vendeur</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Produits", "10"],
                  ["Commandes", "3"],
                  ["Stock faible", "2"],
                  ["Revenus", "12k HTG"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-sm text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#071f3d] p-4 text-white">
                <p className="text-sm text-white/60">Boutique publique</p>
                <p className="mt-1 text-xl font-black">/store/mon-petit-shop</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Pourquoi ce profil ?
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Simple, rapide et adapté aux débuts.
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
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
              Marketplace + SaaS optionnel
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Vendez d’abord. Activez les outils quand vous grandissez.
            </h2>

            <p className="mt-4 leading-8 text-neutral-500">
              Un petit vendeur peut commencer avec la marketplace seulement. Ensuite, il peut
              activer le stock, les statistiques et les outils SaaS selon ses besoins.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map(([title, text]) => (
              <div key={title} className="rounded-3xl bg-white p-5 shadow-sm">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="guide-vendeur" className="container-page py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase text-[var(--mache-primary)]">
            Étapes
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Comment commencer ?
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#071f3d] text-lg font-black text-white">
                {index + 1}
              </div>
              <p className="mt-4 text-sm font-bold leading-6">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#071f3d] to-[#d20a1e] p-8 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-white/70">
                Petit vendeur Maché
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                Lancez votre première boutique aujourd’hui.
              </h2>

              <p className="mt-5 max-w-2xl leading-8 text-white/75">
                Commencez avec quelques produits, puis développez votre activité étape par étape.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/register?role=seller" className="btn-primary">
                Créer mon compte
              </Link>

              <Link href="/sell" className="btn-secondary bg-white text-[#071f3d]">
                Voir les autres profils
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
