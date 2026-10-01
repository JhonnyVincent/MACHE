/*
  LE MENU DU PANNEAU VENDEUR, SIMPLIFIÉ.

  Le panneau Mercur montre tout ce qu'une grande boutique en ligne
  utilise. Pour un vendeur MACHE qui débute, la moitié de ces rubriques
  ne sert à rien et fait peur. On garde, dans l'ordre d'usage :
  Accueil, Commandes, Produits (avec Offres et Stock),
  Fournisseurs, Devis,
  Clients, Promotions, Versements, Avis, Chiffres.

  Masqué (toujours joignable par son adresse si un jour il sert) :
  listes de prix, collections, catégories (les rayons sont fixés par
  MACHE), groupes de clients, campagnes, réservations.
*/
import { defineNavigationConfig } from "@mercurjs/dashboard-sdk";

export default defineNavigationConfig({
  items: [
    { id: "orders", rank: 1 },
    { id: "products", rank: 2 },
    { id: "customers", rank: 5 },
    { id: "promotions", rank: 6 },
    { id: "payouts", rank: 7 },
    /* Mercur ne traduit pas ce libellé en français. */
    { id: "reviews", rank: 8, label: "Avis" },
    { id: "price-lists", hidden: true },
    { id: "collections", hidden: true },
    { id: "categories", hidden: true },
    { id: "customer-groups", hidden: true },
    { id: "campaigns", hidden: true },
    { id: "reservations", hidden: true },
  ],
});
