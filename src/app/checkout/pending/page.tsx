/*
  PAGE : ancienne étape de paiement

  Cette page simulait un choix de mode de paiement sur des produits de
  démonstration, puis menait à une confirmation sans commande. Le tunnel réel
  vit désormais sur /checkout.

  La route est conservée et redirige : des liens externes ou des favoris
  peuvent encore la viser.
*/

import { redirect } from "next/navigation";

export default function CheckoutPendingPage() {
  redirect("/checkout");
}
