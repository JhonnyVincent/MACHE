"use server";

/*
  ACTIONS : ouvrir un acheminement, le faire avancer, confirmer la
  remise par code.

  LE POINT ENTIER DU DISPOSITIF

  Aucune de ces actions ne peut marquer un colis « remis ». Le seul
  chemin vers cet état passe par la saisie du CODE que l'acheteur
  détient. Le vendeur ne voit jamais ce code : pour le saisir, il doit
  l'avoir obtenu de l'acheteur, en main propre, au moment de la remise.

  C'est ce qui donne sa valeur à la confirmation — et c'est ce qui
  conditionne le versement. Tant que le code n'est pas saisi, le
  versement reste retenu.

  Le sens de la preuve compte : le code est montré à l'ACHETEUR et
  saisi par CELUI QUI LIVRE. L'inverse ne prouverait rien — un vendeur
  qui montre un code qu'il possède déjà ne démontre aucune remise.

  Le jeton de suivi ne revient qu'UNE FOIS, à la création. C'est le
  lien qu'un acheteur sans compte utilisera pour suivre son colis et y
  lire son code. Il est affiché immédiatement, et le backend ne le
  redonnera pas.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getVendorSeller,
  createVendorDelivery,
  advanceVendorDelivery,
  confirmVendorDelivery,
} from "@/lib/medusa/vendor";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/seller/livraisons";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) || "").trim();
}

export async function createDeliveryAction(formData: FormData) {
  const orderId = field(formData, "order_id");
  const method = field(formData, "method");

  if (!orderId) done({ erreur: "Numéro de commande manquant." });

  if (!["seller", "agent", "relay", "carrier"].includes(method)) {
    done({
      erreur:
        "Choisissez comment la commande est acheminée : par vous, par un agent MACHÉ, vers un point de retrait, ou par un transporteur.",
    });
  }

  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  try {
    const result = await createVendorDelivery({
      orderId,
      method: method as "seller" | "agent" | "relay" | "carrier",
      recipientName: field(formData, "recipient_name"),
      recipientPhone: field(formData, "recipient_phone"),
      recipientAddress: field(formData, "recipient_address"),
      recipientDepartment: field(formData, "recipient_department"),
      relayPointId: field(formData, "relay_point_id"),
      carrierName: field(formData, "carrier_name"),
      trackingNumber: field(formData, "tracking_number"),
      trackingUrl: field(formData, "tracking_url"),
    });

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);

    /*
      Le jeton part dans l'adresse pour être affiché une fois. C'est
      le seul moment où il existe côté vendeur : ne pas le montrer
      ici le perdrait, et l'acheteur sans compte n'aurait plus aucun
      moyen d'atteindre sa page de suivi.
    */
    done({
      fait: "Acheminement ouvert. Le code de remise est désormais lisible par l'acheteur, et par personne d'autre.",
      /*
        L'identifiant ET le jeton : le lien de suivi a besoin des
        deux. N'en transmettre qu'un donnerait une adresse qui ne
        mène nulle part.
      */
      ...(result.data.accessToken
        ? { livraison: result.data.delivery.id, jeton: result.data.accessToken }
        : {}),
    });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }
}

export async function advanceDeliveryAction(formData: FormData) {
  const id = field(formData, "delivery_id");
  const status = field(formData, "status");

  if (!id || !status) done({ erreur: "Livraison manquante." });

  /*
    Une garde de plus, là où le geste part. Le backend refuse déjà
    « remis » sans code ; le refuser aussi ici évite qu'un bouton
    fabriqué à la main atteigne seulement la deuxième barrière.
  */
  if (status === "delivered") {
    done({
      erreur:
        "Une livraison ne se marque pas « remise » : elle se confirme avec le code de l'acheteur. C'est ce qui la prouve.",
    });
  }

  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  try {
    const result = await advanceVendorDelivery(id, status);

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({ fait: "Suivi mis à jour." });
}

export async function confirmDeliveryAction(formData: FormData) {
  const id = field(formData, "delivery_id");
  const code = field(formData, "code");

  if (!id) done({ erreur: "Livraison manquante." });

  if (!code) {
    done({
      erreur:
        "Demandez son code à l'acheteur au moment de la remise : c'est lui qui prouve que le colis est arrivé.",
    });
  }

  const seller = await getVendorSeller();

  if (!seller) redirect("/dashboard/seller/connexion");

  try {
    const result = await confirmVendorDelivery(id, code, field(formData, "note"));

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait: "Remise confirmée. Le versement de cette commande n'est plus retenu.",
  });
}
