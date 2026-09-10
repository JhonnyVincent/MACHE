/*
  PAGE : connexion par code reçu par e-mail

  Deux étapes sur la même page :
  1. saisie de l'adresse -> envoi d'un code à 6 chiffres
  2. saisie du code -> ouverture de la session

  Aucun mot de passe, aucun lien à ouvrir : le code est recopié dans
  l'onglet où la personne se trouve déjà.
*/

import Link from "next/link";
import { requestCodeAction, verifyCodeAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_email: "Entrez votre adresse e-mail.",
  missing_code: "Entrez le code reçu par e-mail.",
  unknown_email:
    "Aucun compte n'existe avec cette adresse. Vérifiez l'orthographe ou créez un compte.",
  send_failed:
    "L'envoi du code a échoué. Réessayez dans un instant.",
  too_many:
    "Trop de demandes en peu de temps. Patientez une minute avant de redemander un code.",
  code_invalid: "Code incorrect. Vérifiez les 6 chiffres reçus.",
  code_expired: "Ce code a expiré. Demandez-en un nouveau.",
};

export default async function LoginWithCodePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    email?: string;
    next?: string;
    sent?: string;
  }>;
}) {
  const { error, email, next, sent } = await searchParams;

  const message = error ? errorMessages[error] || error : "";
  const codeSent = sent === "1";

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Connexion par code</h1>

        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {codeSent
            ? "Un code à 6 chiffres vient d'être envoyé à votre adresse. Il est valable quelques minutes."
            : "Entrez votre adresse e-mail : vous recevrez un code à saisir ici. Aucun mot de passe n'est nécessaire."}
        </p>

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        {codeSent ? (
          <>
            <form action={verifyCodeAction} className="mt-6 space-y-4">
              <input type="hidden" name="email" value={email || ""} />
              <input type="hidden" name="next" value={next || ""} />

              <div>
                <label className="text-sm font-bold" htmlFor="token">
                  Code reçu
                </label>
                <input
                  id="token"
                  className="input mt-2 text-center text-2xl tracking-[0.4em]"
                  name="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="000000"
                  autoFocus
                  required
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Envoyé à {email}
                </p>
              </div>

              <button className="btn-primary w-full" type="submit">
                Me connecter
              </button>
            </form>

            <form action={requestCodeAction} className="mt-3">
              <input type="hidden" name="email" value={email || ""} />
              <input type="hidden" name="next" value={next || ""} />
              <button
                className="text-sm text-neutral-500 underline"
                type="submit"
              >
                Je n&apos;ai rien reçu — renvoyer un code
              </button>
            </form>
          </>
        ) : (
          <form action={requestCodeAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next || ""} />

            <input
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Votre adresse e-mail"
              defaultValue={email || ""}
              autoFocus
              required
            />

            <button className="btn-primary w-full" type="submit">
              Recevoir mon code
            </button>
          </form>
        )}

        <div className="mt-6 border-t pt-4">
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-sm text-neutral-500 underline"
          >
            Utiliser plutôt mon mot de passe
          </Link>
        </div>
      </div>
    </main>
  );
}
