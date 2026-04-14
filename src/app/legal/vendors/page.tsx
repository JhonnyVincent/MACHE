export default function VendorsLegalPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold">Règles vendeurs</h1>
        <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Les vendeurs doivent fournir des informations exactes, des documents
            valides et des produits autorisés.
          </p>
          <p>
            Les produits peuvent être auto-approuvés uniquement si toutes les
            conditions métier sont remplies.
          </p>
          <p>
            En cas d’anomalie, le produit peut être bloqué, mis en revue manuelle
            ou rejeté.
          </p>
        </div>
      </div>
    </main>
  );
}
