import { registerAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs obligatoires.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const { error, role } = await searchParams;

  const safeError = error ? decodeURIComponent(error) : "";
  const message = errorMessages[safeError] || safeError;

  const defaultRole =
    role === "seller" ? "seller_individual" : "buyer";

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Créer un compte</h1>

        {role === "seller" ? (
          <p className="mt-2 text-sm text-neutral-500">
            Vous créez un compte vendeur Maché.
          </p>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <form action={registerAction} className="mt-6 space-y-4">
          <input
            className="input"
            name="full_name"
            placeholder="Nom complet"
            required
          />

          <input
            className="input"
            name="email"
            type="email"
            placeholder="Email"
            required
          />

          <select className="input" name="role" defaultValue={defaultRole}>
            <option value="buyer">Acheteur / Client</option>
            <option value="seller_individual">Vendeur particulier</option>
            <option value="seller_business">Business / Fournisseur</option>
            <option value="agent">Agent</option>
          </select>

          <input
            className="input"
            name="password"
            type="password"
            placeholder="Mot de passe"
            minLength={6}
            required
          />

          <button className="btn-primary w-full" type="submit">
            Créer mon compte
          </button>
        </form>
      </div>
    </main>
  );
}
