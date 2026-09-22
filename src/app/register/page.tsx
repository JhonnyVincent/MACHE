import Link from "next/link";
import { AuthDoors } from "@/components/auth-doors";
import { supabaseConfigured } from "@/lib/supabase/env";
import { registerAction } from "./actions";

const errorMessages: Record<string, string> = {
  missing_fields: "Veuillez remplir tous les champs obligatoires.",
};

const roleLabels: Record<string, string> = {
  buyer: "Acheteur / Client",
  seller_individual: "Vendeur particulier",
  seller_business: "Business / Boutique",
  supplier: "Fournisseur / Grossiste",
  official_brand: "Marque officielle",
  agent: "Agent",
};

function getDefaultRole(role?: string) {
  if (!role) return "buyer";

  if (role === "seller") return "seller_individual";

  if (
    role === "buyer" ||
    role === "seller_individual" ||
    role === "seller_business" ||
    role === "supplier" ||
    role === "official_brand" ||
    role === "agent"
  ) {
    return role;
  }

  return "buyer";
}

/*
  Cette page crée un compte Supabase.

  Depuis la bascule sur Medusa, ce n'est plus par là qu'on achète ni
  qu'on vend : le compte client vit dans le backend commerce
  (/compte/inscription) et le compte vendeur dans le panneau vendeur.
  Supabase ne porte plus que les rôles internes de MACHÉ — agents,
  partenaires, administration.

  Elle le disait pourtant : « Créez un compte client pour acheter sur
  Maché ». Quelqu'un qui suivait cette phrase créait un compte qui ne
  lui servait à rien, puis ne comprenait pas pourquoi son panier ne le
  reconnaissait pas.
*/
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  /*
    Sans Supabase, le formulaire de cette page ne peut pas
    aboutir : on ne l'affiche pas. Un formulaire qui échoue à
    l'envoi fait recommencer en croyant s'être trompé.
  */
  if (!supabaseConfigured()) {
    return <AuthDoors what='Elle servait à créer un compte interne.' />;
  }

  const { error, role } = await searchParams;

  const safeError = error ? decodeURIComponent(error) : "";
  const message = errorMessages[safeError] || safeError;
  const defaultRole = getDefaultRole(role);
  const configured = supabaseConfigured();

  const isProAccount =
    defaultRole === "seller_individual" ||
    defaultRole === "seller_business" ||
    defaultRole === "supplier" ||
    defaultRole === "official_brand" ||
    defaultRole === "agent";

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-bold">Créer un compte</h1>

        <p className="mt-2 text-sm text-neutral-500">
          {isProAccount ? (
            <>
              Compte interne MACHÉ :{" "}
              <span className="font-semibold text-neutral-900">
                {roleLabels[defaultRole]}
              </span>
              .
            </>
          ) : (
            "Compte interne MACHÉ."
          )}
        </p>

        {/*
          Sans base de comptes, le formulaire est retiré plutôt que
          désactivé ou laissé en place : un formulaire qu'on remplit pour
          se voir refuser à l'envoi est une fausse porte. Ce qui reste
          dit pourquoi, et où aller.
        */}
        {!configured && (
          <div className="mt-4 rounded-xl border border-[#f3d9a5] bg-[#fdf6e8] px-4 py-3 text-sm leading-relaxed text-neutral-700">
            La création de comptes internes n&apos;est pas disponible pour le
            moment.
          </div>
        )}

        {/*
          Les deux parcours qui fonctionnent sont nommés ici, avant le
          formulaire. Quelqu'un qui cherche à acheter ou à vendre ne doit
          pas avoir à le remplir pour découvrir qu'il s'est trompé de
          page.
        */}
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-600">
          <p>
            Pour <strong>acheter</strong> sur MACHÉ :{" "}
            <Link href="/compte/inscription" className="font-semibold text-[var(--mache-primary)] hover:underline">
              créer un compte client
            </Link>
            .
          </p>
          <p className="mt-1">
            Pour <strong>vendre</strong> :{" "}
            <Link href="/dashboard/seller" className="font-semibold text-[var(--mache-primary)] hover:underline">
              ouvrir une boutique
            </Link>
            .
          </p>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        {configured && (
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
            <option value="seller_business">Business / Boutique</option>
            <option value="supplier">Fournisseur / Grossiste</option>
            <option value="official_brand">Marque officielle</option>
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
        )}
      </div>
    </main>
  );
}
