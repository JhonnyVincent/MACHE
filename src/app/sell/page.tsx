import Link from "next/link";

export default function SellPage() {
  return (
    <main className="container-page py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6">
          <h1 className="text-3xl font-bold">Vendre sur Mache</h1>
          <p className="mt-4 text-neutral-500">
            Développe ta boutique avec une logique marketplace + seller dashboard.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <h2 className="font-semibold">Particuliers</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Vente simple et directe avec contrôle de conformité.
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <h2 className="font-semibold">Business</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Catalogue, commandes, wallet, payouts et promotions.
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <h2 className="font-semibold">Vérification</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Documents, catégories autorisées et validation métier.
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <h2 className="font-semibold">Sécurité</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Anti-fraude, score de risque et revue manuelle si besoin.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/register" className="btn-primary">
              Créer un compte vendeur
            </Link>
            <Link href="/dashboard/seller" className="btn-secondary">
              Voir le dashboard
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <img
            src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop"
            alt="Sell on Mache"
            className="h-full min-h-[420px] w-full object-cover"
          />
        </div>
      </div>
    </main>
  );
}
