"use server";

/*
  ACTION : enregistrement depuis l'éditeur visuel.

  L'éditeur en formulaire enregistre un bloc à la fois ; celui-ci poste la
  mise en page entière, parce que le glisser-déposer réordonne plusieurs
  blocs d'un seul geste.

  La mise en page arrive du navigateur. Elle n'est donc pas enregistrée
  telle quelle : `sanitizeLayout` ne retient que les types de blocs
  déclarés, et pour chacun que les champs déclarés, dans le type déclaré.
  Une propriété inventée par le navigateur — ou par quiconque tiendrait la
  session du vendeur — n'atteint pas la base, et n'atteint donc jamais la
  page publique.

  L'identité du vendeur n'est pas prise dans ce qui est posté : elle vient
  du cookie de session, vérifiée par `saveStorefrontLayout`. Un vendeur ne
  peut pas écrire dans la vitrine d'un autre en modifiant sa requête.
*/

import { revalidatePath } from "next/cache";
import { saveStorefrontLayout } from "@/lib/medusa/vendor";
import { sanitizeLayout } from "@/lib/storefront/blocks";

export async function saveLayoutAction(
  layout: unknown
): Promise<{ ok: boolean; message: string }> {
  const { layout: clean, ignored } = sanitizeLayout(layout);

  const saved = await saveStorefrontLayout(clean);

  if (!saved.ok) return { ok: false, message: saved.reason };

  revalidatePath("/dashboard/seller/vitrine");
  revalidatePath("/dashboard/seller/vitrine/editeur");
  /* La vitrine publique doit refléter la modification immédiatement. */
  revalidatePath("/store/[slug]", "page");

  if (clean.content.length === 0) {
    return {
      ok: true,
      message:
        "Vitrine enregistrée, mais elle ne contient aucun bloc : votre boutique affichera la présentation par défaut.",
    };
  }

  /*
    Ce qui a été écarté est dit. Laisser croire que tout a été enregistré
    ferait chercher longtemps pourquoi la page publique diffère.
  */
  if (ignored > 0) {
    return {
      ok: true,
      message: `Vitrine enregistrée. ${ignored} bloc${ignored > 1 ? "s ont" : " a"} été écarté${ignored > 1 ? "s" : ""} : type inconnu de MACHÉ.`,
    };
  }

  return { ok: true, message: "Vitrine enregistrée. Elle est en ligne." };
}
