"use server";

/*
  ACTION : mettre un article de côté, ou l'en retirer.

  L'identité du client vient du cookie de session, jamais du formulaire :
  personne ne peut modifier la liste d'un autre en changeant sa requête.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toggleFavorite } from "@/lib/medusa/favorites";

export async function toggleFavoriteAction(formData: FormData) {
  const handle = String(formData.get("handle") || "").trim();
  const backTo = String(formData.get("return_to") || "/favorites").trim();

  /*
    On ne renvoie que vers une page de ce site. Une adresse complète
    venue du formulaire enverrait le visiteur ailleurs, ce qui est la
    forme la plus simple d'une redirection ouverte.
  */
  const safeBack = backTo.startsWith("/") && !backTo.startsWith("//")
    ? backTo
    : "/favorites";

  const result = await toggleFavorite(handle);

  if (!result.ok) {
    redirect(`${safeBack}${safeBack.includes("?") ? "&" : "?"}favori=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/favorites");
  revalidatePath(safeBack);

  redirect(safeBack);
}
