import { resetPasswordAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs.",
  password_too_short: "Le mot de passe doit contenir au moins 8 caractères.",
  passwords_not_match: "Les mots de passe ne correspondent pas."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error
    ? errorMessages[error] || decodeURIComponent(error)
    : "";

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <form action={resetPasswordAction} className="mt-6 space-y-4">
          <input
            className="input"
            name="password"
            type="password"
            placeholder="Nouveau mot de passe"
            required
          />

          <input
            className="input"
            name="confirm_password"
            type="password"
            placeholder="Confirmer le mot de passe"
            required
          />

          <button className="btn-primary w-full" type="submit">
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </main>
  );
}
