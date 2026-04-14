export default function AboutPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold">About Mache</h1>
        <p className="mt-4 text-lg text-neutral-500">
          Une marketplace premium et populaire conçue pour Haïti, la Caraïbe et la diaspora.
        </p>

        <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Mache mélange la logique Amazon / AliExpress, la simplicité Vinted
            et la puissance vendeur de Shopify.
          </p>
          <p>
            La plateforme permet aux acheteurs d’acheter, aux particuliers de vendre,
            aux vendeurs professionnels de structurer leur croissance, aux agents terrain
            d’être vérifiés publiquement et aux administrateurs de piloter l’ensemble.
          </p>
          <p>
            L’objectif est long terme : crédibilité, sécurité, expansion internationale,
            exportation et développement d’un vrai business durable.
          </p>
        </div>
      </div>
    </main>
  );
}
