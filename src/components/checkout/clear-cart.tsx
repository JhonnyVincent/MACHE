"use client";

/*
  COMPOSANT : vidage du panier après commande

  Le panier vit dans le navigateur : le serveur ne peut pas le vider. Ce
  composant s'en charge à l'affichage de la confirmation, une fois la
  commande réellement enregistrée — jamais avant.
*/

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart-provider";

export function ClearCartOnMount() {
  const { clearCart } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
