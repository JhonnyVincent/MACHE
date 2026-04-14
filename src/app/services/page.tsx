import Link from "next/link";

const services = [
  {
    icon: "📊",
    title: "Dashboard vendeur",
    text: "Gérez ventes, stocks, commandes et activité boutique dans une logique marketplace moderne."
  },
  {
    icon: "💳",
    title: "Paiements intégrés",
    text: "Architecture prête pour Stripe, PayPal, méthodes locales et cash on delivery."
  },
  {
    icon: "🤖",
    title: "Rédaction assistée",
    text: "Structure prête pour générer descriptions produit, titres et contenus multilingues."
  },
  {
    icon: "🧾",
    title: "Facturation",
    text: "Données et structure prévues pour factures PDF, historiques et suivi commande."
  },
  {
    icon: "📦",
    title: "Suivi logistique",
    text: "Prévu pour livraisons, statuts d’expédition, tracking et conformité export."
  },
  {
    icon: "💬",
    title: "Chat & support",
    text: "Base prête pour échanges acheteur-vendeur, notifications et support plateforme."
  }
];

export default function ServicesPage() {
  return (
    <main>
      <section className="bg-[var(--mache-dark)] py-14 text-center text-white">
        <div className="container-page">
          <div className="mb-3 text-[10px] font-[700] uppercase tracking-[0.14em] text-[var(--mache-primary-strong)]">
            Nos services
          </div>

          <h1 className="text-[clamp(28px,5vw,54px)] font-[900] leading-[1.04] tracking-[-0.05em]">
            Tout pour vendre en ligne
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-7 text-white/55">
            Outils, paiements, logistique, conformité, support et structure e-commerce
            complète pour faire grandir Mache comme un vrai business.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="card p-6 transition hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--mache-primary-soft)] text-2xl">
                {service.icon}
              </div>

              <h2 className="text-[16px] font-[800]">{service.title}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[var(--mache-muted)]">
                {service.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="overflow-hidden rounded-[20px] bg-[var(--mache-dark)] px-6 py-12 text-center text-white md:px-10">
          <h2 className="text-[clamp(24px,4vw,42px)] font-[900] tracking-[-0.04em]">
            Prêt à commencer ?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-7 text-white/55">
            Inscription, catalogue, commandes, paiements et croissance vendeur :
            toute l’architecture Mache est pensée pour évoluer proprement.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary">
              Créer ma boutique
            </Link>
            <Link href="/about" className="btn-secondary">
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
