"use server";

/*
  Connexion par code à usage unique (OTP e-mail).

  Pourquoi ce mode existe :
  le lien de réinitialisation classique repose sur le flux PKCE, qui exige
  que le lien soit ouvert dans le navigateur ayant fait la demande. Ouvert
  depuis Gmail ou depuis un autre téléphone, il échoue. Un code que la
  personne recopie est saisi dans l'onglet où elle se trouve déjà : il n'y
  a plus rien à retrouver dans le stockage du navigateur.
*/

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CODE_PAGE = "/login/code";

function back(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  redirect(`${CODE_PAGE}?${query.toString()}`);
}

/** Étape 1 : envoie le code à l'adresse saisie. */
export async function requestCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = String(formData.get("next") || "").trim();

  if (!email) {
    back({ error: "missing_email", next });
  }

  const supabase = await createSupabaseServerClient();

  /*
    `emailRedirectTo` sert de filet de sécurité.

    Tant que le template Magic Link n'affiche pas {{ .Token }}, Supabase
    envoie un lien plutôt qu'un code. Sans cette option, ce lien retombe
    sur la Site URL — l'accueil — et la personne ne comprend pas ce qui
    s'est passé. En le pointant vers /auth/callback, le lien ouvre bien
    une session et arrive sur le tableau de bord.
  */
  const headersList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    headersList.get("origin") ||
    `https://${headersList.get("host")}`;

  const destination = next || "/dashboard";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Cette page sert à se connecter, pas à s'inscrire : une adresse
      // inconnue ne doit pas créer un compte au passage.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        destination
      )}`,
    },
  });

  if (error) {
    console.error("OTP REQUEST ERROR:", error.message);

    const unknown = /signup|not found|disabled/i.test(error.message);
    const throttled = /rate|too many|seconds/i.test(error.message);

    back({
      error: throttled ? "too_many" : unknown ? "unknown_email" : "send_failed",
      email,
      next,
    });
  }

  back({ sent: "1", email, next });
}

/** Étape 2 : vérifie le code reçu et ouvre la session. */
export async function verifyCodeAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const next = String(formData.get("next") || "").trim();

  // Les codes sont souvent collés avec des espaces depuis l'e-mail.
  const token = String(formData.get("token") || "").replace(/\s/g, "");

  if (!email || !token) {
    back({ sent: "1", email, next, error: "missing_code" });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("OTP VERIFY ERROR:", error.message);

    const expired = /expired/i.test(error.message);

    back({
      sent: "1",
      email,
      next,
      error: expired ? "code_expired" : "code_invalid",
    });
  }

  redirect(next || "/dashboard");
}
