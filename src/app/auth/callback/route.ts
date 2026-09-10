/*
  ROUTE : callback d'authentification Supabase

  Gère deux formes de liens e-mail :

  1. `token_hash` + `type` -> verifyOtp()
     Forme recommandée pour les applications SSR. Le lien se valide côté
     serveur, sans rien attendre du stockage du navigateur : il fonctionne
     donc même quand l'utilisateur ouvre l'e-mail sur un autre appareil,
     ou depuis le navigateur intégré de Gmail / Messenger / Instagram.

  2. `code` -> exchangeCodeForSession()
     Flux PKCE, conservé pour les connexions OAuth. Il exige que le
     `code_verifier` déposé lors de la demande soit encore présent dans le
     navigateur qui ouvre le lien. Pour un lien reçu par e-mail cette
     condition est rarement remplie, d'où l'erreur « PKCE code verifier
     not found in storage » : c'est le cas 1 qu'il faut utiliser pour la
     réinitialisation de mot de passe.
*/

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string): value is EmailOtpType {
  return (EMAIL_OTP_TYPES as string[]).includes(value);
}

/** Destination par défaut selon le type de lien. */
function defaultNextFor(type: EmailOtpType | null) {
  if (type === "recovery") return "/reset-password";
  return "/dashboard/buyer";
}

/*
  Codes d'erreur relayés à /login. La page de connexion les traduit ;
  on évite ainsi d'afficher le message brut de Supabase, en anglais et
  incompréhensible pour l'utilisateur.
*/
function failure(origin: string, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;
  const origin = requestUrl.origin;

  // Supabase renvoie ses propres erreurs en query string, par exemple
  // quand le lien a expiré ou a déjà servi.
  const providerError = params.get("error") || params.get("error_code");

  if (providerError) {
    // Supabase répartit l'information sur trois paramètres : un lien périmé
    // arrive en `error=access_denied&error_code=otp_expired`, le motif n'est
    // donc pas forcément dans le premier renseigné.
    const details = [
      params.get("error"),
      params.get("error_code"),
      params.get("error_description"),
    ]
      .filter(Boolean)
      .join(" ");

    const expired = /expired|used/i.test(details);

    return failure(origin, expired ? "link_expired" : "link_invalid");
  }

  const rawType = params.get("type");
  const type = rawType && isEmailOtpType(rawType) ? rawType : null;

  const tokenHash = params.get("token_hash");
  const code = params.get("code");

  const next = params.get("next") || defaultNextFor(type);

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      console.error("[auth/callback] verifyOtp:", error.message);

      const expired = /expired|invalid/i.test(error.message);

      return failure(origin, expired ? "link_expired" : "link_invalid");
    }

    return NextResponse.redirect(new URL(next, origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message);

      // Le verifier PKCE est absent : le lien a été ouvert dans un autre
      // navigateur que celui qui a fait la demande.
      if (/code verifier/i.test(error.message)) {
        return failure(origin, "link_other_browser");
      }

      return failure(origin, "link_invalid");
    }

    return NextResponse.redirect(new URL(next, origin));
  }

  return failure(origin, "link_invalid");
}
