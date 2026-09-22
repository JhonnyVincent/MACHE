import Link from "next/link";
import { AuthDoors } from "@/components/auth-doors";
import { supabaseConfigured } from "@/lib/supabase/env";

export default function RegisterSuccessPage() {
  /*
    Sans Supabase, le formulaire de cette page ne peut pas
    aboutir : on ne l'affiche pas. Un formulaire qui échoue à
    l'envoi fait recommencer en croyant s'être trompé.
  */
  if (!supabaseConfigured()) {
    return <AuthDoors what="Elle confirmait la création d'un compte interne." />;
  }

  return (
    <main className="container-page py-12">
      <div className="card mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold">Vérifie ton email</h1>
        <p className="mt-4 text-[var(--mache-muted)]">
          Ton compte a été créé. Clique sur le lien envoyé par email pour confirmer
          ton inscription, puis reviens te connecter sur Mache.
        </p>

        <div className="mt-6">
          <Link href="/login" className="btn-primary">
            Aller à la connexion
          </Link>
        </div>
      </div>
    </main>
  );
}
