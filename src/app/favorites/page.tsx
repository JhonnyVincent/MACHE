/*
  PAGE : favoris

  Les favoris sont enregistrés dans Supabase depuis l'ancien catalogue :
  chaque ligne porte un identifiant de produit Supabase. Le catalogue vit
  désormais dans Medusa, avec ses propres identifiants — les anciens ne
  désignent donc plus rien.

  Deux façons de traiter ça : faire disparaître la page, ou dire ce qui
  s'est passé. La seconde est la bonne : un client qui avait mis dix
  articles de côté doit comprendre pourquoi sa liste est vide, plutôt que
  de croire que MACHÉ a perdu ses données.

  Ses favoris ne sont pas supprimés. Ils attendent la table de
  correspondance entre les deux catalogues.
*/

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  /*
    Lecture entièrement défensive.

    `createSupabaseServerClient` lève quand la configuration manque, ce qui
    renvoyait une erreur 500 sur une page publique. Un visiteur n'a pas à
    tomber sur une page en panne parce qu'une variable d'environnement
    manque : il voit l'état « non connecté », qui est la vérité de son
    point de vue.
  */
  let signedIn = false;
  let savedCount = 0;

  try {
    const supabase = await createSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      signedIn = true;

      const { count } = await supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id);

      savedCount = count ?? 0;
    }
  } catch (error) {
    console.error("[favorites]", error);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--mache-text)] sm:text-4xl">
        Mes favoris
      </h1>

      {!signedIn ? (
        <div className="mt-6 rounded-[10px] border border-[var(--mache-line)] bg-white p-6">
          <p className="text-md text-[var(--mache-muted)]">
            Connectez-vous pour retrouver les articles que vous avez mis de
            côté.
          </p>
          <Link
            href="/compte/connexion?next=/favorites"
            className="mt-4 inline-block rounded-[6px] bg-[var(--mache-primary)] px-5 py-2.5 text-md font-bold text-white"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-[10px] border border-[#f3d9a5] bg-[#fdf6e8] p-5">
          <p className="text-md font-bold text-[var(--mache-text)]">
            Favoris en cours de reprise
          </p>

          <p className="mt-2 text-base leading-relaxed text-[var(--mache-muted)]">
            {savedCount > 0 ? (
              <>
                Vous avez <strong>{savedCount}</strong> article
                {savedCount > 1 ? "s" : ""} en favori. Ils ont été enregistrés
                sur l&apos;ancien catalogue de MACHÉ, dont les identifiants ne
                correspondent pas à ceux du nouveau. Rien n&apos;est
                supprimé : la liste réapparaîtra une fois la correspondance
                établie entre les deux catalogues.
              </>
            ) : (
              <>
                Vous n&apos;avez encore aucun favori. La mise en favori sera
                rebranchée sur le nouveau catalogue prochainement.
              </>
            )}
          </p>

          <Link
            href="/shop"
            className="mt-4 inline-block text-base font-semibold text-[var(--mache-primary)] hover:underline"
          >
            Parcourir le catalogue
          </Link>
        </div>
      )}
    </main>
  );
}
