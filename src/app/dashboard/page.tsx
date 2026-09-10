/*
  PAGE : aiguillage /dashboard

  Redirige vers l'espace correspondant au rôle du compte connecté.

  Cette page ne devine plus. Quand la fiche `users` ne peut pas être lue
  — ligne absente, ou politique RLS qui empêche le compte de lire sa
  propre ligne — le rôle était remplacé par "buyer" et l'utilisateur
  atterrissait dans l'espace acheteur sans le moindre message. Un vendeur
  n'avait alors aucun moyen de comprendre pourquoi il n'accédait pas à son
  espace. On affiche désormais ce qui bloque, sans rediriger : une
  redirection vers /login donnerait une boucle.
*/

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSellerRole } from "@/lib/authz";

export default async function DashboardRedirectPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("[dashboard] lecture du profil:", error.message);
  }

  if (!profile) {
    return (
      <main className="container-page py-12">
        <div className="card mx-auto max-w-lg p-6">
          <h1 className="text-2xl font-bold">Profil introuvable</h1>

          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Vous êtes bien connecté, mais votre fiche utilisateur n&apos;a pas
            pu être lue. Tant qu&apos;elle est absente, votre rôle reste inconnu
            et aucun espace ne peut vous être attribué.
          </p>

          <dl className="mt-5 space-y-2 rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Compte</dt>
              <dd className="font-medium">{userData.user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Identifiant</dt>
              <dd className="font-mono text-xs">{userData.user.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Cause</dt>
              <dd className="text-right font-medium">
                {error
                  ? "Lecture refusée par la base"
                  : "Aucune ligne pour ce compte"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            {error
              ? "La base a refusé la lecture. Une politique d'accès (RLS) sur la table users empêche probablement le compte de lire sa propre ligne."
              : "Aucune ligne de la table users ne correspond à cet identifiant. La fiche n'a jamais été créée à l'inscription."}
          </p>

          <Link href="/" className="btn-secondary mt-6">
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const role = String(profile.role || "").toLowerCase().trim();

  if (isSellerRole(role)) {
    redirect("/dashboard/seller");
  }

  if (role === "agent") {
    redirect("/dashboard/agent");
  }

  if (role === "admin" || role === "super_admin") {
    redirect("/dashboard/admin");
  }

  if (role === "partner") {
    redirect("/dashboard/partner");
  }

  redirect("/dashboard/buyer");
}
