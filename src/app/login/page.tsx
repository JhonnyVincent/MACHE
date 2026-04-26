import Link from "next/link";
import { loginAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs."
};

export default async function LoginPage({
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
        <h1 className="text-2xl font-bold">Connexion</h1>

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input className="input" name="password" type="password" placeholder="Mot de passe" required />

          <button className="btn-primary w-full" type="submit">
            Se connecter
          </button>

          <Link href="/forgot-password" className="block text-sm text-neutral-500">
            Mot de passe oublié ?
          </Link>
        </form>
      </div>
    </main>
  );
}
