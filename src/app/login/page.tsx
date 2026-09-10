import Link from "next/link";
import { loginAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs.",
  invalid_credentials: "Email ou mot de passe incorrect.",
  link_expired:
    "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.",
  link_invalid:
    "Ce lien de connexion n'est pas valide. Demandez-en un nouveau ci-dessous.",
  link_other_browser:
    "Ce lien doit être ouvert dans le navigateur qui a fait la demande. Demandez-en un nouveau ci-dessous, puis ouvrez-le sur le même appareil.",
  missing_code: "Lien incomplet. Demandez un nouveau lien ci-dessous.",
};

// Les erreurs de lien e-mail proposent toutes la même action : en redemander un.
const linkErrors = new Set([
  "link_expired",
  "link_invalid",
  "link_other_browser",
  "missing_code",
]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const safeError = error ? decodeURIComponent(error) : "";
  const message = errorMessages[safeError] || safeError;
  const showLinkHelp = linkErrors.has(safeError);

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Connexion</h1>

        {next === "/dashboard/seller" ? (
          <p className="mt-2 text-sm text-neutral-500">
            Connectez-vous pour accéder à votre dashboard vendeur.
          </p>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{message}</p>

            {showLinkHelp ? (
              <Link
                href="/forgot-password"
                className="mt-2 inline-block font-bold underline"
              >
                Recevoir un nouveau lien
              </Link>
            ) : null}
          </div>
        ) : null}

        {/*
          Connexion sans mot de passe, mise en avant : elle ne dépend
          d'aucun lien ni d'aucun stockage de navigateur, donc elle
          fonctionne même quand l'e-mail est ouvert ailleurs.
        */}
        <Link
          href={`/login/code${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="btn-secondary mt-6 w-full"
        >
          Recevoir un code par e-mail
        </Link>

        <div className="mt-5 flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          ou avec un mot de passe
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={loginAction} className="mt-5 space-y-4">
          <input type="hidden" name="next" value={next || ""} />

          <input
            className="input"
            name="email"
            type="email"
            placeholder="Email"
            required
          />

          <input
            className="input"
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
          />

          <button className="btn-primary w-full" type="submit">
            Se connecter
          </button>

          <Link
            href="/forgot-password"
            className="block text-sm text-neutral-500"
          >
            Mot de passe oublié ?
          </Link>
        </form>
      </div>
    </main>
  );
}
