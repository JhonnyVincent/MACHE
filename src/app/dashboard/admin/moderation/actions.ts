"use server";

/*
  ACTIONS : masquer un avis, retirer un article.

  AUCUNE NE SUPPRIME

  Un avis effacé ne laisse aucune trace de ce qui a été retiré ni
  pourquoi — et c'est la parole d'un acheteur qu'on retire. Rejeté, il
  disparaît du site mais reste consultable ici, ce qui compte le jour
  où son auteur demande pourquoi son avis n'apparaît plus.

  Un article supprimé rendrait incompréhensibles les commandes qui le
  portent. Retiré, elles restent lisibles.

  La session est revérifiée dans chaque action : entre l'affichage de
  la page et le clic, elle a pu expirer, et un geste de modération ne
  doit pas s'exécuter sur une session qu'on n'a plus.
*/

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  getAdminUser,
  setReviewStatus,
  setProductStatus,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/moderation";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

export async function setReviewStatusAction(formData: FormData) {
  const reviewId = String(formData.get("review_id") || "");
  const status = String(formData.get("status") || "");

  if (!reviewId || !status) done({ erreur: "Avis manquant." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setReviewStatus(
      reviewId,
      status as "published" | "rejected" | "pending"
    );

    if (!result.ok) done({ erreur: result.reason });

    /*
      Les avis s'affichent sur les fiches produit et les pages
      boutique, qui sont mises en cache. Sans invalidation, un avis
      masqué resterait visible et on croirait le geste sans effet.
    */
    revalidateTag("products");
    revalidateTag("sellers");
    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait:
      status === "rejected"
        ? "Avis masqué. Il n'apparaît plus sur le site, et reste consultable ici."
        : "Avis rétabli. Il réapparaît sur le site.",
  });
}

export async function setProductStatusAction(formData: FormData) {
  const productId = String(formData.get("product_id") || "");
  const status = String(formData.get("status") || "");
  const term = String(formData.get("q") || "");

  if (!productId || !status) done({ erreur: "Article manquant." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setProductStatus(
      productId,
      status as "published" | "rejected" | "draft"
    );

    if (!result.ok) done({ erreur: result.reason });

    revalidateTag("products");
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  /*
    La recherche est reportée dans la redirection : sans cela,
    retirer un article ferait perdre la liste qu'on était en train
    d'examiner, et il faudrait la retaper pour traiter le suivant.
  */
  done({
    ...(term ? { q: term } : {}),
    fait:
      status === "rejected"
        ? "Article retiré du site. Les commandes qui le portent restent lisibles."
        : "Article remis en vente.",
  });
}
