"use server";

/*
  ACTION : changer l'habillage du site.

  Ce que cette action NE valide pas : la clé. Le backend la refuse si
  elle lui est inconnue, et il est le seul à détenir la liste. La
  recopier ici créerait une seconde liste, qui prendrait du retard le
  jour où l'on ajoute un thème — et refuserait alors un habillage
  parfaitement valide.
*/

import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import { setSiteTheme } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/apparence";

function back(message: string, key: "error" | "success"): never {
  redirect(`${PAGE}?${key}=${encodeURIComponent(message)}`);
}

export async function setThemeAction(formData: FormData) {
  const key = String(formData.get("theme") || "").trim();

  if (!key) back("Aucun habillage choisi.", "error");

  try {
    const result = await setSiteTheme(key);

    if (!result.ok) back(result.reason, "error");

    /*
      Le storefront garde l'habillage cinq minutes en cache. Sans cette
      invalidation, l'administrateur lirait « enregistré », rechargerait
      l'accueil, ne verrait rien changer, et recommencerait — en
      concluant que la fonction est cassée alors qu'elle a marché.
    */
    revalidateTag("site-theme");
    revalidatePath("/", "layout");
    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(reasonOf(error), "error");
  }

  back("Habillage appliqué. Rechargez l'accueil pour le voir.", "success");
}
