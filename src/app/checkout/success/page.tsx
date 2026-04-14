import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[var(--mache-success-soft)] text-3xl">
          ✅
        </div>

        <h1 className="text-[clamp(28px,4vw,42px)] font-[900] tracking-[-0.04em]">
          Commande confirmée
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-7 text-[var(--mache-muted)]">
          Merci pour votre achat. Une confirmation de commande et les prochaines
          étapes de livraison seront affichées ici une fois les intégrations réelles activées.
        </p>

        <div className="mt-6 rounded-[12px] border border-[rgba(15,123,75,.18)] bg-[var(--mache-success-soft)] px-5 py-4 text-left text-[13px] text-[var(--mache-success)]">
          Référence : MCH-2026-4821 <br />
          Statut : Paiement reçu / préparation de commande
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Retour à l’accueil
          </Link>
          <Link href="/shop" className="btn-secondary">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </main>
  );
}
