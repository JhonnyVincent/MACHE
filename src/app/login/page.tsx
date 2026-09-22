import { supabaseConfigured } from "@/lib/supabase/env";
import { AuthDoors } from "@/components/auth-doors";
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

/*
  Connexion des comptes internes MACHÉ.

  Ce n'est plus la porte des clients ni celle des vendeurs : le compte
  client vit dans le backend commerce (/compte/connexion), le compte
  vendeur dans le panneau vendeur. Supabase ne porte plus que les rôles
  internes — agents, partenaires, administration.
*/
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  /*
    Sans Supabase, le formulaire de cette page ne peut pas
    aboutir : on ne l'affiche pas. Un formulaire qui échoue à
    l'envoi fait recommencer en croyant s'être trompé.
  */
  if (!supabaseConfigured()) {
    return <AuthDoors what='Elle servait à se connecter avec un compte interne.' />;
  }

  const { error, next } = await searchParams;

  const safeError = error ? decodeURIComponent(error) : "";
  const message = errorMessages[safeError] || safeError;
  const showLinkHelp = linkErrors.has(safeError);
  const configured = supabaseConfigured();

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Connexion personnel MACHÉ</h1>

        <p className="mt-2 text-sm text-neutral-500">
          Agents, partenaires et administration.
        </p>

        {!configured && (
          <div className="mt-4 rounded-xl border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-sm leading-relaxed text-neutral-700">
            La connexion des comptes internes n&apos;est pas disponible pour le
            moment.
          </div>
        )}

        {/*
          Les deux parcours qui fonctionnent sont nommés avant le
          formulaire : un client ou un vendeur qui atterrit ici ne doit
          pas le remplir pour découvrir qu'il s'est trompé de porte.
        */}
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
          <p>
            Vous êtes <strong>client</strong> ?{" "}
            <Link href="/compte/connexion" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Connexion client
            </Link>
            .
          </p>
          <p className="mt-1">
            Vous êtes <strong>vendeur</strong> ?{" "}
            <Link href="/dashboard/seller" className="font-semibold text-[var(--mache-primary)] hover:underline">
              Espace vendeur
            </Link>
            .
          </p>
        </div>

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

        {/*
          Sans base de comptes, le formulaire est retiré : le remplir
          pour se voir refuser à l'envoi n'apprend rien à personne.
        */}
        {configured && (
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
        )}
      </div>
    </main>
  );
}
