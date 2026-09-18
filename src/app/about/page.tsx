export default function AboutPage() {
  return (
    <main>
      <section className="bg-[var(--mache-dark)] py-14 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--mache-primary-strong)]">
              À propos de Mache
            </div>

            <h1 className="text-hero font-black tracking-tightest">
              La marketplace née des Caraïbes
            </h1>

            <p className="mt-5 max-w-xl text-md leading-8 text-white/55">
              Mache veut construire une vraie plateforme e-commerce moderne pour
              Haïti, la Caraïbe et la diaspora, avec une approche crédible,
              scalable, sécurisée et pensée pour durer.
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px] bg-[var(--mache-dark)] p-8">
            <img
              src="/images/carte-haiti-mache.png"
              alt="Carte d'Haïti aux couleurs de MACHÉ"
              className="h-[340px] w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card p-6 text-center">
            <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
              2 800+
            </div>
            <div className="mt-1 text-xs text-[var(--mache-muted)]">
              Vendeurs actifs
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
              45 000+
            </div>
            <div className="mt-1 text-xs text-[var(--mache-muted)]">
              Produits listés
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
              12 pays
            </div>
            <div className="mt-1 text-xs text-[var(--mache-muted)]">
              Desservis
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-4xl font-black tracking-tightest text-[var(--mache-primary)]">
              98%
            </div>
            <div className="mt-1 text-xs text-[var(--mache-muted)]">
              Satisfaction client
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-4">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <h2 className="text-lg font-black">Mission</h2>
            <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
              Connecter les vendeurs caribéens et les acheteurs du monde entier
              via une marketplace moderne, fiable et inclusive.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-black">Vision</h2>
            <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
              Faire de Mache une référence e-commerce régionale capable de
              soutenir commerce local, diaspora et export.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-black">Valeurs</h2>
            <p className="mt-3 text-md leading-7 text-[var(--mache-muted)]">
              Confiance, qualité, accessibilité, ambition internationale et sécurité
              au cœur de la plateforme.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
