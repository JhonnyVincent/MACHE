export default function AboutPage() {
  return (
    <main>
      <section className="bg-[var(--mache-dark)] py-14 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-3 text-[10px] font-[700] uppercase tracking-[0.14em] text-[var(--mache-primary-strong)]">
              À propos de Mache
            </div>

            <h1 className="text-[clamp(34px,5vw,60px)] font-[900] leading-[1.02] tracking-[-0.05em]">
              La marketplace née des Caraïbes
            </h1>

            <p className="mt-5 max-w-xl text-[14px] leading-8 text-white/55">
              Mache veut construire une vraie plateforme e-commerce moderne pour
              Haïti, la Caraïbe et la diaspora, avec une approche crédible,
              scalable, sécurisée et pensée pour durer.
            </p>
          </div>

          <div className="overflow-hidden rounded-[20px]">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80"
              alt="Marché"
              className="h-[400px] w-full object-cover opacity-85"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card p-6 text-center">
            <div className="text-[32px] font-[900] tracking-[-0.04em] text-[var(--mache-primary)]">
              2 800+
            </div>
            <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
              Vendeurs actifs
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-[32px] font-[900] tracking-[-0.04em] text-[var(--mache-primary)]">
              45 000+
            </div>
            <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
              Produits listés
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-[32px] font-[900] tracking-[-0.04em] text-[var(--mache-primary)]">
              12 pays
            </div>
            <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
              Desservis
            </div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-[32px] font-[900] tracking-[-0.04em] text-[var(--mache-primary)]">
              98%
            </div>
            <div className="mt-1 text-[11px] text-[var(--mache-muted)]">
              Satisfaction client
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-4">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <h2 className="text-lg font-[800]">Mission</h2>
            <p className="mt-3 text-[14px] leading-7 text-[var(--mache-muted)]">
              Connecter les vendeurs caribéens et les acheteurs du monde entier
              via une marketplace moderne, fiable et inclusive.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-[800]">Vision</h2>
            <p className="mt-3 text-[14px] leading-7 text-[var(--mache-muted)]">
              Faire de Mache une référence e-commerce régionale capable de
              soutenir commerce local, diaspora et export.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-[800]">Valeurs</h2>
            <p className="mt-3 text-[14px] leading-7 text-[var(--mache-muted)]">
              Confiance, qualité, accessibilité, ambition internationale et sécurité
              au cœur de la plateforme.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
