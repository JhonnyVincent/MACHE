/*
  ROUTE : les articles réellement les plus vendus.

  POURQUOI ELLE EST ÉCRITE AVEC AUTANT DE PRÉCAUTIONS

  « Les plus vendus » est le rayon qu'on invente le plus volontiers. Il
  suffit de prendre quatre produits au hasard : personne ne peut
  vérifier, et l'accueil paraît plein. Sauf que ce rayon-là ment à deux
  personnes à la fois — l'acheteur, qui croit suivre le choix des
  autres, et le vendeur, qui se croit mis en avant par son mérite alors
  qu'il a été tiré au sort.

  Cette route ne compte donc que des commandes réelles, et refuse de
  répondre quand il n'y en a pas assez pour que le mot « classement »
  veuille dire quelque chose.

  LES TROIS RÈGLES QUI DÉCIDENT DE CE QU'ELLE PUBLIE

  1. Les commandes annulées ne comptent pas. Une vente annulée n'est
     pas une vente. Les brouillons non plus : ils ne sont pas passés.

  2. Une fenêtre de 90 jours. « Les plus vendus » doit dire ce qui se
     vend MAINTENANT. Un cumul depuis toujours finit par figer les
     mêmes quatre produits pour l'éternité, et le rayon cesse de dire
     quoi que ce soit.

  3. Des seuils. Un produit vendu une fois n'est pas un best-seller,
     c'est un produit vendu une fois. En dessous, la route renvoie une
     liste vide et l'accueil n'affiche pas le rayon — plutôt qu'un
     podium tiré de trois commandes.

  CE QU'ELLE NE PUBLIE PAS

  Le nombre de ventes. Afficher « 3 vendus » sur un jeune marché
  décourage l'acheteur au lieu de le rassurer, et révèle à chaque
  vendeur le chiffre d'affaires de ses concurrents. Le classement
  suffit : il dit l'ordre, pas les comptes.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/* Ce qu'une carte d'accueil peut montrer. */
const MAX = 8;

/* Une vente d'il y a six mois ne dit rien de ce qui part aujourd'hui. */
const WINDOW_DAYS = 90;

/*
  En dessous de ces deux seuils, il n'y a pas de classement, il y a du
  bruit. Ils sont bas — MACHÉ démarre — mais pas nuls : un seul
  acheteur ne doit pas pouvoir décider de ce que la page d'accueil met
  en avant, et c'est exactement ce qui se passerait à 1.
*/
const MIN_SALES_TO_RANK = 12;
const MIN_SALES_PER_PRODUCT = 3;

/* Une commande annulée n'est pas une vente ; un brouillon n'est pas passé. */
const IGNORED_STATUSES = new Set(["canceled", "draft"]);

type Counted = {
  product_id: string;
  handle: string | null;
  title: string;
  thumbnail: string | null;
  sold: number;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderService = req.scope.resolve(Modules.ORDER);

  /*
    En chaîne ISO, pas en `Date` : le filtre attend un scalaire, et un
    objet `Date` y est refusé à la compilation.
  */
  const since = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const orders = await orderService.listOrders(
    { created_at: { $gte: since } },
    {
      select: ["id", "status", "created_at"],
      relations: ["items"],
      order: { created_at: "DESC" },
      /*
        Une borne dure. Sans elle, cette route charge un jour toutes les
        commandes du trimestre à chaque visite de l'accueil — et c'est
        l'accueil, la page la plus demandée du site.
      */
      take: 2000,
    }
  );

  const byProduct = new Map<string, Counted>();
  let total = 0;

  for (const order of orders) {
    if (IGNORED_STATUSES.has(String(order.status))) continue;

    for (const item of (order.items ?? []) as any[]) {
      const productId = item?.product_id;

      if (!productId) continue;

      const quantity = Number(item?.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      total += quantity;

      const seen = byProduct.get(productId);

      if (seen) {
        seen.sold += quantity;
        continue;
      }

      byProduct.set(productId, {
        product_id: productId,
        handle: item?.product_handle ?? null,
        title: item?.product_title ?? item?.title ?? "",
        thumbnail: item?.thumbnail ?? null,
        sold: quantity,
      });
    }
  }

  /*
    LE REFUS.

    Trop peu de ventes pour qu'un classement signifie quelque chose :
    la route le dit franchement plutôt que de renvoyer un podium de
    trois articles. `ranked: false` permet à l'accueil de ne pas
    afficher le rayon du tout.
  */
  if (total < MIN_SALES_TO_RANK) {
    return res.json({ products: [], count: 0, ranked: false });
  }

  const products = [...byProduct.values()]
    .filter((entry) => entry.sold >= MIN_SALES_PER_PRODUCT)
    .sort((a, b) => b.sold - a.sold || a.title.localeCompare(b.title))
    .slice(0, MAX)
    /* Le classement, pas les comptes : `sold` ne sort pas d'ici. */
    .map(({ product_id, handle, title, thumbnail }) => ({
      id: product_id,
      handle,
      title,
      thumbnail,
    }));

  return res.json({
    products,
    count: products.length,
    ranked: products.length > 0,
  });
}
