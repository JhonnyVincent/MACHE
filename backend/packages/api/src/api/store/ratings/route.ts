/*
  ROUTE : les avis publiés d'une boutique ou d'un produit.

  Pourquoi elle existe

  Mercur enregistre les avis et les modère, et un client ne peut noter
  que ce qu'il a réellement commandé — l'API exige l'identifiant de la
  commande. C'est la bonne conception : un avis y est adossé à un achat.

  Mais l'API publique n'expose rien. Les clients pouvaient déposer des
  avis que personne ne pouvait lire, et les boutiques n'affichaient donc
  aucune note. Cette route comble ce trou, sans rien ajouter au modèle.

  Ce qu'elle ne montre pas

  Seuls les avis dont le statut est « publié ». Un avis en attente de
  modération ou rejeté n'apparaît jamais : c'est ce à quoi sert la
  modération, et la contourner ici la viderait de son sens.

  Et quand il n'y a aucun avis, elle renvoie une moyenne nulle plutôt
  que zéro. « 0 sur 5 » se lit comme une très mauvaise note ; l'absence
  d'avis n'est pas une mauvaise note.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/* Assez pour se faire une idée, pas au point de charger une page entière. */
const MAX_NOTES = 20;

type ReviewRow = {
  id: string;
  rating: number;
  customer_note: string | null;
  seller_note: string | null;
  status: string;
  created_at: string;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sellerId = str(req.query.seller_id);
  const productId = str(req.query.product_id);

  if (!sellerId && !productId) {
    return res.status(400).json({
      message: "Indiquez seller_id ou product_id.",
    });
  }

  if (sellerId && productId) {
    return res.status(400).json({
      message: "Indiquez seller_id OU product_id, pas les deux.",
    });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  /* L'un des deux est renseigné : les deux cas sont écartés plus haut. */
  const subjectId = (sellerId ?? productId) as string;

  const { data } = await query.graph({
    entity: sellerId ? "seller" : "product",
    fields: [
      "id",
      "reviews.id",
      "reviews.rating",
      "reviews.customer_note",
      "reviews.seller_note",
      "reviews.status",
      "reviews.created_at",
    ],
    filters: { id: subjectId },
  });

  const subject = (data as { reviews?: (ReviewRow | null)[] }[])[0];

  /*
    Une liaison dont l'avis a disparu rend un élément vide. On l'écarte,
    sinon il compterait comme une note sans en être une.
  */
  const published = (subject?.reviews ?? [])
    .filter((review): review is ReviewRow => Boolean(review?.id))
    .filter((review) => review.status === "published");

  if (published.length === 0) {
    return res.json({ count: 0, average: null, reviews: [] });
  }

  const total = published.reduce((sum, review) => sum + Number(review.rating || 0), 0);

  /*
    Une décimale. Deux donneraient une précision que trois avis ne
    portent pas.
  */
  const average = Math.round((total / published.length) * 10) / 10;

  const reviews = [...published]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, MAX_NOTES)
    .map((review) => ({
      id: review.id,
      rating: Number(review.rating) || 0,
      note: review.customer_note,
      /* La réponse du vendeur, quand il en a écrit une. */
      seller_note: review.seller_note,
      created_at: review.created_at,
    }));

  return res.json({ count: published.length, average, reviews });
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
