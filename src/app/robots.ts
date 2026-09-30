/*
  LES CONSIGNES AUX MOTEURS DE RECHERCHE (/robots.txt).

  Tout le site public est ouvert. Restent fermés : les espaces connectés,
  le panier, la commande, les conversations et les liens personnels
  (suivi, devis), qui ne concernent qu'une personne. Le fichier indique
  aussi où trouver le plan du site.
*/

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        /* La page « Ouvrir ma boutique » vit sous /dashboard mais est publique : la règle la plus précise l'emporte. */
        allow: ["/", "/dashboard/seller/inscription"],
        disallow: [
          "/dashboard/",
          "/compte/",
          "/cart",
          "/checkout",
          "/favorites",
          "/messages/",
          "/suivi/",
          "/devis/",
          "/mot-de-passe",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
