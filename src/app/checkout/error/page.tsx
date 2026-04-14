export default function CheckoutErrorPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Erreur de paiement</h1>
        <p className="mt-4 text-neutral-500">
          Une erreur est survenue. Le système est prêt pour gérer les statuts
          failed, cancelled et requires_action.
        </p>
      </div>
    </main>
  );
}
