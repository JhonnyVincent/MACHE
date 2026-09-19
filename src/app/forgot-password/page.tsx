/*
  Cette page définissait sa propre `forgotPasswordAction`, du même nom
  que celle importée juste au-dessus. La locale masquait l'importée :
  c'est elle qui s'exécutait, et elle ne vérifiait pas la configuration
  avant d'appeler Supabase. Le formulaire répondait donc par une
  exception serveur — un écran gris — là où l'action du module, elle,
  avait été protégée.

  Le doublon est retiré. Une seule action, dans ./actions.ts, comme pour
  les autres formulaires.
*/
import { forgotPasswordAction } from "./actions";
import { supabaseConfigured } from "@/lib/supabase/env";

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

        {!supabaseConfigured() && (
          <div className="mt-4 rounded-xl border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-sm leading-relaxed text-neutral-700">
            La réinitialisation des comptes internes n&apos;est pas disponible
            pour le moment.
          </div>
        )}

        {supabaseConfigured() && (
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
        )}
      </div>
    </main>
  );
}
