export default function ExportPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-bold">Export avec Mache</h1>
        <p className="mt-4 text-neutral-500">
          Prépare les ventes depuis Haïti et la Caraïbe vers les marchés internationaux.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Fournisseurs</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Architecture prête pour fournisseurs et vendeurs pros.
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Logistique</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Prévu pour shipping, tracking, zones et conformité.
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold">Paiement</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Prévu pour paiements internationaux et méthodes locales.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
