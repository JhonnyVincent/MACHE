export default function TermsPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold">Conditions générales</h1>
        <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            En utilisant Mache, vous acceptez les règles de la marketplace,
            les obligations vendeur et les règles de sécurité.
          </p>
          <p>
            Mache peut suspendre ou limiter des comptes en cas de fraude, abus,
            documents invalides ou contenu interdit.
          </p>
          <p>
            Les paiements, remboursements et litiges suivent les statuts et
            procédures définis par la plateforme.
          </p>
        </div>
      </div>
    </main>
  );
}
