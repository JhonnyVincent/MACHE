/*
  LE MENU DU PANNEAU VENDEUR.

  Le menu complet de Mercur est gardé. On ne fait que fixer l'ordre :
  Accueil, Commandes, Produits (avec Offres et Stock),
  Fournisseurs, Devis,
  Clients, Promotions, Versements, Avis, Chiffres, Applications.

  Le menu complet de Mercur est gardé : rien n'est masqué.
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
  ],
});
