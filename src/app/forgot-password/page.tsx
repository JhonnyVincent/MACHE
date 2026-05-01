import { forgotPasswordAction } from "./actions";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>

        {success ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Un lien de réinitialisation a été envoyé à votre email.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === "missing_email"
              ? "Veuillez entrer votre email."
              : decodeURIComponent(error)}
          </div>
        ) : null}

        <form action={forgotPasswordAction} className="mt-6 space-y-4">
          <input
            className="input"
            name="email"
            type="email"
            placeholder="Votre email"
            required
          />

          <button className="btn-primary w-full" type="submit">
            Envoyer le lien
          </button>
        </form>
      </div>
    </main>
  );
}
