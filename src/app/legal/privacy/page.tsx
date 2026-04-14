export default function PrivacyPage() {
  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-4xl p-6">
        <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
        <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Mache collecte les données nécessaires à l’authentification, à la
            commande, au support et à la sécurité.
          </p>
          <p>
            Les données de vérification peuvent être utilisées pour conformité,
            prévention de fraude et contrôle qualité.
          </p>
          <p>
            Les données sensibles doivent être protégées via Supabase, permissions
            strictes et RLS.
          </p>
        </div>
      </div>
    </main>
  );
}
