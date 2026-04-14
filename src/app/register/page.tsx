import { registerAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs obligatoires."
};

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const safeError = error ? decodeURIComponent(error) : "";
  const message = errorMessages[safeError] || safeError;

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Créer un compte</h1>

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

          <select className="input" name="role" defaultValue="buyer">
            <option value="buyer">buyer</option>
            <option value="seller_individual">seller_individual</option>
            <option value="seller_business">seller_business</option>
            <option value="agent">agent</option>
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
